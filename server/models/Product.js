import mongoose from 'mongoose'
import { todayInIndia } from '../utils/indiaTime.js'

const DATE_OR_EMPTY = /^(\d{4}-\d{2}-\d{2})?$/

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

    // ---------- Special offer (festive specials) ----------
    // The offer only shows (and its price only counts) between specialStart and specialEnd.
    isSpecial: { type: Boolean, default: false },
    specialTag: {
      type: String,
      trim: true,
      default: '',
      maxlength: [40, 'The special tag is too long (40 characters max).'],
      validate: {
        validator(tag) {
          return !this.isSpecial || tag.length > 0
        },
        message: 'Please enter a tag for the special, like "Diwali Special".',
      },
    },
    offerPrice: {
      type: Number,
      default: null, // empty = the special keeps its normal price
      min: [1, 'The offer price must be at least ₹1.'],
      validate: {
        validator(offer) {
          // only checked while the special is switched on, so an old offer can't block a price change
          return offer == null || !this.isSpecial || offer < this.price
        },
        message: 'The offer price must be lower than the normal price.',
      },
    },
    // "YYYY-MM-DD", the first and last day of the offer (both included). Empty = no limit.
    specialStart: { type: String, default: '', match: [DATE_OR_EMPTY, 'Please choose a valid start date.'] },
    specialEnd: {
      type: String,
      default: '',
      match: [DATE_OR_EMPTY, 'Please choose a valid end date.'],
      validate: {
        validator(end) {
          return !end || !this.specialStart || end >= this.specialStart
        },
        message: 'The offer must end on or after its start date.',
      },
    },
  },
  {
    timestamps: true,
    id: false, // don't add a second "id" next to "_id"
    toJSON: { virtuals: true }, // include specialActive when sending an item to the website
  },
)

// Is the special offer running today (in India)?
// It's worked out here on the server, so a wrong clock on a customer's phone can't change it.
productSchema.virtual('specialActive').get(function () {
  if (!this.isSpecial) return false
  const today = todayInIndia()
  return (!this.specialStart || this.specialStart <= today) && (!this.specialEnd || today <= this.specialEnd)
})

// The price a customer pays today: the offer price while the special is running, otherwise the normal price
export function priceNow(product) {
  return product.specialActive && product.offerPrice ? product.offerPrice : product.price
}

export default mongoose.model('Product', productSchema)
