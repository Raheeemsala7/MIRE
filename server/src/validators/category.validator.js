const { z } = require('zod');

const categoryCreateSchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters').max(100),
  slug: z.string().optional(),
  description: z.string().optional(),
  image: z
    .object({
      url: z.string().url(),
      publicId: z.string().optional()
    })
    .optional(),
  parentCategory: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional()
});

const categoryUpdateSchema = categoryCreateSchema.partial();

module.exports = { categoryCreateSchema, categoryUpdateSchema };
