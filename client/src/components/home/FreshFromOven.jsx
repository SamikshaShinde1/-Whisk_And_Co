import { Link } from 'react-router-dom'
import { FiArrowRight } from 'react-icons/fi'
import Reveal from '../Reveal'
import BigWord from '../BigWord'
import ProductCard from '../ProductCard'
import { LoadError, LoadingCards } from '../MenuStatus'
import useProducts from '../../hooks/useProducts'
import ChapterNo from './ChapterNo'
import './FreshFromOven.css'

// "Fresh from the oven": our best sellers (items marked "Best seller" on the Manage menu page).
// On big screens the title stays in place (sticky) while the numbered cards scroll past.
export default function FreshFromOven({ chapter }) {
  const { products, loading, error, retry } = useProducts()
  const bestSellers = products.filter((item) => item.bestSeller)

  return (
    <section className="section fresh has-big-word">
      <BigWord word="Fresh" className="fresh__word" />

      <div className="container fresh__layout">
        <div className="fresh__intro">
          <Reveal>
            <ChapterNo n={chapter} />
            <span className="script">best sellers</span>
            <h2 className="section-title">Fresh from the oven</h2>
            <p className="section-text">The bakes our customers order again and again.</p>
            <Link to="/menu" className="btn btn-outline fresh__more">
              See the full menu <FiArrowRight />
            </Link>
          </Reveal>
        </div>

        <div className="fresh__cards">
          {error && <LoadError message={error} onRetry={retry} />}
          <div className="fresh__grid">
            {loading && <LoadingCards count={4} />}
            {bestSellers.map((item, i) => (
              // the wrapper holds the "lower" offset, because Reveal moves the card itself
              <div key={item.slug} className={i % 2 ? 'fresh__card--low' : ''}>
                <Reveal delay={(i % 2) * 0.12}>
                  <ProductCard item={item} number={i + 1} />
                </Reveal>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
