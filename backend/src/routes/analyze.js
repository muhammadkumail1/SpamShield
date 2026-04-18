const express = require('express');
const { createJob, updateJob, emitJobEvent } = require('../services/jobStore');
const { runAnalysisJob } = require('../services/analysisService');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { text, source } = req.body || {};

    if (typeof text !== 'string' || text.trim().length < 5) {
      return res.status(400).json({
        message: 'The request body must include a text field with at least 5 characters.',
      });
    }

    if (source && typeof source !== 'string') {
      return res.status(400).json({
        message: 'The source field must be a string when provided.',
      });
    }

    const job = createJob({ source: source || 'unknown' });

    runAnalysisJob({
      jobId: job.jobId,
      text,
      source: source || 'unknown',
    }).catch((error) => {
      console.error('[analysis-job-failed]', error);
      updateJob(job.jobId, { status: 'failed' });
      emitJobEvent(job.jobId, 'failed', { message: 'Analysis job failed unexpectedly.' });
    });

    return res.status(202).json({
      jobId: job.jobId,
      status: job.status,
      streamUrl: `/api/jobs/stream/${job.jobId}`,
      statusUrl: `/api/jobs/${job.jobId}`,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
