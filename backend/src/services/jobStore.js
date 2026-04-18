const { EventEmitter } = require('node:events');
const { randomUUID } = require('node:crypto');

const jobs = new Map();
const jobEvents = new EventEmitter();
const MAX_JOB_AGE_MS = 30 * 60 * 1000;

jobEvents.setMaxListeners(200);

function pruneExpiredJobs() {
  const now = Date.now();
  for (const [jobId, job] of jobs.entries()) {
    if (now - new Date(job.updatedAt).getTime() > MAX_JOB_AGE_MS) {
      jobs.delete(jobId);
      jobEvents.removeAllListeners(jobId);
    }
  }
}

function createJob({ source }) {
  pruneExpiredJobs();

  const timestamp = new Date().toISOString();
  const job = {
    jobId: randomUUID(),
    status: 'queued',
    source: source || 'unknown',
    createdAt: timestamp,
    updatedAt: timestamp,
    timeline: [],
    result: null,
  };

  jobs.set(job.jobId, job);
  return job;
}

function getJob(jobId) {
  pruneExpiredJobs();
  return jobs.get(jobId) || null;
}

function updateJob(jobId, patch) {
  const job = jobs.get(jobId);
  if (!job) return null;

  Object.assign(job, patch, { updatedAt: new Date().toISOString() });
  jobs.set(jobId, job);
  return job;
}

function emitJobEvent(jobId, event, payload = {}) {
  const job = jobs.get(jobId);
  const packet = {
    event,
    jobId,
    timestamp: new Date().toISOString(),
    ...payload,
  };

  if (job) {
    job.timeline.push(packet);
    if (job.timeline.length > 100) {
      job.timeline = job.timeline.slice(-100);
    }
    job.updatedAt = packet.timestamp;
  }

  jobEvents.emit(jobId, packet);
  return packet;
}

function subscribeToJob(jobId, listener) {
  jobEvents.on(jobId, listener);
  return () => jobEvents.off(jobId, listener);
}

module.exports = {
  createJob,
  getJob,
  updateJob,
  emitJobEvent,
  subscribeToJob,
};
