const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      const errorMessages = error.errors?.map(err => ({
        field: err.path.join('.'),
        message: err.message
      })) || [{ message: 'Validation failed' }];
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages
      });
    }
  };
};

module.exports = validateRequest;
