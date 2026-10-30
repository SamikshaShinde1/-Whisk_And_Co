import { Link } from 'react-router-dom'
import { FiArrowUpRight } from 'react-icons/fi'
import SmartImage from './SmartImage'
import PriceTag from './PriceTag'
import { getCategory } from '../data/menu'
import './ProductCard.css'

// A menu item card. Clicking it opens the item's detail page.
// Sold-out items stay on the menu, with a grey photo and a "Sold out" label.
// Specials running today get a gold "Diwali Special"-style label and their offer price.
export default function ProductCard({ item }) {
  const category = getCategory(item.category)
  const soldOut = !item.available
  const special = item.specialActive

  return (
    <Link to={`/menu/${item.slug}`} className={`product-card ${soldOut ? 'product-card--soldout' : special ? 'product-card--special' : ''}`}>
      <div className={`product-card__media zoom-img ${soldOut ? 'is-soldout' : ''}`}>
        <SmartImage src={item.image} alt={item.name} emoji={category.emoji} tone={category.tone} />
        {soldOut ? (
          <span className="soldout-badge product-card__badge-pos">Sold out</span>
        ) : special ? (
          <span className="special-badge product-card__badge-pos">✨ {item.specialTag}</span>
        ) : (
          item.bestSeller && <span className="product-card__badge">Best seller</span>
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
          <span className="product-card__go" aria-hidden="true">
            <FiArrowUpRight />
          </span>
        </div>
      </div>
    </Link>
  )
}
