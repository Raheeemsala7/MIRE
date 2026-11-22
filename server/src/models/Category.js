const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    description: {
      type: String,
      default: ''
    },
    image: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' }
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    sortOrder: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

categorySchema.index({ slug: 1, isActive: 1 });

categorySchema.pre('validate', function (next) {
  if (!this.slug || !this.slug.trim()) {
    const nameSlug = (this.name || '')
      .toLowerCase()
      .trim()
      .replace(/[\s_-]+/g, '-')
      .replace(/[^\p{L}\p{N}-]/gu, '')
      .replace(/^-+|-+$/g, '');
    this.slug = nameSlug || `category-${Date.now()}`;
  }
  next();
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
