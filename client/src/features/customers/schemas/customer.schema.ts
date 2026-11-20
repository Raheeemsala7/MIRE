import { z } from "zod";

export const customerAddressSchema = z.object({
  _id: z.string().optional(),
  street: z.string().trim().min(1, "Street address is required"),
  building: z.string().trim().optional().or(z.literal("")),
  apartment: z.string().trim().optional().or(z.literal("")),
  city: z.string().trim().min(1, "City is required"),
  governorate: z.string().trim().min(1, "Governorate is required"),
  postalCode: z.string().trim().optional().or(z.literal("")),
  country: z.string().trim().optional().or(z.literal("")),
  landmark: z.string().trim().optional().or(z.literal("")),
  isDefault: z.boolean().optional(),
});

export const customerSocialProfilesSchema = z.object({
  whatsapp: z.string().trim().optional().or(z.literal("")),
  instagram: z.string().trim().optional().or(z.literal("")),
  facebook: z.string().trim().optional().or(z.literal("")),
});

export const updateCustomerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name cannot exceed 100 characters")
    .optional(),
  email: z
    .string()
    .trim()
    .email("Invalid email address format")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .min(5, "Phone number is too short")
    .max(20, "Phone number cannot exceed 20 characters")
    .optional(),
  secondaryPhone: z
    .string()
    .trim()
    .max(20, "Secondary phone cannot exceed 20 characters")
    .optional()
    .or(z.literal("")),
  tags: z.array(z.string().trim().min(1)).optional(),
  notes: z
    .string()
    .max(2000, "Internal notes cannot exceed 2000 characters")
    .optional()
    .or(z.literal("")),
  socialProfiles: customerSocialProfilesSchema.optional(),
  addresses: z.array(customerAddressSchema).optional(),
});

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerAddressInput = z.infer<typeof customerAddressSchema>;

export const customerFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  sortBy: z.string().trim().optional(),
});
