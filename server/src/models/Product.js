const mongoose = require('mongoose');

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const productVariantSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: true,
    trim: true
  },
  color: {
    type: String,
    required: true,
    trim: true
  },
  size: {
    type: String,
    required: true,
    enum: SIZES
  },
  stockQuantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  reservedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  priceOverride: {
    type: Number,
    default: null
  }
});

const productImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, default: '' },
  isPrimary: { type: Boolean, default: false }
});

const productColorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true }, // Hex code e.g. #f43f5e
  image: { type: String, default: '' }
});

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: 200,
      index: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    sku: {
      type: String,
      required: [true, 'Base SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    description: {
      type: String,
      required: [true, 'Description is required']
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true
    },
    brand: {
      type: String,
      default: 'MIRE',
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price must be positive'],
      index: true
    },
    discountPrice: {
      type: Number,
      min: [0, 'Discount price must be positive'],
      default: null,
      index: true
    },
    images: {
      type: [productImageSchema],
      validate: [(v) => v.length > 0, 'At least one product image is required']
    },
    colors: [productColorSchema],
    sizes: {
      type: [String],
      enum: SIZES,
      default: ['S', 'M', 'L']
    },
    variants: [productVariantSchema],
    totalStock: {
      type: Number,
      default: 0,
      min: 0,
      index: true
    },
    lowStockThreshold: {
      type: Number,
      default: 5
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'DRAFT', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true
    },
    isNewArrival: {
      type: Boolean,
      default: true,
      index: true
    },
    isBestSeller: {
      type: Boolean,
      default: false,
      index: true
    },
    tags: [String],
    averageRating: {
      type: Number,
      default: 5.0,
      min: 1,
      max: 5
    },
    reviewCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Calculate total stock from variants before saving
productSchema.pre('save', function (next) {
  if (this.variants && this.variants.length > 0) {
    this.totalStock = this.variants.reduce((acc, v) => acc + (v.stockQuantity || 0), 0);
  }
  next();
});

// Full text search index
productSchema.index({ name: 'text', description: 'text', sku: 'text', tags: 'text' });
productSchema.index({ category: 1, status: 1, price: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = { Product, SIZES };
