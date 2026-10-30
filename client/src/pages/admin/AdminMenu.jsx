import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { FiArchive, FiClipboard, FiEdit2, FiLogOut, FiPlus, FiRotateCcw, FiTrash2 } from 'react-icons/fi'
import PageHeader from '../../components/PageHeader'
import SmartImage from '../../components/SmartImage'
import Modal from '../../components/Modal'
import ProductForm from './ProductForm'
import { deleteProduct, getAllProducts, updateProduct } from '../../api'
import { CATEGORIES, formatPrice, getCategory } from '../../data/menu'
import { formatDay, todayInIndia } from '../../indiaTime'
import usePageTitle from '../../hooks/usePageTitle'
import useAdminSession from '../../hooks/useAdminSession'
import { clearMenuCache } from '../../hooks/useProducts'
import './Admin.css'
import './AdminMenu.css'

const categoryOrder = (item) => CATEGORIES.findIndex((c) => c.id === item.category)

// Filter pills. "Archived" items are only shown under their own pill.
const FILTERS = [
  { id: 'all', name: 'All' },
  ...CATEGORIES,
  { id: 'specials', name: 'Specials' },
  { id: 'soldout', name: 'Sold out' },
  { id: 'archived', name: 'Archived' },
]

function matchesFilter(product, filter) {
  if (filter === 'archived') return product.archived
  if (product.archived) return false
  if (filter === 'all') return true
  if (filter === 'soldout') return !product.available
  if (filter === 'specials') return product.isSpecial
  return product.category === filter
}

// The special-offer label in the list: is it live now, starting later, or over?
function specialLabel(product) {
  if (product.specialActive) return { text: `✨ ${product.specialTag} · live`, kind: 'live' }
  if (product.specialStart > todayInIndia()) return { text: `${product.specialTag} · starts ${formatDay(product.specialStart)}`, kind: 'later' }
  return { text: `${product.specialTag} · ended`, kind: 'ended' }
}

