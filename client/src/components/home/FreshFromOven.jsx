import { Link } from 'react-router-dom'
import { FiArrowRight } from 'react-icons/fi'
import Reveal from '../Reveal'
import ProductCard from '../ProductCard'
import { BEST_SELLERS } from '../../data/menu'
import './FreshFromOven.css'

// "Fresh from the oven": our best sellers
export default function FreshFromOven() {
  return (
    <section className="section">
      <div className="container">
        <Reveal className="section-head">
          <span className="script">best sellers</span>
          <h2 className="section-title">Fresh from the oven</h2>
          <p className="section-text">The bakes our customers order again and again.</p>
        </Reveal>

        <div className="fresh__grid">
          {BEST_SELLERS.map((item, i) => (
            <Reveal key={item.id} delay={i * 0.12}>
              <ProductCard item={item} />
            </Reveal>
          ))}
        </div>

        <Reveal className="fresh__more">
          <Link to="/menu" className="btn btn-outline">
            See the full menu <FiArrowRight />
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
