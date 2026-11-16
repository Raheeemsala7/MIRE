const { z } = require('zod');
const { ReturnStatuses } = require('../models/Return');

const requestReturnSchema = z.object({
  originalOrderId: z.string().min(1, 'Original Order ID is required'),
  items: z
    .array(
      z.object({
        productId: z.string(),
        sku: z.string(),
        color: z.string(),
        size: z.string(),
        quantity: z.number().int().min(1),
        unitPrice: z.number().positive()
      })
    )
    .min(1, 'At least one item must be returned'),
  reason: z.enum([
    'SIZE_TOO_SMALL',
    'SIZE_TOO_LARGE',
    'NOT_AS_PICTURED',
    'DEFECTIVE',
    'CHANGED_MIND',
    'WRONG_ITEM_SENT',
    'OTHER'
  ]),
  reasonDetails: z.string().optional(),
  refundMethod: z.enum(['ORIGINAL_PAYMENT', 'STORE_CREDIT', 'CASH', 'WALLET']).default('CASH')
});

const updateReturnStatusSchema = z.object({
  status: z.enum(Object.values(ReturnStatuses)),
  notes: z.string().optional()
});

const inspectReturnSchema = z.object({
  inspectionNotes: z.string().min(3, 'Inspection notes are required'),
  itemInspections: z.array(
    z.object({
      itemId: z.string(),
      condition: z.enum(['UNOPENED', 'TAGS_ATTACHED', 'WORN', 'DAMAGED', 'DEFECTIVE']),
      restockApproved: z.boolean()
    })
  )
});

const logReturnCallSchema = z.object({
  result: z.enum(['NO_ANSWER', 'CUSTOMER_REFUSED', 'CUSTOMER_CONFIRMED', 'RESCHEDULED']),
  notes: z.string().optional()
});

module.exports = {
  requestReturnSchema,
  updateReturnStatusSchema,
  inspectReturnSchema,
  logReturnCallSchema
};
