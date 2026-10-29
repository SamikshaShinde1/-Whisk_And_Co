import mongoose from 'mongoose'

// Must match the ids of CATEGORIES in client/src/data/menu.js
export const CATEGORY_IDS = ['cakes', 'pastries', 'breads', 'cookies', 'desserts', 'beverages']

// "Red Velvet Cake!" -> "red-velvet-cake" (used in the web address: /menu/red-velvet-cake)
export function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

// One menu item
const productSchema = new mongoose.Schema(
  {
    // Made from the name when the item is created, and never changed after,
    // so links people have shared keep working even if the name is edited.
    slug: {
      type: String,
      required: true,
      unique: true,
      match: [/^[a-z0-9-]+$/, 'The web address may only use small letters, numbers and dashes.'],
    },
    name: {
      type: String,
      required: [true, 'Please enter a name.'],
      trim: true,
      maxlength: [80, 'The name is too long (80 characters max).'],
    },
    category: {
      type: String,
      required: [true, 'Please choose a category.'],
      enum: { values: CATEGORY_IDS, message: 'Please choose a valid category.' },
    },
    price: {
      type: Number,
      required: [true, 'Please enter a price.'],
      min: [1, 'The price must be at least ₹1.'],
      max: [100000, 'The price looks too high.'],
    },
    priceFrom: { type: Boolean, default: false }, // true = show "From ₹900" (a starting price)
    unit: {
      type: String,
      required: [true, 'Please enter a unit, like "500 g" or "piece".'],
      trim: true,
      maxlength: [30, 'The unit is too long (30 characters max).'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [600, 'The description is too long (600 characters max).'],
    },
    image: {
      type: String,
      trim: true,
      default: '',
      // A full https:// link (Cloudinary, Unsplash…) or a photo in client/public/images
      match: [/^(https:\/\/\S+|\/images\/\S+)?$/, 'The photo must be an https:// link.'],
    },
    bestSeller: { type: Boolean, default: false },
    available: { type: Boolean, default: true }, // false = "Sold out": still on the menu, in grey
    archived: { type: Boolean, default: false }, // true = hidden from the website, can be restored by the admin
  },
  { timestamps: true },
)

export default mongoose.model('Product', productSchema)
