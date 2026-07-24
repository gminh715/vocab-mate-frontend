import Box from '@mui/material/Box'

interface ArticleRendererProps {
  contentHtml: string
  highlightedTermIds?: string[]
  ariaLabel?: string
}

export function ArticleRenderer({
  contentHtml,
  highlightedTermIds = [],
  ariaLabel = 'Article preview',
}: ArticleRendererProps) {
  const highlightedStyles = Object.fromEntries(
    highlightedTermIds.map((termId) => [
      `& [data-term-id="${termId}"]`,
      {
        backgroundColor: 'secondary.light',
        borderBottom: '2px solid',
        borderBottomColor: 'secondary.main',
        borderRadius: '3px',
        paddingInline: '2px',
      },
    ]),
  )

  return (
    <Box
      component="article"
      aria-label={ariaLabel}
      data-testid="isolated-article-renderer"
      sx={{
        color: 'text.primary',
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: { xs: 17, sm: 18 },
        lineHeight: 1.8,
        overflowWrap: 'anywhere',
        '& > :first-of-type': { mt: 0 },
        '& > :last-of-type': { mb: 0 },
        '& h1, & h2, & h3, & h4, & h5, & h6': {
          lineHeight: 1.2,
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
        ...highlightedStyles,
      }}
      dangerouslySetInnerHTML={{ __html: contentHtml }}
    />
  )
}
