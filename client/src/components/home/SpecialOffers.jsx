import Reveal from '../Reveal'
import BigWord from '../BigWord'
import ChapterNo from './ChapterNo'
import ProductCard from '../ProductCard'
import useSpecials from '../../hooks/useSpecials'
import { formatDay } from '../../indiaTime'
import './SpecialOffers.css'

// "Special offers" on the Home page. It only appears while at least one special is running today;
// otherwise it is not shown at all.
export default function SpecialOffers({ chapter }) {
  const { specials, title } = useSpecials()
  if (specials.length === 0) return null

  // "Offer ends 5 Nov" when every special has an end date (we show the soonest one)
  const ends = specials.map((item) => item.specialEnd)
  const soonest = ends.every(Boolean) ? [...ends].sort()[0] : ''

  return (
    <section className="section section--blush specials has-big-word" id="specials">
      {/* the last word of the title, e.g. "SPECIALS", huge behind the section */}
      <BigWord word={title.split(' ').pop()} />

      {/* little twinkling sparkles in the background */}
      <div className="specials__sparkles" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i}>✦</span>
        ))}
      </div>

      <div className="container">
        <Reveal className="section-head">
          <ChapterNo n={chapter} />
          <span className="script">limited time</span>
          <h2 className="section-title specials__title">{title}</h2>
          <p className="section-text">
            Festive treats, baked fresh for the season.
            {soonest && <> Offer ends <strong>{formatDay(soonest)}</strong>, so order soon!</>}
          </p>
        </Reveal>

        <div className={`specials__grid ${specials.length === 1 ? 'specials__grid--one' : ''}`}>
          {specials.map((item, i) => (
            <Reveal key={item.slug} delay={i * 0.12} className="specials__card">
              <ProductCard item={item} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
