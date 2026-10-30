import { FiShoppingBag } from 'react-icons/fi'
import useCart from '../../hooks/useCart'
import './CartButton.css'

// The bag icon in the navbar. The little number is how many items are in the cart.
export default function CartButton() {
  const { count, openCart, bump } = useCart()

  return (
    <button type="button" className="cart-button" onClick={openCart} aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`}>
      {/* the key changes on every "Add to cart", which replays the bounce animation */}
      <span key={bump} className={`cart-button__icon ${bump ? 'is-bouncing' : ''}`}>
        <FiShoppingBag aria-hidden="true" />
        {count > 0 && <span className="cart-button__count">{count > 99 ? '99+' : count}</span>}
      </span>
    </button>
  )
}
