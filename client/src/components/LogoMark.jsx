import { useState } from 'react'
import './LogoMark.css'

// The round logo picture (client/public/logo.png).
// If the file isn't there yet, a simple "P" badge is shown instead.
export default function LogoMark({ size = 44, className = '' }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <span
        className={`logo-mark logo-mark--fallback ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.5 }}
        aria-hidden="true"
      >
        P
      </span>
    )
  }

  return (
    <img
      src="/logo.png"
      alt=""
      width={size}
      height={size}
      className={`logo-mark ${className}`}
      onError={() => setFailed(true)}
    />
  )
}
