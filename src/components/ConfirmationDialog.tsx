import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'

interface ConfirmationDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  isPending?: boolean
  errorMessage?: string | null
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  isPending = false,
  errorMessage,
  onCancel,
  onConfirm,
}: ConfirmationDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={isPending ? undefined : onCancel}
      aria-labelledby="confirmation-dialog-title"
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle id="confirmation-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{description}</DialogContentText>
        {errorMessage ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {errorMessage}
          </Alert>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onCancel} color="inherit" disabled={isPending}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={isPending}
        >
          {isPending ? 'Saving…' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
