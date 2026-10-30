import { Router } from 'express'
import multer from 'multer'
import mongoose from 'mongoose'
import Product, { slugify } from '../models/Product.js'
import requireAdmin from '../middleware/requireAdmin.js'
import { cloudinaryReady, uploadImage } from '../config/cloudinary.js'

const router = Router()

// The only fields the admin may set. Anything else in the request is ignored.
const EDITABLE = [
  'name', 'category', 'price', 'priceFrom', 'unit', 'description', 'image', 'bestSeller', 'available', 'archived',
  'isSpecial', 'specialTag', 'offerPrice', 'specialStart', 'specialEnd',
]

function pickEditable(body = {}) {
  const fields = {}
  for (const key of EDITABLE) {
    if (body[key] !== undefined) fields[key] = body[key]
  }
  return fields
}

// Makes a web address that no other item uses yet: "brownie", then "brownie-2", "brownie-3"…
async function uniqueSlug(name) {
  const base = slugify(name) || 'item'
  let slug = base
  for (let n = 2; await Product.exists({ slug }); n++) slug = `${base}-${n}`
  return slug
}

// Photo upload: keep the file in memory (not on disk), photos only, 5 MB max
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, done) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) return done(null, true)
    const error = new Error('Please choose a JPG, PNG or WebP photo.')
    error.status = 400
    done(error)
  },
})

// GET /api/products – the menu customers see (public).
// Sold-out items are included: the website shows them in grey, and the orders route refuses them.
// Archived items are left out.
router.get('/', async (req, res) => {
  // "not true" (instead of "false") also matches older items saved before the archived field existed.
  // mongoose.trusted: this $ne is ours, so sanitizeFilter must let it through.
  const products = await Product.find({ archived: mongoose.trusted({ $ne: true }) }).sort({ _id: 1 }) // oldest first = menu order
  res.json(products)
})

// GET /api/products/all – every item, including archived ones (admin only, for the Manage menu page)
router.get('/all', requireAdmin, async (req, res) => {
  const products = await Product.find().sort({ _id: 1 })
  res.json(products)
})

// POST /api/products/upload – send one photo (form field "image"), get back its link (admin only)
router.post('/upload', requireAdmin, upload.single('image'), async (req, res) => {
  if (!cloudinaryReady()) {
    return res.status(503).json({ message: 'Photo upload is not set up yet (Cloudinary keys missing in server/.env).' })
  }
  if (!req.file) {
    return res.status(400).json({ message: 'Please choose a photo.' })
  }
  const url = await uploadImage(req.file.buffer)
  res.status(201).json({ url })
})

// POST /api/products – add a new item (admin only)
router.post('/', requireAdmin, async (req, res) => {
  const fields = pickEditable(req.body)
  const product = new Product({ ...fields, slug: await uniqueSlug(fields.name) })
  await product.save()
  res.status(201).json(product)
})

// PUT /api/products/:id – change an item (admin only).
// Send only the fields you want to change, e.g. { "available": false } for "Sold out".
// Load, change, then save, so every rule is checked against the whole item
// (e.g. "offer price lower than price" works even when only one of them is sent).
router.put('/:id', requireAdmin, async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product) return res.status(404).json({ message: 'Item not found.' })
  product.set(pickEditable(req.body))
  await product.save()
  res.json(product)
})

// DELETE /api/products/:id – remove an item for good (admin only).
// (To hide an item but keep it, archive it instead: PUT { "archived": true })
router.delete('/:id', requireAdmin, async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id)
  if (!product) return res.status(404).json({ message: 'Item not found.' })
  res.json({ message: `${product.name} was deleted.` })
})

export default router
