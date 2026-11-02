import { useEffect, useState } from 'react'
import { getProducts } from '../api'
import { CATEGORIES } from '../data/menu'

// The menu is loaded from the server ONCE per visit and shared by every page and section.
let cached = null // the menu, once it has arrived
let pending = null // the request while it is on its way

const categoryOrder = (item) => CATEGORIES.findIndex((c) => c.id === item.category)

// The free server sleeps when nobody visits, and while it wakes up a request can fail.
// So a failed request is tried again a few times (after 3, 6 and 9 seconds) before giving up.
// Real answers like "not found" (status below 500) are not retried.
const RETRY_DELAYS = [3000, 6000, 9000]
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function getProductsPatiently() {
  for (let attempt = 0; ; attempt++) {
    try {
      return await getProducts()
    } catch (error) {
      const canRetry = !error.status || error.status >= 500
      if (!canRetry || attempt >= RETRY_DELAYS.length) throw error
      await wait(RETRY_DELAYS[attempt])
    }
  }
}

function loadMenu() {
  if (!pending) {
    pending = getProductsPatiently()
      .then((list) => {
        // Group by category, in the same order as the menu filter pills
        cached = [...list].sort((a, b) => categoryOrder(a) - categoryOrder(b))
        return cached
      })
      .catch((error) => {
        pending = null // let "Try again" make a fresh request
        throw error
      })
  }
  return pending
}

// Called after the admin changes the menu, so the next page shows the new menu
export function clearMenuCache() {
  cached = null
  pending = null
}

// Finds one item by its web address name, e.g. "red-velvet-cake"
export function findProduct(products, slug) {
  return products.find((item) => item.slug === slug)
}

// Usage:  const { products, loading, error, retry } = useProducts()
export default function useProducts() {
  const [state, setState] = useState(() => ({ products: cached || [], loading: !cached, error: '' }))
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (cached) return
    let active = true // ignore the answer if the page was closed meanwhile
    loadMenu()
      .then((products) => active && setState({ products, loading: false, error: '' }))
      .catch((error) => active && setState({ products: [], loading: false, error: error.message }))
    return () => {
      active = false
    }
  }, [attempt])

  const retry = () => {
    setState({ products: [], loading: true, error: '' })
    setAttempt((n) => n + 1)
  }

  return { ...state, retry }
}
