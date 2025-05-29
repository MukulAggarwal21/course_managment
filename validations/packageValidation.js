const { z } = require('zod');

const createPackageSchema = z.object({
  title: z.enum(['Basic Pack', 'Premium Pack', 'Exclusive Pack']),
  courses: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid course ID format'))
    .min(1, 'Package must contain at least one course'),
  creatorId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid creator ID format'),
  image: z.string()
    .url('Package image must be a valid URL')
    .optional()
    .or(z.literal('')),
  discount: z.number()
    .min(0, 'Discount must be positive')
    .max(100, 'Discount cannot exceed 100%')
    .optional()
});

module.exports = {
  createPackageSchema
};
