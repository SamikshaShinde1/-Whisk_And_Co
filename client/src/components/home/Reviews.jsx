import { FaStar, FaQuoteLeft, FaInstagram } from 'react-icons/fa'
import Reveal from '../Reveal'
import BigWord from '../BigWord'
import ChapterNo from './ChapterNo'
import { twoDigits } from '../../numbers'
import { REVIEWS } from '../../data/reviews'
import { SITE } from '../../config/site'
import './Reviews.css'

// "What our customers say": each review is a numbered panel, like a post
export default function Reviews({ chapter }) {
  return (
    <section className="section section--dark has-big-word">
      <BigWord word="kind words" />
      <div className="container">
        <Reveal className="section-head">
          <ChapterNo n={chapter} />
          <span className="script">kind words</span>
          <h2 className="section-title">What our customers say</h2>
        </Reveal>

        <div className="reviews__grid">
          {REVIEWS.map((review, i) => (
            <Reveal key={review.name} delay={i * 0.12} className="review-card">
              <span className="review-card__no" aria-hidden="true">{twoDigits(i + 1)}</span>
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
