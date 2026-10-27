import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import usePageTitle from '../hooks/usePageTitle'

export default function NotFound() {
  usePageTitle('Page not found')

  return (
    <PageHeader script="oops" title="404 · Page not found" text="This page seems to have crumbled away. Let's get you back to something sweet.">
      <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginTop: 32 }}>
        <Link to="/" className="btn btn-rose">Back to home</Link>
        <Link to="/menu" className="btn btn-outline-light">See the menu</Link>
      </div>
    </PageHeader>
  )
}
