interface PageNavigatorProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function PageNavigator({ currentPage, totalPages, onPageChange }: PageNavigatorProps) {
  if (totalPages <= 1) return null

  return (
    <nav className="page-navigator" aria-label="Navegación de páginas del PDF">
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        aria-label="Página anterior"
      >
        ◀ Anterior
      </button>
      <span className="page-navigator__info" aria-live="polite">
        Página <strong>{currentPage + 1}</strong> de {totalPages}
      </span>
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages - 1}
        aria-label="Página siguiente"
      >
        Siguiente ▶
      </button>
    </nav>
  )
}
