const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500;
  res.status(status).json({
    status: "error",
    message: err.message || "Error interno del servidor"
  });
};

export default (err, req, res, next) => {
  console.error(err);  
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ error: message });
};
