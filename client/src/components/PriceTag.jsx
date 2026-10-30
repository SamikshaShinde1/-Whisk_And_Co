import { formatPrice, hasOffer } from '../data/menu'

// An item's price. During a special offer it shows the old price crossed out, then the offer price:
//   ~~₹650~~ ₹499
// Use it anywhere a menu price is shown, so offers look the same everywhere.
export default function PriceTag({ item }) {
  if (!hasOffer(item)) return formatPrice(item.price, item.priceFrom)

  return (
    <span className="price-offer">
      <s className="price-offer__old">
        <span className="visually-hidden">Was </span>
        {formatPrice(item.price)}
      </s>{' '}
      <span className="price-offer__new">
        <span className="visually-hidden">, now </span>
        {formatPrice(item.offerPrice, item.priceFrom)}
      </span>
    </span>
  )
}
