import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import StarterKit from '@tiptap/starter-kit'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import FormHelperText from '@mui/material/FormHelperText'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  EditorImageDialog,
  EditorLinkDialog,
} from '@/components/Article/ArticleEditorDialogs'

interface ArticleRichTextEditorProps {
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  disabled?: boolean
  error?: boolean
  helperText?: string
}

interface ToolbarProps {
  editor: NonNullable<ReturnType<typeof useEditor>>
  disabled: boolean
}

interface EditorToolButtonProps {
  label: string
  children: ReactNode
  disabled?: boolean
  active?: boolean
  shortcut?: string
  onClick: () => void
}

const whitespacePattern = /\s+/u
const countFormatter = new Intl.NumberFormat()
const blockStyles = [
  { value: 'normal', label: 'Normal text' },
  { value: 'heading-1', label: 'Heading 1' },
  { value: 'heading-2', label: 'Heading 2' },
  { value: 'heading-3', label: 'Heading 3' },
  { value: 'heading-4', label: 'Heading 4' },
  { value: 'heading-5', label: 'Heading 5' },
  { value: 'heading-6', label: 'Heading 6' },
] as const

function EditorToolButton({
  label,
  children,
  disabled = false,
  active,
  shortcut,
  onClick,
}: EditorToolButtonProps) {
  const title = shortcut ? `${label} (${shortcut})` : label

  return (
    <Tooltip title={title} arrow>
      <span>
        <IconButton
          type="button"
          size="small"
          aria-label={label}
          aria-pressed={active}
          disabled={disabled}
          onClick={onClick}
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.25,
            color: active ? 'primary.dark' : 'text.secondary',
            bgcolor: active ? 'primary.light' : 'transparent',
            '&:hover': {
              color: 'text.primary',
              bgcolor: active ? 'primary.light' : 'action.hover',
            },
          }}
        >
          {children}
        </IconButton>
      </span>
    </Tooltip>
  )
}

function ToolbarSeparator() {
  return (
    <Divider
      flexItem
      orientation="vertical"
      sx={{ mx: 0.5, my: 0.5 }}
    />
  )
}

function AlignmentGlyph({
  alignment,
}: {
  alignment: 'left' | 'center' | 'right' | 'justify'
}) {
  return (
    <Box
      aria-hidden="true"
      sx={{
        display: 'grid',
        width: 18,
        gap: '2px',
        justifyItems:
          alignment === 'justify'
            ? 'stretch'
            : alignment === 'center'
              ? 'center'
              : alignment === 'right'
                ? 'end'
                : 'start',
      }}
    >
      {[18, 13, 18].map((width, index) => (
        <Box
          key={`${alignment}-${index}`}
          sx={{
            width: alignment === 'justify' ? '100%' : width,
            height: 2,
            borderRadius: 1,
            bgcolor: 'currentColor',
          }}
        />
      ))}
    </Box>
  )
}

