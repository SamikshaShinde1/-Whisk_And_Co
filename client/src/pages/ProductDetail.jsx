import { Link, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { FiChevronRight } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import SmartImage from '../components/SmartImage'
import ProductCard from '../components/ProductCard'
import Reveal from '../components/Reveal'
import BigWord from '../components/BigWord'
import OrderPanel from '../components/OrderPanel'
import { LoadError, LoadingNote } from '../components/MenuStatus'
import NotFound from './NotFound'
import PriceTag from '../components/PriceTag'
import { getCategory } from '../data/menu'
import { formatDay } from '../indiaTime'
import { SITE, whatsappLink } from '../config/site'
import usePageTitle from '../hooks/usePageTitle'
import useProducts, { findProduct } from '../hooks/useProducts'
import './ProductDetail.css'

// Up to 3 other items that can be ordered: same category first, then best sellers.
function getSuggestions(products, item) {
  const available = products.filter((other) => other.available)
  const sameCategory = available.filter((other) => other.category === item.category && other.slug !== item.slug)
  const others = available.filter((other) => other.bestSeller && other.category !== item.category)
  return [...sameCategory, ...others].slice(0, 3)
}

export default function ProductDetail() {
  const { slug } = useParams()
  const { products, loading, error, retry } = useProducts()
  const item = findProduct(products, slug)
  usePageTitle(item?.name || (loading ? 'Menu' : 'Not found'))

  // While the menu loads: grey shapes where the photo and details will be
  if (loading) {
    return (
      <section className="product">
        <div className="container">
          <LoadingNote />
          <div className="product__grid" aria-hidden="true">
            <div className="skeleton product__photo" />
            <div className="product__info product__info--loading">
              <div className="skeleton skeleton-line skeleton-line--short" />
              <div className="skeleton product__title-skeleton" />
              <div className="skeleton skeleton-line skeleton-line--price" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line" />
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="product">
        <div className="container">
          <LoadError message={error} onRetry={retry} />
        </div>
      </section>
    )
  }

  // Not on the menu (wrong address or deleted)
  if (!item) return <NotFound />

  const category = getCategory(item.category)
  const soldOut = !item.available

  return (
    <>
      <section className="product has-big-word">
        {/* the category, e.g. "CAKES", huge behind the photo */}
        <BigWord word={category.name.split(' & ')[0]} className="product__word" />
        <div className="container">
          <nav className="product__crumbs" aria-label="Breadcrumb">
            <Link to="/menu">Menu</Link>
            <FiChevronRight aria-hidden="true" />
            <Link to={`/menu?category=${category.id}`}>{category.name}</Link>
            <FiChevronRight aria-hidden="true" />
            <span aria-current="page">{item.name}</span>
          </nav>

          <div className="product__grid">
            {/* the photo as a framed print on a rose card; it stays in view while you scroll (sticky) */}
            <motion.div
              key={item.slug}
              className="product__visual"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
            >
              <div className={`product__photo zoom-img ${soldOut ? 'is-soldout' : ''}`}>
                <SmartImage src={item.image} alt={item.name} emoji={category.emoji} tone={category.tone} eager />
                {soldOut ? (
                  <span className="soldout-badge product__badge-pos">Sold out</span>
                ) : item.specialActive ? (
                  <span className="special-badge product__badge-pos">✨ {item.specialTag}</span>
                ) : (
                  item.bestSeller && <span className="product__badge">Best seller</span>
                )}
              </div>
            </motion.div>

            <motion.div
              key={`${item.slug}-info`}
              className="product__info"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <span className="script">{category.name.toLowerCase()}</span>
              <h1>{item.name}</h1>
              <p className="product__price">
                <PriceTag item={item} /> <span>/ {item.unit}</span>
              </p>
              {item.specialActive && !soldOut && (
                <p className="product__offer-note">
                  ✨ {item.specialTag}{item.specialEnd ? `, until ${formatDay(item.specialEnd)}` : ''}. Order soon!
                </p>
              )}
              <p className="product__desc">{item.description}</p>

              {soldOut ? (
                // Sold out: no order form, but an easy way to ask when it's back
                <div className="product__soldout" role="status">
                  <span className="soldout-badge">Sold out</span>
                  <h2>Sold out for now</h2>
                  <p>This one is all gone at the moment. Message us to ask when it will be back, or pick another treat below.</p>
                  <a
                    href={whatsappLink(`Hi ${SITE.name}! Will ${item.name} be available again soon?`)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-whatsapp"
                  >
                    <FaWhatsapp /> Ask when it's back
                  </a>
                </div>
              ) : (
                // key resets the form when you open a different item
                <OrderPanel key={item.slug} item={item} />
              )}
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
            {getSuggestions(products, item).map((other, i) => (
              <Reveal key={other.slug} delay={i * 0.1}>
                <ProductCard item={other} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
