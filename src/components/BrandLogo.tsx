import './BrandLogo.scss'

interface BrandLogoProps {
  // "full" = isotipo + nombre; "mark" = solo el isotipo (sol naciente con la cruz).
  variant?: 'full' | 'mark'
  // "light" para usarlo sobre fondos oscuros (pie de página, menú móvil).
  tone?: 'dark' | 'light'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// Marca de Clínica Aurora. El isotipo es un SVG (public/logo-aurora.svg) y el nombre va como texto
// real — así se ve nítido en cualquier tamaño, usa la misma tipografía que el resto del sitio y los
// lectores de pantalla lo leen como "Clínica Aurora".
export default function BrandLogo({ variant = 'full', tone = 'dark', size = 'md', className = '' }: BrandLogoProps) {
  return (
    <span className={`brand brand--${tone} brand--${size} ${className}`.trim()}>
      <img className="brand__mark" src="/logo-aurora.svg" alt={variant === 'mark' ? 'Clínica Aurora' : ''} />
      {variant === 'full' && (
        <span className="brand__text">
          <span className="brand__kicker">Clínica</span>
          <span className="brand__name">Aurora</span>
        </span>
      )}
    </span>
  )
}