export default function AdminMenu() {
  usePageTitle('Manage menu')
  const { admin, logout, handleSessionError } = useAdminSession()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('') // "Saved!" style messages
  const [filter, setFilter] = useState('all')
  const [editing, setEditing] = useState(null) // null = form closed, 'new' = adding, or the item being edited
  const [removing, setRemoving] = useState(null) // the item waiting for "Archive or delete?"
  const [busyId, setBusyId] = useState(null)

  // Logged-out errors go back to the login page; other errors are shown on this page
  const handleError = useCallback(
    (err) => {
      if (!handleSessionError(err)) setError(err.message)
    },
    [handleSessionError],
  )

  // The admin list includes archived items
  const fetchProducts = useCallback(
    () =>
      getAllProducts(admin?.token)
        .then(setProducts)
        .catch(handleError)
        .finally(() => setLoading(false)),
    [admin, handleError],
  )

  useEffect(() => {
    if (admin) fetchProducts()
  }, [admin, fetchProducts])

  // Not logged in? Go to the login page.
  if (!admin) return <Navigate to="/admin/login" replace />

  // After every change: show a message, and make the public pages load the new menu
  const changed = (message) => {
    clearMenuCache()
    setError('')
    setNotice(message)
  }

  const replaceItem = (saved) => setProducts((list) => list.map((p) => (p._id === saved._id ? saved : p)))

  // Sold out on/off: change it on screen straight away, and undo it if the server says no
  const toggleAvailable = async (product) => {
    const available = !product.available
    setBusyId(product._id)
    replaceItem({ ...product, available })
    try {
      replaceItem(await updateProduct(product._id, { available }, admin.token))
      changed(available ? `${product.name} is back on the menu.` : `${product.name} is marked as sold out.`)
    } catch (err) {
      replaceItem(product)
      handleError(err)
    } finally {
      setBusyId(null)
    }
  }

  // Archive (hide, but keep) or restore an item
  const setArchived = async (product, archived) => {
    setBusyId(product._id)
    try {
      replaceItem(await updateProduct(product._id, { archived }, admin.token))
      changed(
        archived
          ? `${product.name} was archived. Find it under "Archived" to restore it.`
          : `${product.name} is back on the menu.`,
      )
    } catch (err) {
      handleError(err)
    } finally {
      setBusyId(null)
      setRemoving(null)
    }
  }

  const deleteForever = async (product) => {
    setBusyId(product._id)
    try {
      await deleteProduct(product._id, admin.token)
      setProducts((list) => list.filter((p) => p._id !== product._id))
      changed(`${product.name} was deleted forever.`)
    } catch (err) {
      handleError(err)
    } finally {
      setBusyId(null)
      setRemoving(null)
    }
  }

  const handleSaved = (saved, isNew) => {
    setProducts((list) => (isNew ? [...list, saved] : list.map((p) => (p._id === saved._id ? saved : p))))
    setEditing(null)
    changed(isNew ? `${saved.name} was added to the menu.` : `${saved.name} was saved.`)
  }

  const sorted = [...products].sort((a, b) => categoryOrder(a) - categoryOrder(b))
  const shown = sorted.filter((p) => matchesFilter(p, filter))
  const count = (id) => products.filter((p) => matchesFilter(p, id)).length

  return (
    <>
      <PageHeader script="admin" title="Manage menu" text="Add, edit, mark items as sold out, or run festive specials.">
        <div className="admin__toolbar">
          <button className="admin__tool admin__tool--add" onClick={() => setEditing('new')}>
            <FiPlus /> Add item
          </button>
          <Link to="/admin/orders" className="admin__tool admin__tool--menu">
            <FiClipboard /> Orders
          </Link>
          <button className="admin__tool admin__tool--logout" onClick={() => logout()}>
            <FiLogOut /> Log out
          </button>
        </div>
      </PageHeader>

      <section className="section admin">
        <div className="container">
          <div className="menu__filters admin__filters" role="group" aria-label="Filter items">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                className={`menu__pill ${filter === f.id ? 'is-active' : ''}`}
                onClick={() => setFilter(f.id)}
                aria-pressed={filter === f.id}
              >
                {f.id === 'archived' && <FiArchive aria-hidden="true" />} {f.name} ({count(f.id)})
              </button>
            ))}
          </div>

          {filter === 'archived' && (
            <p className="admin-menu__tip admin-menu__tip--center">
              Archived items are hidden from the website. Restore one to put it back on the menu.
            </p>
          )}

          {notice && <p className="admin-menu__notice" role="status">{notice}</p>}
          {error && <p className="admin__error" role="alert">{error}</p>}
          {loading && <p className="admin__empty">Loading the menu…</p>}
          {!loading && shown.length === 0 && !error && (
            <p className="admin__empty">
              {filter === 'archived'
                ? 'Nothing archived. 🗃️'
                : filter === 'specials'
                  ? 'No specials yet. Edit an item and switch on “Special offer”. ✨'
                  : 'No items here yet. 🧁'}
            </p>
          )}

          <ul className="admin-menu__list">
            {shown.map((product) => {
              const category = getCategory(product.category)
              const busy = busyId === product._id
              return (
                <li
                  key={product._id}
                  className={`admin-item ${!product.available || product.archived ? 'is-soldout' : ''}`}
                >
                  <div className="admin-item__photo">
                    <SmartImage src={product.image} alt="" emoji={category.emoji} tone={category.tone} />
                  </div>

                  <div className="admin-item__info">
                    <strong>{product.name}</strong>
                    <span>
                      {category.name} · {formatPrice(product.price, product.priceFrom)}
                      {product.isSpecial && product.offerPrice && <> → <strong>{formatPrice(product.offerPrice)} offer</strong></>} / {product.unit}
                    </span>
                    <span className="admin-item__badges">
                      {product.archived && <span className="admin-item__badge admin-item__badge--archived">Archived</span>}
                      {product.isSpecial && (
                        <span className={`admin-item__badge admin-item__badge--special is-${specialLabel(product).kind}`}>
                          {specialLabel(product).text}
                        </span>
                      )}
                      {product.bestSeller && <span className="admin-item__badge">Best seller</span>}
                      {!product.available && <span className="admin-item__badge admin-item__badge--soldout">Sold out</span>}
                    </span>
                  </div>

                  {product.archived ? (
                    // Archived: bring it back, or delete it for good
                    <div className="admin-item__actions">
                      <button type="button" className="icon-btn icon-btn--restore" onClick={() => setArchived(product, false)} disabled={busy}>
                        <FiRotateCcw /> <span>Restore</span>
                      </button>
                      <button
                        type="button"
                        className="icon-btn icon-btn--danger"
                        onClick={() => setRemoving(product)}
                        disabled={busy}
                        aria-label={`Delete ${product.name} forever`}
                      >
                        <FiTrash2 /> <span>Delete forever</span>
                      </button>
                    </div>
                  ) : (
                    <div className="admin-item__actions">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={product.available}
                        className="switch"
                        onClick={() => toggleAvailable(product)}
                        disabled={busy}
                        aria-label={`${product.name} available to order`}
                      >
                        <span className="switch__track" aria-hidden="true">
                          <span className="switch__thumb" />
                        </span>
                        {product.available ? 'Available' : 'Sold out'}
                      </button>
                      <button type="button" className="icon-btn" onClick={() => setEditing(product)} aria-label={`Edit ${product.name}`}>
                        <FiEdit2 /> <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        className="icon-btn icon-btn--danger"
                        onClick={() => setRemoving(product)}
                        disabled={busy}
                        aria-label={`Remove ${product.name}`}
                      >
                        <FiTrash2 /> <span>Delete</span>
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* Add / Edit form in a pop-up */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Add a new item' : `Edit ${editing?.name || ''}`}
        size="wide"
      >
        <ProductForm
          key={editing === 'new' ? 'new' : editing?._id}
          product={editing === 'new' ? null : editing}
          token={admin.token}
          onSaved={handleSaved}
          onCancel={() => setEditing(null)}
          onAuthError={handleError}
        />
      </Modal>

      {/* Like Instagram: Archive (keep it, hidden) or Delete forever */}
      <Modal
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title={removing?.archived ? 'Delete forever?' : `Remove ${removing?.name || ''}?`}
      >
        {removing?.archived ? (
          <>
            <p className="admin-menu__confirm">
              <strong>{removing.name}</strong> will be deleted for good. This can't be undone.
            </p>
            <div className="product-form__actions">
              <button type="button" className="btn btn-outline" onClick={() => setRemoving(null)}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={() => deleteForever(removing)} disabled={busyId !== null}>
                <FiTrash2 /> Delete forever
              </button>
            </div>
          </>
        ) : (
          <div className="remove-choices">
            <button type="button" className="remove-choice" onClick={() => setArchived(removing, true)} disabled={busyId !== null}>
              <FiArchive className="remove-choice__icon" aria-hidden="true" />
              <span>
                <strong>Archive</strong>
                <small>Hide it from the website. You can restore it any time.</small>
              </span>
            </button>
            <button
              type="button"
              className="remove-choice remove-choice--danger"
              onClick={() => deleteForever(removing)}
              disabled={busyId !== null}
            >
              <FiTrash2 className="remove-choice__icon" aria-hidden="true" />
              <span>
                <strong>Delete forever</strong>
                <small>Remove it for good. This can't be undone.</small>
              </span>
            </button>
            <button type="button" className="remove-choices__cancel" onClick={() => setRemoving(null)}>
              Cancel
            </button>
          </div>
        )}
      </Modal>
    </>
  )
}
