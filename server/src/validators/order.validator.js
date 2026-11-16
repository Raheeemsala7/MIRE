const { z } = require('zod');
const { OrderStatuses, PaymentMethods } = require('../models/Order');

const shippingAddressSchema = z.object({
  street: z.string().min(3, 'Street address is required'),
  building: z.string().optional(),
  apartment: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  governorate: z.string().min(2, 'Governorate is required'),
  postalCode: z.string().optional(),
  country: z.string().default('Egypt'),
  landmark: z.string().optional()
});

const customerInfoSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(8, 'Valid phone number is required'),
  secondaryPhone: z.string().optional()
});

const checkoutCreateOrderSchema = z.object({
  customerInfo: customerInfoSchema,
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.enum(Object.values(PaymentMethods)).default(PaymentMethods.COD),
  orderNotes: z.string().optional(),
  guestId: z.string().optional()
});

const manualCreateOrderSchema = z.object({
  customerInfo: customerInfoSchema,
  shippingAddress: shippingAddressSchema,
  items: z
    .array(
      z.object({
        productId: z.string(),
        variantSku: z.string(),
        quantity: z.number().int().min(1)
      })
    )
    .min(1),
  paymentMethod: z.enum(Object.values(PaymentMethods)).default(PaymentMethods.COD),
  orderNotes: z.string().optional(),
  source: z.enum(['WEBSITE', 'WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'MANUAL']).default('MANUAL'),
  sourceConversationId: z.string().optional()
});

const updateOrderStatusSchema = z.object({
  status: z.enum(Object.values(OrderStatuses)),
  reason: z.string().optional()
});

const bulkUpdateStatusSchema = z.object({
  orderIds: z.array(z.string()).min(1),
  status: z.enum(Object.values(OrderStatuses)),
  reason: z.string().optional()
});

const assignOrderSchema = z.object({
  employeeId: z.string()
});

const addInternalNoteSchema = z.object({
  note: z.string().min(2, 'Note content is required')
});

const logDeliveryAttemptSchema = z.object({
  status: z.enum(['NO_ANSWER', 'CUSTOMER_REFUSED', 'RESCHEDULED', 'CUSTOMER_CONFIRMED', 'FAILED']),
  notes: z.string().optional()
});

module.exports = {
  checkoutCreateOrderSchema,
  manualCreateOrderSchema,
  updateOrderStatusSchema,
  bulkUpdateStatusSchema,
  assignOrderSchema,
  addInternalNoteSchema,
  logDeliveryAttemptSchema
};
