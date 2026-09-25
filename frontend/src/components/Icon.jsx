import paths from '../assets/icons/paths.json'

// Paths from Google's Material Symbols SVGs; see assets/icons/README.md.
export default function Icon({ name, variant = 'rounded', size = 24, className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -960 960 960"
      width={size}
      height={size}
      fill="currentColor"
      className={`inline-block shrink-0 align-middle ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      {paths[`${variant}/${name}`]?.map((d, index) => <path key={index} d={d} />)}
    </svg>
  )
}
