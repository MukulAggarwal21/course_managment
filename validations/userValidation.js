const { z } = require('zod');

const createUserSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters long')
    .max(50, 'Name must not exceed 50 characters')
    .trim(),
  email: z.string()
    .email('Please enter a valid email address')
    .toLowerCase(),
  phone: z.string()
    .regex(/^\+?[\d\s-()]+$/, 'Please enter a valid phone number'),
  location: z.enum(['India', 'USA', 'UK', 'Canada', 'Australia', 'Germany', 'France', 'Other']),
  profileImage: z.string()
    .url('Profile image must be a valid URL')
    .optional()
    .or(z.literal(''))
});

const updateUserSchema = createUserSchema.partial();

module.exports = {
  createUserSchema,
  updateUserSchema
};