function EditorToolbar({ editor, disabled }: ToolbarProps) {
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
  const [initialLinkUrl, setInitialLinkUrl] = useState('')
  const state = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      blockStyle: currentEditor.isActive('heading', { level: 1 })
        ? 'heading-1'
        : currentEditor.isActive('heading', { level: 2 })
          ? 'heading-2'
          : currentEditor.isActive('heading', { level: 3 })
            ? 'heading-3'
            : currentEditor.isActive('heading', { level: 4 })
              ? 'heading-4'
              : currentEditor.isActive('heading', { level: 5 })
                ? 'heading-5'
                : currentEditor.isActive('heading', { level: 6 })
                  ? 'heading-6'
                  : 'normal',
      isBold: currentEditor.isActive('bold'),
      isItalic: currentEditor.isActive('italic'),
      isUnderline: currentEditor.isActive('underline'),
      isStrike: currentEditor.isActive('strike'),
      isBulletList: currentEditor.isActive('bulletList'),
      isOrderedList: currentEditor.isActive('orderedList'),
      isBlockquote: currentEditor.isActive('blockquote'),
      isLink: currentEditor.isActive('link'),
      alignment: currentEditor.isActive({ textAlign: 'center' })
        ? 'center'
        : currentEditor.isActive({ textAlign: 'right' })
          ? 'right'
          : currentEditor.isActive({ textAlign: 'justify' })
            ? 'justify'
            : 'left',
      canUndo: currentEditor.can().undo(),
      canRedo: currentEditor.can().redo(),
    }),
  })

  const applyBlockStyle = (value: string) => {
    switch (value) {
      case 'heading-1':
        editor.chain().focus().setHeading({ level: 1 }).run()
        break
      case 'heading-2':
        editor.chain().focus().setHeading({ level: 2 }).run()
        break
      case 'heading-3':
        editor.chain().focus().setHeading({ level: 3 }).run()
        break
      case 'heading-4':
        editor.chain().focus().setHeading({ level: 4 }).run()
        break
      case 'heading-5':
        editor.chain().focus().setHeading({ level: 5 }).run()
        break
      case 'heading-6':
        editor.chain().focus().setHeading({ level: 6 }).run()
        break
      default:
        editor.chain().focus().setParagraph().run()
    }
  }

  const openLinkDialog = () => {
    const href = editor.getAttributes('link').href
    setInitialLinkUrl(typeof href === 'string' ? href : '')
    setIsLinkDialogOpen(true)
  }

  return (
    <Box
      role="toolbar"
      aria-label="Article formatting"
      sx={{
        px: { xs: 1, sm: 1.5 },
        py: 1,
        bgcolor: '#FBFCFB',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Stack
        direction="row"
        spacing={0.25}
        useFlexGap
        sx={{ flexWrap: 'wrap', alignItems: 'center' }}
      >
        <EditorToolButton
          label="Undo"
          shortcut="Ctrl+Z"
          disabled={disabled || !state?.canUndo}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Typography
            component="span"
            aria-hidden="true"
            sx={{ fontSize: 20, lineHeight: 1 }}
          >
            ↶
          </Typography>
        </EditorToolButton>
        <EditorToolButton
          label="Redo"
          shortcut="Ctrl+Shift+Z"
          disabled={disabled || !state?.canRedo}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Typography
            component="span"
            aria-hidden="true"
            sx={{ fontSize: 20, lineHeight: 1 }}
          >
            ↷
          </Typography>
        </EditorToolButton>

        <ToolbarSeparator />

        <Select
          value={state?.blockStyle ?? 'normal'}
          disabled={disabled}
          onChange={(event) =>
            applyBlockStyle(event.target.value)
          }
          inputProps={{ 'aria-label': 'Text style' }}
          size="small"
          sx={{
            width: { xs: 142, sm: 164 },
            height: 36,
            bgcolor: 'background.paper',
            borderRadius: 1.25,
            '& .MuiSelect-select': {
              py: 0.75,
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 14,
              fontWeight: 700,
            },
          }}
        >
          {blockStyles.map((style, index) => (
            <MenuItem
              key={style.value}
              value={style.value}
              sx={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize:
                  index === 0
                    ? 15
                    : Math.max(13, 23 - index * 1.5),
                fontWeight: index === 0 ? 400 : 700,
              }}
            >
              {style.label}
            </MenuItem>
          ))}
        </Select>

        <ToolbarSeparator />

        <EditorToolButton
          label="Bold"
          shortcut="Ctrl+B"
          active={state?.isBold ?? false}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Typography
            component="span"
            aria-hidden="true"
            sx={{ fontSize: 16, fontWeight: 900 }}
          >
            B
          </Typography>
        </EditorToolButton>
        <EditorToolButton
          label="Italic"
          shortcut="Ctrl+I"
          active={state?.isItalic ?? false}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Typography
            component="span"
            aria-hidden="true"
            sx={{ fontFamily: 'Georgia, serif', fontSize: 17, fontStyle: 'italic' }}
          >
            I
          </Typography>
        </EditorToolButton>
        <EditorToolButton
          label="Underline"
          shortcut="Ctrl+U"
          active={state?.isUnderline ?? false}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <Typography
            component="span"
            aria-hidden="true"
            sx={{ fontSize: 16, textDecoration: 'underline' }}
          >
            U
          </Typography>
        </EditorToolButton>
        <EditorToolButton
          label="Strikethrough"
          active={state?.isStrike ?? false}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Typography
            component="span"
            aria-hidden="true"
            sx={{ fontSize: 16, textDecoration: 'line-through' }}
          >
            S
          </Typography>
        </EditorToolButton>
        <EditorToolButton
          label="Clear formatting"
          disabled={disabled}
          onClick={() =>
            editor.chain().focus().unsetAllMarks().clearNodes().run()
          }
        >
          <Typography
            component="span"
            aria-hidden="true"
            sx={{ fontSize: 13, fontWeight: 800 }}
          >
            Tx
          </Typography>
        </EditorToolButton>

        <ToolbarSeparator />

        <EditorToolButton
          label="Bullet list"
          active={state?.isBulletList ?? false}
          disabled={disabled}
          onClick={() =>
            editor.chain().focus().toggleBulletList().run()
          }
        >
          <Typography
            component="span"
            aria-hidden="true"
            sx={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.08em' }}
          >
            •≡
          </Typography>
        </EditorToolButton>
        <EditorToolButton
          label="Numbered list"
          active={state?.isOrderedList ?? false}
          disabled={disabled}
          onClick={() =>
            editor.chain().focus().toggleOrderedList().run()
          }
        >
          <Typography
            component="span"
            aria-hidden="true"
            sx={{ fontSize: 13, fontWeight: 800 }}
          >
            1.≡
          </Typography>
        </EditorToolButton>
        <EditorToolButton
          label="Block quote"
          active={state?.isBlockquote ?? false}
          disabled={disabled}
          onClick={() =>
            editor.chain().focus().toggleBlockquote().run()
          }
        >
          <Typography
            component="span"
            aria-hidden="true"
            sx={{ fontFamily: 'Georgia, serif', fontSize: 22, lineHeight: 1 }}
          >
            “
          </Typography>
        </EditorToolButton>

        <ToolbarSeparator />

        {(['left', 'center', 'right', 'justify'] as const).map(
          (alignment) => (
            <EditorToolButton
              key={alignment}
              label={`Align ${alignment}`}
              active={state?.alignment === alignment}
              disabled={disabled}
              onClick={() =>
                editor.chain().focus().setTextAlign(alignment).run()
              }
            >
              <AlignmentGlyph alignment={alignment} />
            </EditorToolButton>
          ),
        )}

        <ToolbarSeparator />

        <EditorToolButton
          label="Horizontal rule"
          disabled={disabled}
          onClick={() =>
            editor.chain().focus().setHorizontalRule().run()
          }
        >
          <Typography
            component="span"
            aria-hidden="true"
            sx={{ fontSize: 18, fontWeight: 700 }}
          >
            —
          </Typography>
        </EditorToolButton>
        <EditorToolButton
          label={state?.isLink ? 'Edit link' : 'Add link'}
          active={state?.isLink ?? false}
          disabled={disabled}
          onClick={openLinkDialog}
        >
          <Typography
            component="span"
            aria-hidden="true"
            sx={{ fontSize: 17, fontWeight: 800 }}
          >
            ↗
          </Typography>
        </EditorToolButton>
        <EditorToolButton
          label="Insert image"
          disabled={disabled}
          onClick={() => setIsImageDialogOpen(true)}
        >
          <Typography
            component="span"
            aria-hidden="true"
            sx={{ fontSize: 17, fontWeight: 800 }}
          >
            ▧
          </Typography>
        </EditorToolButton>
      </Stack>
      {isLinkDialogOpen ? (
        <EditorLinkDialog
          open
          initialUrl={initialLinkUrl}
          canRemove={state?.isLink ?? false}
          onClose={() => setIsLinkDialogOpen(false)}
          onSave={(url) => {
            editor
              .chain()
              .focus()
              .extendMarkRange('link')
              .setLink({ href: url })
              .run()
            setIsLinkDialogOpen(false)
          }}
          onRemove={() => {
            editor.chain().focus().extendMarkRange('link').unsetLink().run()
            setIsLinkDialogOpen(false)
          }}
        />
      ) : null}
      {isImageDialogOpen ? (
        <EditorImageDialog
          open
          onClose={() => setIsImageDialogOpen(false)}
          onSave={(image) => {
            editor.chain().focus().setImage(image).run()
            setIsImageDialogOpen(false)
          }}
        />
      ) : null}
    </Box>
  )
}

function EditorPage({ editor }: Omit<ToolbarProps, 'disabled'>) {
  const isEmpty = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => currentEditor.isEmpty,
  })

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: 820,
        minHeight: { xs: 480, sm: 580 },
        mx: 'auto',
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        boxShadow: '0 18px 45px rgba(23, 55, 43, 0.09)',
      }}
    >
      {isEmpty ? (
        <Typography
          aria-hidden="true"
          sx={{
            position: 'absolute',
            top: { xs: 32, sm: 54 },
            left: { xs: 24, sm: 64 },
            color: 'text.disabled',
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: { xs: 17, sm: 18 },
            pointerEvents: 'none',
          }}
        >
          Start writing your article…
        </Typography>
      ) : null}
      <EditorContent editor={editor} />
    </Box>
  )
}

