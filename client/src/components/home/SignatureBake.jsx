import { Link } from 'react-router-dom'
import Reveal from '../Reveal'
import BigWord from '../BigWord'
import ChapterNo from './ChapterNo'
import SmartImage from '../SmartImage'
import PriceTag from '../PriceTag'
import useProducts, { findProduct } from '../../hooks/useProducts'
import './SignatureBake.css'

// "Signature bake": one special item, shown big (its web address name in the menu).
// Home.jsx uses it too, to leave this chapter out if the item was deleted.
export const SIGNATURE_SLUG = 'fudge-brownie'

export default function SignatureBake({ chapter }) {
  const { products, loading } = useProducts()
  const item = findProduct(products, SIGNATURE_SLUG)

  // Hide the section if the brownie was deleted
  if (!loading && !item) return null
  const soldOut = item && !item.available

  return (
    <section className="section signature has-big-word">
      <BigWord word="Brownie" className="signature__word" />
      <div className="container signature__grid">
        <Reveal className="signature__text">
          <ChapterNo n={chapter} />
          <span className="script">signature bake</span>
          <h2 className="section-title">The fudge brownie</h2>
          <p className="section-text">
            Dense, gooey and deeply chocolatey, with that crackly, shiny top everyone fights over.
            Baked in small trays and cut into generous squares, it is the one bake we are proudest of.
          </p>
          {item && (
            <div className="signature__price">
              <strong><PriceTag item={item} /></strong>
              <span>/ {item.unit}</span>
              {soldOut && <span className="soldout-badge">Sold out</span>}
            </div>
          )}
          <Link to={`/menu/${SIGNATURE_SLUG}`} className="btn btn-dark">Order a brownie</Link>
        </Reveal>

        {/* the photo slides in from the right */}
        <Reveal className="signature__media" delay={0.15} x={70}>
          <div className="signature__circle" aria-hidden="true" />
          <div className={`signature__photo zoom-img ${soldOut ? 'is-soldout' : ''}`}>
            <SmartImage src={item?.image} alt={item?.name || 'Fudge brownie'} emoji="🍫" pending={loading} />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
