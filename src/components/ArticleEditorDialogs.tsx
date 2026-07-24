import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState, type FormEvent } from 'react'

interface EditorLinkDialogProps {
  open: boolean
  initialUrl: string
  canRemove: boolean
  onClose: () => void
  onSave: (url: string) => void
  onRemove: () => void
}

interface EditorImageDialogProps {
  open: boolean
  onClose: () => void
  onSave: (image: {
    src: string
    alt: string
    title?: string
  }) => void
}

const validateUrl = (
  value: string,
  allowedProtocols: ReadonlySet<string>,
): string | null => {
  try {
    const url = new URL(value)
    return allowedProtocols.has(url.protocol)
      ? null
      : 'Use a supported URL protocol.'
  } catch {
    return 'Enter a complete URL.'
  }
}

const linkProtocols = new Set(['http:', 'https:', 'mailto:'])
const imageProtocols = new Set(['http:', 'https:'])

export function EditorLinkDialog({
  open,
  initialUrl,
  canRemove,
  onClose,
  onSave,
  onRemove,
}: EditorLinkDialogProps) {
  const [url, setUrl] = useState(initialUrl)
  const [error, setError] = useState<string | null>(null)

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    event.stopPropagation()
    const nextUrl = url.trim()
    const validationError = validateUrl(nextUrl, linkProtocols)
    if (validationError) {
      setError(validationError)
      return
    }
    onSave(nextUrl)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby="editor-link-dialog-title"
      slotProps={{ paper: { sx: { overscrollBehavior: 'contain' } } }}
    >
      <Box component="form" onSubmit={submit} autoComplete="off">
        <DialogTitle id="editor-link-dialog-title">
          {canRemove ? 'Edit link' : 'Add link'}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Link URL"
            name="linkUrl"
            type="url"
            value={url}
            onChange={(event) => {
              setUrl(event.target.value)
              setError(null)
            }}
            error={Boolean(error)}
            helperText={
              error ?? 'Use an http://, https://, or mailto: address.'
            }
            slotProps={{
              htmlInput: {
                spellCheck: false,
                inputMode: 'url',
              },
            }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          {canRemove ? (
            <Button
              type="button"
              color="error"
              onClick={onRemove}
              sx={{ mr: 'auto' }}
            >
              Remove link
            </Button>
          ) : null}
          <Button type="button" color="inherit" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            {canRemove ? 'Update link' : 'Add link'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}

export function EditorImageDialog({
  open,
  onClose,
  onSave,
}: EditorImageDialogProps) {
  const [src, setSrc] = useState('')
  const [alt, setAlt] = useState('')
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    event.stopPropagation()
    const nextSrc = src.trim()
    const validationError = validateUrl(nextSrc, imageProtocols)
    if (validationError) {
      setError(validationError)
      return
    }
    const nextTitle = title.trim()
    onSave({
      src: nextSrc,
      alt: alt.trim(),
      ...(nextTitle ? { title: nextTitle } : {}),
    })
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="editor-image-dialog-title"
      slotProps={{ paper: { sx: { overscrollBehavior: 'contain' } } }}
    >
      <Box component="form" onSubmit={submit} autoComplete="off">
        <DialogTitle id="editor-image-dialog-title">
          Insert image
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Image URL"
              name="imageUrl"
              type="url"
              value={src}
              onChange={(event) => {
                setSrc(event.target.value)
                setError(null)
              }}
              error={Boolean(error)}
              helperText={
                error ?? 'Use a direct http:// or https:// image URL.'
              }
              slotProps={{
                htmlInput: {
                  spellCheck: false,
                  inputMode: 'url',
                },
              }}
            />
            <TextField
              label="Alternative text"
              name="imageAlt"
              value={alt}
              onChange={(event) => setAlt(event.target.value)}
              helperText="Describe the image, or leave blank when it is decorative."
              slotProps={{ htmlInput: { maxLength: 500 } }}
            />
            <TextField
              label="Image title"
              name="imageTitle"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              helperText="Optional text shown as the image title."
              slotProps={{ htmlInput: { maxLength: 500 } }}
            />
            <Typography variant="caption" color="text.secondary">
              Images are referenced by URL; this editor does not upload files.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button type="button" color="inherit" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            Insert image
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
