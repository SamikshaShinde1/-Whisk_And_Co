import { Link } from 'react-router-dom'
import { FaInstagram, FaWhatsapp } from 'react-icons/fa'
import Logo from './Logo'
import BigWord from './BigWord'
import ThemeToggle from './ThemeToggle'
import { CATEGORIES } from '../data/menu'
import { SITE, whatsappLink } from '../config/site'
import './Footer.css'

const YEAR = new Date().getFullYear()

// "compact" = one slim line, used on the admin pages
export default function Footer({ compact = false }) {
  if (compact) {
    return (
      <footer className="footer footer--compact">
        <div className="container footer__bottom">
          <span>© {YEAR} {SITE.name}</span>
          <Link to="/" className="footer__staff">Back to website</Link>
          <ThemeToggle />
        </div>
      </footer>
    )
  }

  return (
    <footer className="footer has-big-word" id="contact">
      {/* the bakery's name, huge and faint behind the footer, like a signature */}
      <BigWord word={SITE.name} className="footer__word" speed={30} />
      <div className="container footer__grid">
        <div className="footer__brand">
          <Logo size={32} />
          <p className="footer__script">See you in the morning</p>
          <p className="footer__text">Small-batch cakes, breads and treats, baked fresh at home.</p>
          <div className="footer__social">
            <a href={SITE.instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram">
              <FaInstagram />
            </a>
            <a href={whatsappLink()} target="_blank" rel="noreferrer" aria-label="WhatsApp">
              <FaWhatsapp />
            </a>
          </div>
        </div>

        <div>
          <h4>Opening hours</h4>
          <ul className="footer__hours">
            {SITE.hours.map((row) => (
              <li key={row.days}>
                <span>{row.days}</span>
                <span>{row.time}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4>Menu</h4>
          <ul>
            {CATEGORIES.map((category) => (
              <li key={category.id}>
                <Link to={`/menu?category=${category.id}`}>{category.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4>Contact</h4>
          <ul>
            <li>
              <a href={SITE.instagramUrl} target="_blank" rel="noreferrer">{SITE.instagramHandle}</a>
            </li>
            <li>
              <a href={whatsappLink()} target="_blank" rel="noreferrer">Chat on WhatsApp</a>
            </li>
            <li><Link to="/track">Track your order</Link></li>
            <li><Link to="/#about">About us</Link></li>
          </ul>
        </div>
      </div>

      {/* one thin line at the bottom: copyright, Staff login and light/dark mode */}
      <div className="container footer__bottom">
        <span>© {YEAR} {SITE.name}. Baked with love.</span>
        <Link to="/admin/login" className="footer__staff">Staff login</Link>
        <ThemeToggle />
      </div>
    </footer>
  )
}
