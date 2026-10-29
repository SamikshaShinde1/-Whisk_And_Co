import { useEffect, useState } from 'react'
import { FiImage, FiUploadCloud } from 'react-icons/fi'
import SmartImage from '../../components/SmartImage'
import { createProduct, updateProduct, uploadProductImage } from '../../api'
import { CATEGORIES, getCategory } from '../../data/menu'

const EMPTY = {
  name: '',
  category: 'cakes',
  price: '',
  priceFrom: false,
  unit: '',
  description: '',
  image: '',
  bestSeller: false,
  available: true,
}

const MAX_PHOTO_MB = 5

// The "Add item" / "Edit item" form. With a product it edits it; without one it adds a new item.
export default function ProductForm({ product, token, onSaved, onCancel, onAuthError }) {
  const isNew = !product
  const [form, setForm] = useState(() => (product ? { ...EMPTY, ...product } : EMPTY))
  const [preview, setPreview] = useState('') // the photo on this computer, shown while it uploads
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Free the memory used by the preview photo when it's replaced or the form closes
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview])

  const update = (event) => {
    const { name, type, value, checked } = event.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  const showError = (err) => {
    if (err.status === 401) onAuthError(err)
    else setError(err.message)
  }

  // A photo was chosen: show it straight away, and upload it to Cloudinary in the background
  const choosePhoto = async (event) => {
    const file = event.target.files[0]
    event.target.value = '' // so choosing the same file again still works
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return setError('Please choose a JPG, PNG or WebP photo.')
    }
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      return setError(`That photo is too big. Please use one under ${MAX_PHOTO_MB} MB.`)
    }

    setError('')
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const { url } = await uploadProductImage(file, token)
      setForm((current) => ({ ...current, image: url }))
    } catch (err) {
      setPreview('')
      showError(err)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    const data = {
      name: form.name,
      category: form.category,
      price: Number(form.price),
      priceFrom: form.priceFrom,
      unit: form.unit,
      description: form.description,
      image: form.image,
      bestSeller: form.bestSeller,
      available: form.available,
    }
    try {
      const saved = isNew ? await createProduct(data, token) : await updateProduct(product._id, data, token)
      onSaved(saved, isNew)
    } catch (err) {
      showError(err)
      setSaving(false)
    }
  }

  const category = getCategory(form.category)

  return (
    <form className="product-form" onSubmit={handleSubmit}>
      {/* ---------- Photo ---------- */}
      <div className="product-form__photo-row">
        <div className={`product-form__photo ${uploading ? 'is-uploading' : ''}`}>
          <SmartImage src={preview || form.image} alt="Photo preview" emoji={category.emoji} tone={category.tone} eager />
          {uploading && <span className="product-form__uploading">Uploading…</span>}
        </div>

        <div className="product-form__photo-tools">
          <label className="btn btn-rose product-form__upload">
            <FiUploadCloud /> {form.image || preview ? 'Change photo' : 'Upload photo'}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} disabled={uploading} />
          </label>
          <p className="product-form__hint">JPG, PNG or WebP, up to {MAX_PHOTO_MB} MB. Square photos look best.</p>
          <label className="field product-form__link">
            <span>
              <FiImage /> Or paste a photo link <em>(optional)</em>
            </span>
            <input
              name="image"
              value={form.image}
              onChange={(event) => {
                setPreview('')
                update(event)
              }}
              placeholder="https://…"
              inputMode="url"
            />
          </label>
        </div>
      </div>

      {/* ---------- Details ---------- */}
      <label className="field">
        <span>Name</span>
        <input name="name" value={form.name} onChange={update} required maxLength={80} placeholder="Red Velvet Cake" />
      </label>

      <div className="product-form__grid">
        <label className="field">
          <span>Category</span>
          <select name="category" value={form.category} onChange={update}>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Price (₹)</span>
          <input name="price" type="number" min="1" max="100000" step="1" value={form.price} onChange={update} required placeholder="650" />
        </label>
        <label className="field">
          <span>Unit</span>
          <input name="unit" value={form.unit} onChange={update} required maxLength={30} placeholder="500 g, piece, box of 6" />
        </label>
      </div>

      <label className="field">
        <span>Description</span>
        <textarea name="description" value={form.description} onChange={update} rows={3} maxLength={600} placeholder="What makes it special?" />
      </label>

      {/* ---------- Switches ---------- */}
      <div className="product-form__checks">
        <label className="check">
          <input type="checkbox" name="available" checked={form.available} onChange={update} />
          <span>Available to order <em>(untick = Sold out)</em></span>
        </label>
        <label className="check">
          <input type="checkbox" name="bestSeller" checked={form.bestSeller} onChange={update} />
          <span>Best seller <em>(shown on the Home page)</em></span>
        </label>
        <label className="check">
          <input type="checkbox" name="priceFrom" checked={form.priceFrom} onChange={update} />
          <span>Starting price <em>(shows “From ₹…”)</em></span>
        </label>
      </div>

      {error && <p className="admin__error" role="alert">{error}</p>}

      <div className="product-form__actions">
        <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-dark" disabled={saving || uploading}>
          {saving ? 'Saving…' : uploading ? 'Wait for the photo…' : isNew ? 'Add to menu' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
