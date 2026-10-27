import { FaStar, FaQuoteLeft, FaInstagram } from 'react-icons/fa'
import Reveal from '../Reveal'
import { REVIEWS } from '../../data/reviews'
import { SITE } from '../../config/site'
import './Reviews.css'

// "What our customers say"
export default function Reviews() {
  return (
    <section className="section section--dark">
      <div className="container">
        <Reveal className="section-head">
          <span className="script">kind words</span>
          <h2 className="section-title">What our customers say</h2>
        </Reveal>

        <div className="reviews__grid">
          {REVIEWS.map((review, i) => (
            <Reveal key={review.name} delay={i * 0.12} className="review-card">
              <FaQuoteLeft className="review-card__quote" aria-hidden="true" />
              <div className="review-card__stars" aria-label="5 out of 5 stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar key={star} aria-hidden="true" />
                ))}
              </div>
              <p>{review.text}</p>
              <div className="review-card__author">
                <span className="review-card__avatar" aria-hidden="true">{review.name[0]}</span>
                <div>
                  <strong>{review.name}</strong>
                  <span>{review.item}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="reviews__more">
          <a href={SITE.instagramUrl} target="_blank" rel="noreferrer" className="btn btn-outline-light">
            <FaInstagram /> More on Instagram
          </a>
        </Reveal>
      </div>
    </section>
  )
}
