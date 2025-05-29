const { z } = require('zod');

const createCourseSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters long')
    .max(100, 'Title must not exceed 100 characters')
    .trim(),
  description: z.string()
    .min(10, 'Description must be at least 10 characters long')
    .max(1000, 'Description must not exceed 1000 characters')
    .trim(),
  price: z.number()
    .min(0, 'Price must be a positive number')
    .max(10000, 'Price must not exceed $10,000'),
  image: z.string()
    .url('Course image must be a valid URL')
    .optional()
    .or(z.literal('')),
  creatorId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid creator ID format'),
  category: z.enum(['Programming', 'Design', 'Business', 'Marketing', 'Photography', 'Music', 'Other']),
  duration: z.number()
    .min(0.5, 'Duration must be at least 0.5 hours')
    .max(500, 'Duration must not exceed 500 hours')
    .optional(),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional()
});

const updateCourseSchema = createCourseSchema.partial();

module.exports = {
  createCourseSchema,
  updateCourseSchema
};
