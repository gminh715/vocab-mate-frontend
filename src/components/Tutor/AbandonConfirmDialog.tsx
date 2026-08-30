import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import { useTranslation } from 'react-i18next'

interface AbandonConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  isSubmitting?: boolean
}

export function AbandonConfirmDialog({
  open,
  onClose,
  onConfirm,
  isSubmitting = false,
}: AbandonConfirmDialogProps) {
  const { t } = useTranslation('tutor')

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      aria-labelledby="abandon-dialog-title"
      aria-describedby="abandon-dialog-description"
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle id="abandon-dialog-title" sx={{ fontWeight: 700 }}>
        {t('abandonDialog.title')}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="abandon-dialog-description" color="text.secondary">
          {t('abandonDialog.message')}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button
          onClick={onClose}
          disabled={isSubmitting}
          variant="outlined"
          color="inherit"
        >
          {t('abandonDialog.cancel')}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isSubmitting}
          color="error"
          variant="contained"
          autoFocus
        >
          {t('abandonDialog.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
