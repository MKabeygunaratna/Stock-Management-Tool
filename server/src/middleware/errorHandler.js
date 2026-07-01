const errorHandler = (err, req, res, next) => {
  if (err.code === 'P2002') {
    const field = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : err.meta?.target;
    return res.status(409).json({ message: `${field || 'Field'} already exists` });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ message: 'Record not found' });
  }

  if (err.code === 'P2003') {
    return res.status(409).json({ message: 'This record is referenced by other data and cannot be modified' });
  }

  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Something went wrong' : err.message;

  if (statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).json({ message });
};

module.exports = errorHandler;
