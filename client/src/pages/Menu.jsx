import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import PageHeader from '../components/PageHeader'
import ProductCard from '../components/ProductCard'
import { CATEGORIES, MENU } from '../data/menu'
import usePageTitle from '../hooks/usePageTitle'
import './Menu.css'

const FILTERS = [{ id: 'all', name: 'All' }, ...CATEGORIES]

export default function Menu() {
  usePageTitle('Menu')

  // The chosen category lives in the URL (e.g. /menu?category=cakes), so links can open a filter.
  const [searchParams, setSearchParams] = useSearchParams()
  const requested = searchParams.get('category')
  const active = CATEGORIES.some((c) => c.id === requested) ? requested : 'all'

  const items = active === 'all' ? MENU : MENU.filter((item) => item.category === active)

  const choose = (id) => {
    setSearchParams(id === 'all' ? {} : { category: id }, { state: { keepScroll: true } })
  }

  return (
    <>
      <PageHeader
        script="freshly baked"
        title="Our menu"
        text="Everything is baked to order in small batches. Tap any item to see details and order."
      />

      <section className="section menu">
        <div className="container">
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

          <p className="menu__count" aria-live="polite">
            Showing {items.length} {items.length === 1 ? 'item' : 'items'}
          </p>

          {/* "layout" makes cards slide smoothly into their new places when the filter changes */}
          <motion.div layout className="menu__grid">
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <motion.div
                  key={item.id}
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
