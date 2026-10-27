import { Link } from 'react-router-dom'
import { FiArrowUpRight } from 'react-icons/fi'
import SmartImage from './SmartImage'
import { formatPrice, getCategory } from '../data/menu'
import './ProductCard.css'

// A menu item card. Clicking it opens the item's detail page.
export default function ProductCard({ item }) {
  const category = getCategory(item.category)

  return (
    <Link to={`/menu/${item.id}`} className="product-card">
      <div className="product-card__media zoom-img">
        <SmartImage src={item.image} alt={item.name} emoji={category.emoji} tone={category.tone} />
        {item.bestSeller && <span className="product-card__badge">Best seller</span>}
      </div>
      <div className="product-card__body">
        <span className="product-card__category">{category.name}</span>
        <h3>{item.name}</h3>
        <div className="product-card__footer">
          <span className="product-card__price">
            {formatPrice(item.price, item.priceFrom)}
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
