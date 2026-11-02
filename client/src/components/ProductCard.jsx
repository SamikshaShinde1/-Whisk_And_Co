import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiCheck, FiPlus } from 'react-icons/fi'
import SmartImage from './SmartImage'
import PriceTag from './PriceTag'
import { getCategory } from '../data/menu'
import useCart from '../hooks/useCart'
import { twoDigits } from '../numbers'
import './ProductCard.css'

// A menu item card. Clicking it opens the item's detail page; the round + button adds one to the cart.
// Sold-out items stay on the menu, with a grey photo and a "Sold out" label (and no + button).
// Specials running today get a gold "Diwali Special"-style label and their offer price.
// "number" (optional) shows a panel number like "01" in the corner, as on a numbered post.
export default function ProductCard({ item, number }) {
  const category = getCategory(item.category)
  const soldOut = !item.available
  const special = item.specialActive
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  // After adding, show a tick for a moment
  useEffect(() => {
    if (!added) return
    const timer = setTimeout(() => setAdded(false), 1500)
    return () => clearTimeout(timer)
  }, [added])

  return (
    // The card is a box with a link inside, because a button can't be placed inside a link
    <article className={`product-card ${soldOut ? 'product-card--soldout' : special ? 'product-card--special' : ''}`}>
      <Link to={`/menu/${item.slug}`} className="product-card__link">
        <div className={`product-card__media zoom-img ${soldOut ? 'is-soldout' : ''}`}>
          <SmartImage src={item.image} alt={item.name} emoji={category.emoji} tone={category.tone} />
          {soldOut ? (
            <span className="soldout-badge product-card__badge-pos">Sold out</span>
          ) : special ? (
            <span className="special-badge product-card__badge-pos">✨ {item.specialTag}</span>
          ) : (
            item.bestSeller && <span className="product-card__badge">Best seller</span>
          )}
          {number && (
            <span className="product-card__no" aria-hidden="true">{twoDigits(number)}</span>
          )}
        </div>
        <div className="product-card__body">
          <span className="product-card__category">{category.name}</span>
          <h3>{item.name}</h3>
          <div className="product-card__footer">
            <span className="product-card__price">
              <PriceTag item={item} />
              <small> / {item.unit}</small>
            </span>
          </div>
        </div>
      </Link>

      {!soldOut && (
        <button
          type="button"
          className={`product-card__add ${added ? 'is-added' : ''}`}
          onClick={() => addItem(item.slug) && setAdded(true)}
          aria-label={added ? `${item.name} added to cart` : `Add ${item.name} to cart`}
          title="Add to cart"
        >
          {added ? <FiCheck /> : <FiPlus />}
        </button>
      )}
    </article>
  )
}
