import { useEffect, useState } from 'react'
import { CartContext, MAX_LINES, MAX_NOTE, MAX_QTY } from '../../hooks/useCart'

const STORAGE_KEY = 'pnp-cart'

const newId = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
const clampQty = (qty) => Math.min(MAX_QTY, Math.max(1, Math.round(qty) || 1))

// Reads the saved cart, ignoring anything that doesn't look like a cart line
function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (!Array.isArray(saved)) return []
    return saved
      .filter((line) => line && typeof line.slug === 'string' && Number.isInteger(line.qty))
      .slice(0, MAX_LINES)
      .map((line) => ({ id: line.id || newId(), slug: line.slug, qty: clampQty(line.qty), note: String(line.note || '') }))
  } catch {
    return [] // nothing saved yet, or storage is blocked
  }
}

// Holds the cart for the whole website and saves it in this browser (localStorage),
// so it is still there after a refresh or when the customer comes back later.
export default function CartProvider({ children }) {
  const [lines, setLines] = useState(loadCart)
  const [isOpen, setIsOpen] = useState(false)
  const [bump, setBump] = useState(0) // goes up on every "Add to cart", to make the navbar icon bounce

  // Save after every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
    } catch {
      // storage blocked: the cart still works until the page is closed
    }
  }, [lines])

  // If the cart changes in another tab, show the same cart here
  useEffect(() => {
    const onStorage = (event) => event.key === STORAGE_KEY && setLines(loadCart())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Adding the same item with the same note again just raises its quantity.
  // A different note makes a new line (two cakes with different messages).
  // Returns false if the cart is full.
  const addItem = (slug, qty = 1, note = '') => {
    const cleanNote = note.trim().slice(0, MAX_NOTE)
    const same = lines.find((line) => line.slug === slug && line.note === cleanNote)
    if (same) {
      setLines(lines.map((line) => (line === same ? { ...line, qty: clampQty(line.qty + qty) } : line)))
    } else if (lines.length >= MAX_LINES) {
      return false
    } else {
      setLines([...lines, { id: newId(), slug, qty: clampQty(qty), note: cleanNote }])
    }
    setBump((n) => n + 1)
    return true
  }

  // Change a line's quantity and/or note
  const updateLine = (id, changes) => {
    setLines((current) =>
      current.map((line) => {
        if (line.id !== id) return line
        const next = { ...line, ...changes }
        return { ...next, qty: clampQty(next.qty), note: String(next.note || '').slice(0, MAX_NOTE) }
      }),
    )
  }

  const removeLine = (id) => setLines((current) => current.filter((line) => line.id !== id))
  const clearCart = () => setLines([])

  const value = {
    lines,
    count: lines.reduce((sum, line) => sum + line.qty, 0),
    addItem,
    updateLine,
    removeLine,
    clearCart,
    isOpen,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
    bump,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
