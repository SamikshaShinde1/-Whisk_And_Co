import { useEffect, useState } from 'react'
import { FiImage, FiStar, FiUploadCloud } from 'react-icons/fi'
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
  isSpecial: false,
  specialTag: '',
  offerPrice: '',
  specialStart: '',
  specialEnd: '',
}

// Ideas shown when typing the special tag (any other tag can be typed too)
const TAG_IDEAS = ['Diwali Special', 'Christmas Special', 'New Year Special', 'Holi Special', 'Raksha Bandhan Special', "Valentine's Special", 'Eid Special']

const MAX_PHOTO_MB = 5

// The "Add item" / "Edit item" form. With a product it edits it; without one it adds a new item.
export default function ProductForm({ product, token, onSaved, onCancel, onAuthError }) {
  const isNew = !product
  // (an empty offer price is saved as null, but an input box needs '')
  const [form, setForm] = useState(() => (product ? { ...EMPTY, ...product, offerPrice: product.offerPrice ?? '' } : EMPTY))
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
    // Same rule as the server, checked here first for a quicker message
    if (form.isSpecial && form.offerPrice !== '' && Number(form.offerPrice) >= Number(form.price)) {
      return setError('The offer price must be lower than the normal price.')
    }
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
      isSpecial: form.isSpecial,
      specialTag: form.specialTag,
      offerPrice: form.offerPrice === '' ? null : Number(form.offerPrice),
      specialStart: form.specialStart,
      specialEnd: form.specialEnd,
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

      {/* ---------- Special offer ---------- */}
      <div className={`product-form__special ${form.isSpecial ? 'is-on' : ''}`}>
        <button
          type="button"
          role="switch"
          aria-checked={form.isSpecial}
          className="switch"
          onClick={() => setForm({ ...form, isSpecial: !form.isSpecial })}
        >
          <span className="switch__track" aria-hidden="true">
            <span className="switch__thumb" />
          </span>
          <FiStar aria-hidden="true" /> Special offer
        </button>

        {form.isSpecial && (
          <>
            <div className="product-form__grid product-form__grid--special">
              <label className="field">
                <span>Tag</span>
                <input name="specialTag" value={form.specialTag} onChange={update} required maxLength={40} list="special-tags" placeholder="Diwali Special" />
                <datalist id="special-tags">
                  {TAG_IDEAS.map((tag) => <option key={tag} value={tag} />)}
                </datalist>
              </label>
              <label className="field">
                <span>Offer price (₹) <em>(optional)</em></span>
                <input name="offerPrice" type="number" min="1" max={form.price ? Number(form.price) - 1 : undefined} step="1" value={form.offerPrice} onChange={update} placeholder="Lower than the price" />
              </label>
              <label className="field">
                <span>Starts <em>(optional)</em></span>
                <input name="specialStart" type="date" value={form.specialStart} onChange={update} />
              </label>
              <label className="field">
                <span>Ends <em>(optional)</em></span>
                <input name="specialEnd" type="date" min={form.specialStart || undefined} value={form.specialEnd} onChange={update} />
              </label>
            </div>
            <p className="product-form__hint">
              Specials show on the Home page, in the banner and on the first hero slide, but only between these dates
              (both days included). Leave the dates empty to run the offer until you switch it off.
            </p>
          </>
        )}
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
