import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { FiSearch, FiX } from 'react-icons/fi'
import PageHeader from '../components/PageHeader'
import ProductCard from '../components/ProductCard'
import { LoadError, LoadingCards, LoadingNote } from '../components/MenuStatus'
import { CATEGORIES, getCategory } from '../data/menu'
import usePageTitle from '../hooks/usePageTitle'
import useProducts from '../hooks/useProducts'
import './Menu.css'

const FILTERS = [{ id: 'all', name: 'All' }, ...CATEGORIES]

// How long to wait after the last key press before searching (in milliseconds)
const SEARCH_DELAY = 300

// True when every word typed appears in the item's name, category or description.
// So "choc cake" finds "Chocolate Truffle Cake". Upper/lower case doesn't matter.
function matchesSearch(item, search) {
  const words = search.toLowerCase().split(/\s+/).filter(Boolean)
  const text = [item.name, getCategory(item.category).name, item.description].join(' ').toLowerCase()
  return words.every((word) => text.includes(word))
}

export default function Menu() {
  usePageTitle('Menu')
  const { products, loading, error, retry } = useProducts()

  // The category and the search both live in the URL (e.g. /menu?category=cakes&q=chocolate),
  // so a refresh or a shared link opens the same results.
  const [searchParams, setSearchParams] = useSearchParams()
  const requested = searchParams.get('category')
  const active = CATEGORIES.some((c) => c.id === requested) ? requested : 'all'
  const query = searchParams.get('q') || ''

  // What is in the search box right now. The URL catches up a moment later (the "debounce"),
  // so we don't search again on every single key press.
  const [typed, setTyped] = useState(query)
  const inputRef = useRef(null)

  // If the URL changes some other way (Back button, a footer link), show that in the box too
  const [lastQuery, setLastQuery] = useState(query)
  if (query !== lastQuery) {
    setLastQuery(query)
    if (query !== typed.trim()) setTyped(query)
  }

  // Change one value in the URL and keep the others.
  // "replace" means typing doesn't fill the Back button history with every letter.
  const updateUrl = useCallback(
    (key, value) => {
      setSearchParams(
        (params) => {
          const next = new URLSearchParams(params)
          if (value) next.set(key, value)
          else next.delete(key)
          return next
        },
        { replace: key === 'q', state: { keepScroll: true } },
      )
    },
    [setSearchParams],
  )

  // The debounce: wait until the user stops typing, then save the search in the URL
  useEffect(() => {
    const clean = typed.trim()
    if (clean === query) return
    const timer = setTimeout(() => updateUrl('q', clean), SEARCH_DELAY)
    return () => clearTimeout(timer)
  }, [typed, query, updateUrl])

  const choose = (id) => updateUrl('category', id === 'all' ? '' : id)

  const clearSearch = () => {
    setTyped('')
    updateUrl('q', '')
    inputRef.current?.focus()
  }

  // First the search, then the category, so both work together
  const found = query ? products.filter((item) => matchesSearch(item, query)) : products
  const items = active === 'all' ? found : found.filter((item) => item.category === active)

  return (
    <>
      <PageHeader
        script="freshly baked"
        title="Our menu"
        text="Everything is baked to order in small batches. Tap any item to see details and order."
      />

      <section className="section menu">
        <div className="container">
          <form className="menu__search" role="search" onSubmit={(e) => e.preventDefault()}>
            <FiSearch className="menu__search-icon" aria-hidden="true" />
            <input
              ref={inputRef}
              type="search"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && typed && clearSearch()}
              placeholder="Search cakes, cookies, chocolate…"
              aria-label="Search the menu"
              enterKeyHint="search"
              autoComplete="off"
            />
            {typed && (
              <button type="button" className="menu__search-clear" onClick={clearSearch} aria-label="Clear search">
                <FiX />
              </button>
            )}
          </form>

          <div className="menu__filters" role="group" aria-label="Filter by category">
            {FILTERS.map((filter) => (
              <button
                key={filter.id}
                className={`menu__pill ${active === filter.id ? 'is-active' : ''}`}
                onClick={() => choose(filter.id)}
                aria-pressed={active === filter.id}
              >
                {filter.name}
              </button>
            ))}
          </div>

          {loading && (
            <>
              <LoadingNote />
              <div className="menu__grid">
                <LoadingCards count={6} />
              </div>
            </>
          )}

          {error && <LoadError message={error} onRetry={retry} />}

          {!loading && !error && items.length > 0 && (
            <p className="menu__count" aria-live="polite">
              Showing {items.length} {items.length === 1 ? 'item' : 'items'}
              {query && <> for “{query}”</>}
            </p>
          )}

          {/* Nothing matched the search */}
          {!loading && !error && items.length === 0 && (
            <div className="menu__empty" role="status">
              <span className="menu__empty-emoji" aria-hidden="true">🧁</span>
              <h2>No treats found</h2>
              <p>
                {query
                  ? <>We couldn't find anything for “{query}”{active !== 'all' && <> in {getCategory(active).name}</>}.</>
                  : 'There is nothing in this category right now.'}
              </p>
              <div className="menu__empty-actions">
                {query && (
                  <button type="button" className="btn btn-dark" onClick={clearSearch}>
                    Clear search
                  </button>
                )}
                {/* The search found items, just not in this category */}
                {active !== 'all' && found.length > 0 && (
                  <button type="button" className="btn btn-outline" onClick={() => choose('all')}>
                    Search all categories
                  </button>
                )}
              </div>
            </div>
          )}

          {/* "layout" makes cards slide smoothly into their new places when the filter changes */}
          <motion.div layout className="menu__grid">
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <motion.div
                  key={item.slug}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.35 }}
                >
                  <ProductCard item={item} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>
    </>
  )
}
