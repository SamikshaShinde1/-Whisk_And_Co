import { createContext, useContext } from 'react'
import useProducts, { findProduct } from './useProducts'
import { priceNow } from '../data/menu'

// The shopping cart, shared by every page through <CartProvider> (components/cart/CartProvider.jsx).
// The cart only remembers WHICH item, how many and a note: [{ id, slug, qty, note }].
// Names, photos and prices always come from the live menu, so offer prices and "Sold out" stay up to date.

export const CartContext = createContext(null)

export const MAX_QTY = 50 // same limits as the server
export const MAX_LINES = 20
export const MAX_NOTE = 200

// { lines, count, addItem, updateLine, removeLine, clearCart, isOpen, openCart, closeCart, bump }
export default function useCart() {
  return useContext(CartContext)
}

// The cart lines joined with the menu: photo, name, today's price, and any problem
// ("Sold out", "No longer on the menu") that must be fixed before checkout.
export function useCartDetails() {
  const { lines } = useCart()
  const { products, loading } = useProducts()

  const items = lines.map((line) => {
    const product = findProduct(products, line.slug)
    let problem = ''
    if (!loading && !product) problem = 'No longer on the menu'
    else if (product && !product.available) problem = 'Sold out'

    const unitPrice = product ? priceNow(product) : 0
    return { ...line, product, unitPrice, lineTotal: problem ? 0 : unitPrice * line.qty, problem }
  })

  return {
    items,
    total: items.reduce((sum, item) => sum + item.lineTotal, 0),
    hasProblems: items.some((item) => item.problem),
    loading,
  }
}
