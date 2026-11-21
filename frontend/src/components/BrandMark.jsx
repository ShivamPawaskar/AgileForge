import { useId } from 'react'

export default function BrandMark({ className = '' }) {
  const gradientId = useId().replaceAll(':', '')
  return <span className={`brand-mark ${className}`} role="img" aria-label="AgileForge">
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${gradientId}-bg`} x1="5" y1="3" x2="36" y2="39" gradientUnits="userSpaceOnUse"><stop stopColor="#A998FF"/><stop offset=".52" stopColor="#806CE0"/><stop offset="1" stopColor="#5142A8"/></linearGradient>
        <linearGradient id={`${gradientId}-metal`} x1="11" y1="9" x2="30" y2="31" gradientUnits="userSpaceOnUse"><stop stopColor="#FFF"/><stop offset="1" stopColor="#D8D0FF"/></linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="12" fill={`url(#${gradientId}-bg)`}/>
      <path d="M10 29.5 18.1 11a2.1 2.1 0 0 1 3.8 0L30 29.5" stroke={`url(#${gradientId}-metal)`} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14.2 22.4h11.6M11.3 32.1h17.4" stroke="#EEE9FF" strokeWidth="2.8" strokeLinecap="round"/>
      <path d="m29.5 7.1.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1Z" fill="#FFF0AD"/>
      <circle cx="10.1" cy="10.1" r="1.3" fill="#DCD4FF" opacity=".8"/>
    </svg>
  </span>
}
