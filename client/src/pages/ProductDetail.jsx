import { Link, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { FiChevronRight } from 'react-icons/fi'
import SmartImage from '../components/SmartImage'
import ProductCard from '../components/ProductCard'
import Reveal from '../components/Reveal'
import OrderPanel from '../components/OrderPanel'
import NotFound from './NotFound'
import { MENU, formatPrice, getCategory, getItem } from '../data/menu'
import usePageTitle from '../hooks/usePageTitle'
import './ProductDetail.css'

// Up to 3 other items: same category first, then best sellers.
function getSuggestions(item) {
  const sameCategory = MENU.filter((other) => other.category === item.category && other.id !== item.id)
  const others = MENU.filter((other) => other.bestSeller && other.category !== item.category)
  return [...sameCategory, ...others].slice(0, 3)
}

export default function ProductDetail() {
  const { id } = useParams()
  const item = getItem(id)
  usePageTitle(item?.name || 'Not found')

  if (!item) return <NotFound />

  const category = getCategory(item.category)

  return (
    <>
      <section className="product">
        <div className="container">
          <nav className="product__crumbs" aria-label="Breadcrumb">
            <Link to="/menu">Menu</Link>
            <FiChevronRight aria-hidden="true" />
            <Link to={`/menu?category=${category.id}`}>{category.name}</Link>
            <FiChevronRight aria-hidden="true" />
            <span aria-current="page">{item.name}</span>
          </nav>

          <div className="product__grid">
            <motion.div
              key={item.id}
              className="product__photo zoom-img"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <SmartImage src={item.image} alt={item.name} emoji={category.emoji} tone={category.tone} eager />
              {item.bestSeller && <span className="product__badge">Best seller</span>}
            </motion.div>

            <motion.div
              key={`${item.id}-info`}
              className="product__info"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <span className="script">{category.name.toLowerCase()}</span>
              <h1>{item.name}</h1>
              <p className="product__price">
                {formatPrice(item.price, item.priceFrom)} <span>/ {item.unit}</span>
              </p>
              <p className="product__desc">{item.description}</p>

              {/* key resets the form when you open a different item */}
              <OrderPanel key={item.id} item={item} />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="section section--blush">
        <div className="container">
          <Reveal className="section-head">
            <span className="script">more to love</span>
            <h2 className="section-title">You may also like</h2>
          </Reveal>
          <div className="product__suggestions">
            {getSuggestions(item).map((other, i) => (
              <Reveal key={other.id} delay={i * 0.1}>
                <ProductCard item={other} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