function EditorStatusBar({ editor }: Omit<ToolbarProps, 'disabled'>) {
  const statistics = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      const text = currentEditor.getText().trim()

      return {
        characters: text.length,
        words: text ? text.split(whitespacePattern).length : 0,
      }
    },
  })

  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{
        minHeight: 40,
        px: { xs: 1.5, sm: 2 },
        alignItems: 'center',
        color: 'text.secondary',
        bgcolor: '#FBFCFB',
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      <Typography variant="caption" sx={{ fontVariantNumeric: 'tabular-nums' }}>
        {countFormatter.format(statistics?.words ?? 0)} words
      </Typography>
      <Typography variant="caption" sx={{ fontVariantNumeric: 'tabular-nums' }}>
        {countFormatter.format(statistics?.characters ?? 0)} characters
      </Typography>
      <Box sx={{ flex: 1 }} />
      <Typography
        variant="caption"
        sx={{
          display: { xs: 'none', sm: 'block' },
          fontWeight: 700,
          letterSpacing: '0.04em',
        }}
      >
        HTML
      </Typography>
    </Stack>
  )
}

export function ArticleRichTextEditor({
  value,
  onChange,
  onBlur,
  disabled = false,
  error = false,
  helperText,
}: ArticleRichTextEditorProps) {
  const helperTextId = useId()
  const onChangeRef = useRef(onChange)
  const onBlurRef = useRef(onBlur)

  useEffect(() => {
    onChangeRef.current = onChange
    onBlurRef.current = onBlur
  }, [onBlur, onChange])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          HTMLAttributes: {
            rel: 'noopener noreferrer',
            target: '_blank',
          },
        },
        trailingNode: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Image.configure({
        allowBase64: false,
        HTMLAttributes: {
          loading: 'lazy',
        },
      }),
    ],
    content: value,
    editable: !disabled,
    editorProps: {
      attributes: {
        'aria-describedby': helperTextId,
        'aria-invalid': error ? 'true' : 'false',
        'aria-label': 'Article content',
        'aria-multiline': 'true',
        role: 'textbox',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChangeRef.current(
        currentEditor.isEmpty ? '' : currentEditor.getHTML(),
      )
    },
    onBlur: () => {
      onBlurRef.current()
    },
  })

  useEffect(() => {
    if (!editor) return

    editor.setEditable(!disabled, false)
    editor.setOptions({
      editorProps: {
        attributes: {
          'aria-describedby': helperTextId,
          'aria-invalid': error ? 'true' : 'false',
          'aria-label': 'Article content',
          'aria-multiline': 'true',
          role: 'textbox',
        },
      },
    })
  }, [disabled, editor, error, helperTextId])

  useEffect(() => {
    if (!editor) return

    const currentValue = editor.isEmpty ? '' : editor.getHTML()
    if (currentValue !== value) {
      editor.commands.setContent(value, { emitUpdate: false })
    }
  }, [editor, value])

  if (!editor) return null

  return (
    <Box>
      <Box
        sx={{
          overflow: 'hidden',
          border: 1,
          borderColor: error ? 'error.main' : 'divider',
          borderRadius: 2,
          bgcolor: 'background.paper',
          transition: (theme) =>
            theme.transitions.create(['border-color', 'box-shadow']),
          '&:focus-within': {
            borderColor: error ? 'error.main' : 'primary.main',
            boxShadow: (theme) =>
              `0 0 0 1px ${
                error ? theme.palette.error.main : theme.palette.primary.main
              }`,
          },
        }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            minHeight: 54,
            px: { xs: 1.5, sm: 2 },
            alignItems: 'center',
            bgcolor: 'background.paper',
          }}
        >
          <Box
            aria-hidden="true"
            sx={{
              display: 'grid',
              placeItems: 'center',
              width: 30,
              height: 36,
              border: 1,
              borderColor: 'divider',
              borderRadius: 0.75,
              color: 'primary.dark',
              bgcolor: 'primary.light',
              fontFamily: 'Georgia, serif',
              fontSize: 14,
              fontWeight: 700,
              '&::after': {
                content: '"Aa"',
              },
            }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{ fontSize: 14, fontWeight: 800, lineHeight: 1.2 }}
            >
              Article document
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ fontSize: 12, lineHeight: 1.35 }}
            >
              Rich text saved as HTML
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }} />
          <Typography
            variant="caption"
            sx={{
              px: 1,
              py: 0.35,
              borderRadius: 5,
              color: 'primary.dark',
              bgcolor: 'primary.light',
              fontWeight: 800,
              letterSpacing: '0.04em',
            }}
          >
            {disabled ? 'SAVING' : 'EDITING'}
          </Typography>
        </Stack>
        <EditorToolbar editor={editor} disabled={disabled} />
        <Box
          sx={{
            p: { xs: 1.5, sm: 3, md: 4 },
            bgcolor: '#EEF3F0',
            '& .tiptap': {
              minHeight: { xs: 478, sm: 578 },
              px: { xs: 3, sm: 8 },
              py: { xs: 4, sm: 6.75 },
              outline: 0,
              overflowWrap: 'anywhere',
              color: 'text.primary',
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: { xs: 17, sm: 18 },
              lineHeight: 1.78,
            },
            '& .tiptap > *:first-of-type': { mt: 0 },
            '& .tiptap > *:last-child': { mb: 0 },
            '& .tiptap h1': {
              mt: 3.5,
              mb: 1.5,
              fontSize: { xs: 31, sm: 38 },
              lineHeight: 1.12,
              textWrap: 'balance',
            },
            '& .tiptap h2': {
              mt: 3,
              mb: 1.25,
              fontSize: { xs: 25, sm: 30 },
              lineHeight: 1.2,
              textWrap: 'balance',
            },
            '& .tiptap h4': {
              mt: 2.25,
              mb: 0.9,
              fontSize: { xs: 19, sm: 21 },
              lineHeight: 1.35,
              textWrap: 'balance',
            },
            '& .tiptap h5': {
              mt: 2,
              mb: 0.8,
              fontSize: { xs: 17, sm: 19 },
              lineHeight: 1.4,
              textWrap: 'balance',
            },
            '& .tiptap h6': {
              mt: 1.75,
              mb: 0.75,
              fontSize: { xs: 16, sm: 17 },
              lineHeight: 1.4,
              letterSpacing: '0.02em',
              textWrap: 'balance',
            },
            '& .tiptap h3': {
              mt: 2.5,
              mb: 1,
              fontSize: { xs: 21, sm: 24 },
              lineHeight: 1.3,
              textWrap: 'balance',
            },
            '& .tiptap p': { my: 1.35 },
            '& .tiptap blockquote': {
              my: 2.5,
              mx: 0,
              pl: 2.5,
              borderLeft: 3,
              borderColor: 'primary.main',
              color: 'text.secondary',
              fontStyle: 'italic',
            },
            '& .tiptap ul, & .tiptap ol': {
              my: 1.5,
              pl: 4,
            },
            '& .tiptap hr': {
              my: 3.5,
              border: 0,
              borderTop: 1,
              borderColor: 'divider',
            },
            '& .tiptap a': {
              color: 'primary.main',
              textUnderlineOffset: '3px',
            },
            '& .tiptap img': {
              display: 'block',
              maxWidth: '100%',
              height: 'auto',
              my: 3,
              borderRadius: 1.5,
            },
            '& .tiptap img.ProseMirror-selectednode': {
              outline: '3px solid',
              outlineColor: 'primary.main',
              outlineOffset: 3,
            },
          }}
        >
          <EditorPage editor={editor} />
        </Box>
        <EditorStatusBar editor={editor} />
      </Box>
      {helperText ? (
        <FormHelperText
          id={helperTextId}
          error={error}
          sx={{ mx: 1.75 }}
        >
          {helperText}
        </FormHelperText>
      ) : null}
    </Box>
  )
}
