import { Link } from 'react-router-dom'
import Reveal from '../Reveal'
import SmartImage from '../SmartImage'
import { formatPrice, getItem } from '../../data/menu'
import './SignatureBake.css'

// "Signature bake": one special item, shown big
const SIGNATURE_ID = 'fudge-brownie'

export default function SignatureBake() {
  const item = getItem(SIGNATURE_ID)

  return (
    <section className="section signature">
      <div className="container signature__grid">
        <Reveal className="signature__text">
          <span className="script">signature bake</span>
          <h2 className="section-title">The fudge brownie</h2>
          <p className="section-text">
            Dense, gooey and deeply chocolatey, with that crackly, shiny top everyone fights over.
            Baked in small trays and cut into generous squares, it is the one bake we are proudest of.
          </p>
          <div className="signature__price">
            <strong>{formatPrice(item.price)}</strong>
            <span>/ {item.unit}</span>
          </div>
          <Link to={`/menu/${item.id}`} className="btn btn-dark">Order a brownie</Link>
        </Reveal>

        <Reveal className="signature__media" delay={0.15}>
          <div className="signature__circle" aria-hidden="true" />
          <div className="signature__photo zoom-img">
            <SmartImage src={item.image} alt={item.name} emoji="🍫" />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
