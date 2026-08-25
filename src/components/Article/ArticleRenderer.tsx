import Box from '@mui/material/Box'
import {
  useLayoutEffect,
  useMemo,
  useRef,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'

const HIGHLIGHTED_TERM_CLASS = 'article-term-highlighted'
const INTERACTIVE_TERM_CLASS = 'article-term-interactive'
const SELECTED_TERM_CLASS = 'article-term-selected'

const delegatedTerm = (
  target: EventTarget,
  container: HTMLElement,
): HTMLElement | null => {
  if (!(target instanceof Element)) return null

  const marker = target.closest<HTMLElement>('[data-term-id]')

  if (
    !marker ||
    !container.contains(marker) ||
    !marker.classList.contains(INTERACTIVE_TERM_CLASS)
  ) {
    return null
  }

  return marker
}

const interactiveTerms = (container: HTMLElement): HTMLElement[] =>
  Array.from(
    container.querySelectorAll<HTMLElement>(
      `.${INTERACTIVE_TERM_CLASS}[data-term-id]`,
    ),
  )

interface ArticleRendererProps {
  contentHtml: string
  highlightedTermIds?: string[]
  selectedTermId?: string | null
  onTermSelect?: (termId: string) => void
  termInstructionsId?: string
  ariaLabel?: string
}

export function ArticleRenderer({
  contentHtml,
  highlightedTermIds = [],
  selectedTermId = null,
  onTermSelect,
  termInstructionsId,
  ariaLabel = 'Article preview',
}: ArticleRendererProps) {
  const containerRef = useRef<HTMLElement | null>(null)
  const termsAreInteractive = onTermSelect !== undefined
  const preparedHtml = useMemo(
    () => ({ __html: contentHtml }),
    [contentHtml],
  )

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const highlightedIds = new Set(highlightedTermIds)
    const markers = Array.from(
      container.querySelectorAll<HTMLElement>('[data-term-id]'),
    )
    const selectedIsInteractive =
      termsAreInteractive &&
      markers.some(
      (marker) =>
          marker.dataset.termId === selectedTermId,
      )
    // A roving tab stop keeps long articles usable while arrow keys reach every term.
    let assignedTabStop = false

    for (const marker of markers) {
      const termId = marker.dataset.termId
      const isHighlighted =
        termId !== undefined && highlightedIds.has(termId)
      const isInteractive =
        termId !== undefined && termsAreInteractive
      const isSelected = isInteractive && termId === selectedTermId

      // Backend highlight recommendations stay visible regardless of lookup mode.
      marker.classList.toggle(HIGHLIGHTED_TERM_CLASS, isHighlighted)
      marker.classList.toggle(INTERACTIVE_TERM_CLASS, isInteractive)
      marker.classList.toggle(SELECTED_TERM_CLASS, isSelected)

      if (!isInteractive) {
        marker.removeAttribute('aria-describedby')
        marker.removeAttribute('aria-pressed')
        marker.removeAttribute('role')
        marker.removeAttribute('tabindex')
        continue
      }

      marker.setAttribute('role', 'button')
      marker.setAttribute('aria-pressed', String(isSelected))
      if (termInstructionsId) {
        marker.setAttribute('aria-describedby', termInstructionsId)
      } else {
        marker.removeAttribute('aria-describedby')
      }

      const isTabStop: boolean =
        selectedIsInteractive ? isSelected : !assignedTabStop
      marker.tabIndex = isTabStop ? 0 : -1
      assignedTabStop = assignedTabStop || isTabStop
    }
  }, [
    contentHtml,
    highlightedTermIds,
    selectedTermId,
    termInstructionsId,
    termsAreInteractive,
  ])

  const activateTerm = (term: HTMLElement) => {
    const termId = term.dataset.termId
    if (!termId || !onTermSelect) return

    const container = containerRef.current
    if (!container) return

    for (const candidate of interactiveTerms(container)) {
      const isSelected = candidate === term
      candidate.tabIndex = isSelected ? 0 : -1
      candidate.setAttribute('aria-pressed', String(isSelected))
      candidate.classList.toggle(SELECTED_TERM_CLASS, isSelected)
    }
    term.focus({ preventScroll: true })
    onTermSelect(termId)
  }

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    const term = delegatedTerm(event.target, event.currentTarget)
    if (!term) return

    // Guardian content can wrap a marked term in an external link. Lookup
    // takes precedence while vocabulary mode is active, so the reader stays
    // on this article instead of following that link.
    event.preventDefault()
    activateTerm(term)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const term = delegatedTerm(event.target, event.currentTarget)
    if (!term) return

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      activateTerm(term)
      return
    }

    const terms = interactiveTerms(event.currentTarget)
    const currentIndex = terms.indexOf(term)
    if (currentIndex < 0) return

    let nextIndex: number | null = null
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % terms.length
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + terms.length) % terms.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = terms.length - 1
    }

    if (nextIndex === null) return

    event.preventDefault()
    for (const [index, candidate] of terms.entries()) {
      candidate.tabIndex = index === nextIndex ? 0 : -1
    }
    terms[nextIndex]?.focus()
  }

  return (
    <Box
      ref={containerRef}
      component="article"
      aria-label={ariaLabel}
      data-testid="isolated-article-renderer"
      onClick={termsAreInteractive ? handleClick : undefined}
      onKeyDown={termsAreInteractive ? handleKeyDown : undefined}
      sx={{
        color: 'text.primary',
        fontFamily: '"Merriweather", "Be Vietnam Pro", serif',
        fontSize: { xs: 18, sm: 19 },
        lineHeight: 1.88,
        overflowWrap: 'anywhere',
        '& > :first-of-type': { mt: 0 },
        '& > :last-of-type': { mb: 0 },
        '& h1, & h2, & h3, & h4, & h5, & h6': {
          lineHeight: 1.2,
          scrollMarginTop: 24,
          textWrap: 'balance',
        },
        '& img': {
          display: 'block',
          maxWidth: '100%',
          height: 'auto',
          borderRadius: 2,
        },
        '& figure': { m: 0, my: 3 },
        '& blockquote': {
          ml: 0,
          pl: 2.5,
          borderLeft: 3,
          borderColor: 'divider',
          color: 'text.secondary',
        },
        '& a': {
          color: 'primary.main',
          textUnderlineOffset: '3px',
        },
        '& table': {
          display: 'block',
          maxWidth: '100%',
          overflowX: 'auto',
          borderCollapse: 'collapse',
        },
        '& th, & td': {
          p: 1,
          border: 1,
          borderColor: 'divider',
        },
        [`& .${HIGHLIGHTED_TERM_CLASS}`]: {
          boxDecorationBreak: 'clone',
          WebkitBoxDecorationBreak: 'clone',
          px: '2px',
          borderBottom: '2px solid',
          borderBottomColor: 'secondary.main',
          borderRadius: '3px',
          bgcolor: 'secondary.light',
        },
        [`& .${INTERACTIVE_TERM_CLASS}[role="button"]`]: {
          cursor: 'pointer',
          touchAction: 'manipulation',
          transition:
            'background-color 140ms ease, box-shadow 140ms ease',
          '@media (prefers-reduced-motion: reduce)': {
            transition: 'none',
          },
          '&:hover': {
            bgcolor: '#F3D2B4',
          },
          '&:focus-visible': {
            outline: '3px solid rgba(182, 106, 44, 0.35)',
            outlineOffset: 3,
          },
        },
        [`& .${SELECTED_TERM_CLASS}`]: {
          bgcolor: '#F3D2B4',
          boxShadow: 'inset 0 -2px 0 #864719',
        },
      }}
      // Trust boundary: callers provide only HTML sanitized by Vocab Mate's backend.
      dangerouslySetInnerHTML={preparedHtml}
    />
  )
}
