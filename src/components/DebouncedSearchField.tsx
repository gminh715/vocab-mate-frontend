import TextField from '@mui/material/TextField'
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'

interface DebouncedSearchFieldProps {
  initialValue: string
  label: string
  placeholder: string
  onCommit: (value: string) => void
  delay?: number
  maxLength?: number
}

export function DebouncedSearchField({
  initialValue,
  label,
  placeholder,
  onCommit,
  delay = 400,
  maxLength = 320,
}: DebouncedSearchFieldProps) {
  const [value, setValue] = useState(initialValue)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    [],
  )

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value
    setValue(nextValue)

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      onCommit(nextValue.trim())
    }, delay)
  }

  return (
    <TextField
      label={label}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      slotProps={{ htmlInput: { maxLength } }}
      sx={{ minWidth: { sm: 280 }, flex: { sm: 1 } }}
    />
  )
}
