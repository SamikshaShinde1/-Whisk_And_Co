import { Link } from 'react-router-dom'
import { FiArrowRight } from 'react-icons/fi'
import Reveal from '../Reveal'
import ProductCard from '../ProductCard'
import { LoadError, LoadingCards } from '../MenuStatus'
import useProducts from '../../hooks/useProducts'
import './FreshFromOven.css'

// "Fresh from the oven": our best sellers (items marked "Best seller" on the Manage menu page)
export default function FreshFromOven() {
  const { products, loading, error, retry } = useProducts()
  const bestSellers = products.filter((item) => item.bestSeller)

  return (
    <section className="section">
      <div className="container">
        <Reveal className="section-head">
          <span className="script">best sellers</span>
          <h2 className="section-title">Fresh from the oven</h2>
          <p className="section-text">The bakes our customers order again and again.</p>
        </Reveal>

        {error && <LoadError message={error} onRetry={retry} />}

        <div className="fresh__grid">
          {loading && <LoadingCards count={3} />}
          {bestSellers.map((item, i) => (
            <Reveal key={item.slug} delay={i * 0.12}>
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
