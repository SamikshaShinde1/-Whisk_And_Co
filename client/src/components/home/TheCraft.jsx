import { Link } from 'react-router-dom'
import Reveal from '../Reveal'
import BigWord from '../BigWord'
import ChapterNo from './ChapterNo'
import SmartImage from '../SmartImage'
import { CRAFT_IMAGE } from '../../data/menu'
import './TheCraft.css'

// Tip: change this text to tell your own story!
const POINTS = [
  { title: 'Made by hand', text: 'Every loaf and cake is mixed, shaped and finished by hand.' },
  { title: 'Small batches', text: 'We bake a little at a time, so everything is fresh.' },
  { title: 'Baked to order', text: 'Your order goes into the oven just for you.' },
]

// "The craft" – the About section (the navbar's About link scrolls here)
export default function TheCraft({ chapter }) {
  return (
    <section className="section section--dark craft has-big-word" id="about">
      <BigWord word="Craft" className="craft__word" />
      <div className="container craft__grid">
        {/* the photo slides in from the left */}
        <Reveal className="craft__media" x={-70}>
          <div className="craft__photo zoom-img">
            <SmartImage src={CRAFT_IMAGE} alt="Hands kneading bread dough" emoji="🥖" />
          </div>
          <span className="craft__stamp">since day one</span>
        </Reveal>

        <Reveal className="craft__text" delay={0.15}>
          <ChapterNo n={chapter} />
          <span className="script">the craft</span>
          <h2 className="section-title">Slow baking, made by hand</h2>
          <p className="section-text">
            Pastel n Postery began in a home kitchen with a simple belief: good things take time.
            We knead, proof and bake in small batches, so every bite tastes the way homemade
            should.
          </p>

          <ul className="craft__points">
            {POINTS.map((point, i) => (
              <li key={point.title}>
                <span className="craft__num">0{i + 1}</span>
                <div>
                  <h3>{point.title}</h3>
                  <p>{point.text}</p>
                </div>
              </li>
            ))}
          </ul>

          <Link to="/menu" className="btn btn-rose">Explore the menu</Link>
        </Reveal>
      </div>
    </section>
  )
}
