import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { SparklesIcon } from '@/components/Dashboard/DashboardIcons'
import type { WarmupFactStory } from '@/types/Tutor/tutor'

interface TutorWarmupFactsViewProps {
  facts: WarmupFactStory[]
  targetCount: number
  onStartTest: () => void
}

/**
 * Parses and renders text, styling bolded English terms **word** (translation)
 * with a prominent bold badge and clean inline translation.
 */
function renderWarmupFactText(text: string) {
  if (!text) return null

  const regex = /(\*\*[^*]+\*\*(?:\s*\([^)]+\))?)/g
  const chunks = text.split(regex)

  if (chunks.length <= 1) {
    return text
  }

  return chunks.map((chunk, index) => {
    const match = chunk.match(/^\*\*([^*]+)\*\*(?:\s*(\(([^)]+)\)))?$/)
    if (match) {
      const englishWord = match[1].trim()
      const translation = match[3]?.trim()
      return (
        <Box
          key={index}
          component="span"
          sx={{
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: 0.5,
            mx: 0.5,
            px: 0.85,
            py: 0.15,
            borderRadius: 1.5,
            bgcolor: 'rgba(124, 58, 237, 0.1)',
            border: '1px solid rgba(124, 58, 237, 0.25)',
            verticalAlign: 'baseline',
          }}
        >
          <Box
            component="strong"
            sx={{
              fontWeight: 800,
              color: 'primary.main',
              fontSize: '1.05em',
              letterSpacing: '0.01em',
            }}
          >
            {englishWord}
          </Box>
          {translation && (
            <Box
              component="span"
              sx={{
                fontWeight: 500,
                fontSize: '0.9em',
                color: 'text.secondary',
              }}
            >
              ({translation})
            </Box>
          )}
        </Box>
      )
    }
    return chunk
  })
}

export function TutorWarmupFactsView({
  facts,
  targetCount,
  onStartTest,
}: TutorWarmupFactsViewProps) {
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Stack
          direction="row"
          spacing={1}
          sx={{ justifyContent: 'center', alignItems: 'center', mb: 1 }}
        >
          <SparklesIcon size={24} color="#7c3aed" />
          <Typography
            variant="h5"
            component="h1"
            sx={{
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'text.primary',
            }}
          >
            Khởi Động & Củng Cố Từ Vựng
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 580, mx: 'auto' }}>
          Khám phá các sự thật thú vị dưới đây để ghi nhớ sâu các từ vựng cần học lại trước khi bắt đầu bài kiểm tra:
        </Typography>
      </Box>

      {/* List of Fact Cards */}
      <Stack spacing={3} sx={{ mb: 4 }}>
        {facts.map((fact, index) => (
          <Paper
            key={index}
            variant="outlined"
            sx={{
              p: { xs: 2.5, sm: 3 },
              borderRadius: 3,
              bgcolor: 'background.paper',
              borderColor: 'primary.light',
              borderWidth: 1.5,
              boxShadow: '0 4px 20px rgba(124, 58, 237, 0.06)',
            }}
          >
            {/* Fact Card Top Bar */}
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="h6"
                component="h2"
                sx={{
                  fontWeight: 800,
                  color: 'primary.main',
                  letterSpacing: '-0.01em',
                }}
              >
                💡 {fact.title || `Fact Tri Thức #${index + 1}`}
              </Typography>
            </Box>

            {/* Fact Content Story */}
            <Box
              sx={{
                p: 2.25,
                borderRadius: 2.5,
                bgcolor: 'rgba(124, 58, 237, 0.03)',
                borderLeft: '4px solid',
                borderColor: 'primary.main',
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  lineHeight: 1.85,
                  fontSize: '1.0625rem',
                  color: 'text.primary',
                  fontWeight: 500,
                  whiteSpace: 'pre-line',
                }}
              >
                {renderWarmupFactText(fact.factContentVi)}
              </Typography>
            </Box>
          </Paper>
        ))}
      </Stack>

      {/* Start Testing Button */}
      <Box sx={{ textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={onStartTest}
          sx={{
            py: 1.75,
            borderRadius: 3,
            fontWeight: 800,
            fontSize: '1.1rem',
            boxShadow: '0 6px 20px rgba(124, 58, 237, 0.35)',
            textTransform: 'none',
          }}
        >
          Tôi đã hiểu, Bắt đầu làm bài kiểm tra ({targetCount} câu hỏi) 🚀
        </Button>
      </Box>
    </Box>
  )
}
