const generateId = () => {
  return require('uuid').v4();
};

const formatPrice = (price, currency = 'USD') => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  });
  return formatter.format(price);
};

const validateObjectId = (id) => {
  return require('mongoose').Types.ObjectId.isValid(id);
};

const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input.trim().replace(/[<>]/g, '');
  }
  return input;
};

module.exports = {
  generateId,
  formatPrice,
  validateObjectId,
  sanitizeInput
};