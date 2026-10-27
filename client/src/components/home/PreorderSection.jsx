import { Link } from 'react-router-dom'
import { FaWhatsapp } from 'react-icons/fa'
import Reveal from '../Reveal'
import SmartImage from '../SmartImage'
import { formatPrice, getItem } from '../../data/menu'
import { SITE, whatsappLink } from '../../config/site'
import './PreorderSection.css'

// Items shown as small cards in this section
const PREORDER_IDS = ['custom-birthday-cake', 'assorted-cookie-box', 'sourdough']

export default function PreorderSection() {
  const items = PREORDER_IDS.map(getItem)

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
            <Reveal key={item.id} delay={i * 0.1} y={24}>
              <Link to={`/menu/${item.id}`} className="mini-card">
                <div className="mini-card__photo zoom-img">
                  <SmartImage src={item.image} alt={item.name} />
                </div>
                <div className="mini-card__body">
                  <h3>{item.name}</h3>
                  <span>{formatPrice(item.price, item.priceFrom)} / {item.unit}</span>
                </div>
                <span className="mini-card__cta">Preorder</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
