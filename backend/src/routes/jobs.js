const express = require('express');
const { getJob, subscribeToJob } = require('../services/jobStore');

const router = express.Router();

router.get('/stream/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = getJob(jobId);

  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const send = (eventName, payload) => {
    res.write(`event: ${eventName}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  send('connected', { jobId, status: job.status });

  if (job.timeline.length) {
    for (const entry of job.timeline) {
      send(entry.event, entry);
    }
  }

  if (job.status === 'complete' && job.result) {
    send('complete', job.result);
    res.end();
    return undefined;
  }

  const unsubscribe = subscribeToJob(jobId, (packet) => {
    send(packet.event, packet.event === 'complete' ? job.result || packet : packet);
    if (packet.event === 'complete' || packet.event === 'failed') {
      unsubscribe();
      res.end();
    }
  });

  req.on('close', () => {
    unsubscribe();
  });

  return undefined;
});

router.get('/:jobId', (req, res) => {
  const job = getJob(req.params.jobId);

  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }

  return res.json(job);
});

module.exports = router;
