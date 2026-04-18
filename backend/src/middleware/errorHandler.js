function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Not Found',
    message: `No route found for ${req.method} ${req.originalUrl}`,
  });
}

function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  if (process.env.NODE_ENV !== 'test') {
    console.error('[api-error]', err);
  }

  res.status(status).json({
    error: status >= 500 ? 'Internal Server Error' : 'Request Error',
    message,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
