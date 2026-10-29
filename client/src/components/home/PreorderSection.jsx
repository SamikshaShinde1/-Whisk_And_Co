import { Link } from 'react-router-dom'
import { FaWhatsapp } from 'react-icons/fa'
import Reveal from '../Reveal'
import SmartImage from '../SmartImage'
import { formatPrice } from '../../data/menu'
import { SITE, whatsappLink } from '../../config/site'
import useProducts, { findProduct } from '../../hooks/useProducts'
import './PreorderSection.css'

// Items shown as small cards in this section (their web address names in the menu)
const PREORDER_SLUGS = ['custom-birthday-cake', 'assorted-cookie-box', 'sourdough']

export default function PreorderSection() {
  const { products } = useProducts()
  // Skips any item that was deleted (sold-out ones stay, in grey)
  const items = PREORDER_SLUGS.map((slug) => findProduct(products, slug)).filter(Boolean)

  return (
    <section className="section section--blush preorder" id="preorder">
      <div className="container preorder__grid">
        <Reveal className="preorder__text">
          <span className="script">plan ahead</span>
          <h2 className="section-title">Preorder your favourites</h2>
          <p className="section-text">{SITE.preorderNote}</p>
          <div className="preorder__actions">
            <Link to="/menu" className="btn btn-dark">Browse the menu</Link>
            <a href={whatsappLink()} target="_blank" rel="noreferrer" className="btn btn-whatsapp">
              <FaWhatsapp /> WhatsApp us
            </a>
          </div>
        </Reveal>

        <div className="preorder__list">
          {items.map((item, i) => (
            <Reveal key={item.slug} delay={i * 0.1} y={24}>
              <Link to={`/menu/${item.slug}`} className="mini-card">
                <div className={`mini-card__photo zoom-img ${item.available ? '' : 'is-soldout'}`}>
                  <SmartImage src={item.image} alt={item.name} />
                </div>
                <div className="mini-card__body">
                  <h3>{item.name}</h3>
                  <span>{formatPrice(item.price, item.priceFrom)} / {item.unit}</span>
                </div>
                {item.available ? (
                  <span className="mini-card__cta">Preorder</span>
                ) : (
                  <span className="soldout-badge">Sold out</span>
                )}
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
