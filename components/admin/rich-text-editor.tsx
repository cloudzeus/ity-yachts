"use client"

import { useEffect } from "react"
import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import {
  Bold, Italic, Heading2, Heading3, List, ListOrdered,
  Quote, Link2, Link2Off, ImageIcon, Undo2, Redo2, Minus,
} from "lucide-react"

/**
 * The article body editor.
 *
 * Writing an article meant typing raw HTML into a textarea — every heading and
 * every paragraph tag by hand. This produces the same HTML the site already
 * renders (h2, h3, p, ul/ol, blockquote, a, img) and nothing it does not.
 *
 * `compact` drops headings, lists and images: a listing-card summary is one or
 * two sentences, and offering to put an <h2> in one only invites it.
 */
export function RichTextEditor({
  value,
  onChange,
  compact = false,
  minHeight = 320,
  lang,
  placeholder,
}: {
  value: string
  onChange: (html: string) => void
  compact?: boolean
  minHeight?: number
  lang?: string
  placeholder?: string
}) {
  const editor = useEditor({
    // Next renders this on the server first; TipTap must not run there.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: compact ? false : { levels: [2, 3] },
        // The body is a fragment of a page, never a document with its own H1.
        bulletList: compact ? false : undefined,
        orderedList: compact ? false : undefined,
        blockquote: compact ? false : undefined,
        codeBlock: false,
        horizontalRule: compact ? false : undefined,
      }),
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener" } }),
      ...(compact ? [] : [Image.configure({ HTMLAttributes: { loading: "lazy" } })]),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "iyc-prose focus:outline-none",
        style: `min-height:${minHeight}px`,
        ...(lang ? { lang } : {}),
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      // TipTap represents empty as "<p></p>"; the field should read as empty.
      onChange(html === "<p></p>" ? "" : html)
    },
  })

  /* Pull in a value that changed elsewhere — the AI writer filling the field,
     or switching between articles. Guarded against the editor's own output, or
     every keystroke would reset the caret to the start. */
  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    const incoming = value || ""
    if (current === incoming || (current === "<p></p>" && !incoming)) return
    editor.commands.setContent(incoming, { emitUpdate: false })
  }, [value, editor])

  if (!editor) {
    return (
      <div
        className="rounded-md border"
        style={{ borderColor: "var(--outline-variant)", background: "var(--surface-container-lowest)", minHeight: minHeight + 38 }}
      />
    )
  }

  return (
    <div
      className="overflow-hidden rounded-md border"
      style={{ borderColor: "var(--outline-variant)", background: "var(--surface-container-lowest)" }}
    >
      <Toolbar editor={editor} compact={compact} />
      {/* The placeholder is laid over the first line, not pushed below it —
          a negative margin only approximated the line height. */}
      <div className="relative px-3 py-2" onClick={() => editor.chain().focus().run()}>
        {editor.isEmpty && placeholder && (
          <p
            className="pointer-events-none absolute left-3 top-2 text-sm"
            style={{ color: "var(--outline)" }}
          >
            {placeholder}
          </p>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

function Toolbar({ editor, compact }: { editor: Editor; compact: boolean }) {
  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined
    const url = window.prompt("Link address", previous ?? "https://")
    if (url === null) return
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run()
  }

  const addImage = () => {
    const url = window.prompt("Image address")
    if (url?.trim()) editor.chain().focus().setImage({ src: url.trim() }).run()
  }

  return (
    <div
      className="flex flex-wrap items-center gap-0.5 px-2 py-1.5"
      style={{ borderBottom: "1px solid var(--outline-variant)", background: "var(--surface-container-low)" }}
    >
      <Btn on={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold  ⌘B">
        <Bold className="size-3.5" />
      </Btn>
      <Btn on={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic  ⌘I">
        <Italic className="size-3.5" />
      </Btn>

      {!compact && (
        <>
          <Sep />
          <Btn on={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading">
            <Heading2 className="size-3.5" />
          </Btn>
          <Btn on={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Sub-heading">
            <Heading3 className="size-3.5" />
          </Btn>
          <Sep />
          <Btn on={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bulleted list">
            <List className="size-3.5" />
          </Btn>
          <Btn on={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list">
            <ListOrdered className="size-3.5" />
          </Btn>
          <Btn on={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote">
            <Quote className="size-3.5" />
          </Btn>
          <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
            <Minus className="size-3.5" />
          </Btn>
        </>
      )}

      <Sep />
      <Btn on={editor.isActive("link")} onClick={setLink} title="Link">
        <Link2 className="size-3.5" />
      </Btn>
      {editor.isActive("link") && (
        <Btn onClick={() => editor.chain().focus().unsetLink().run()} title="Remove link">
          <Link2Off className="size-3.5" />
        </Btn>
      )}
      {!compact && (
        <Btn onClick={addImage} title="Image">
          <ImageIcon className="size-3.5" />
        </Btn>
      )}

      <Sep />
      <Btn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo  ⌘Z">
        <Undo2 className="size-3.5" />
      </Btn>
      <Btn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
        <Redo2 className="size-3.5" />
      </Btn>

      <span className="ml-auto text-[10px] tabular-nums" style={{ color: "var(--on-surface-variant)", opacity: 0.7 }}>
        {editor.storage.characterCount?.words?.() ?? editor.getText().trim().split(/\s+/).filter(Boolean).length} words
      </span>
    </div>
  )
}

function Btn({
  children, onClick, on, disabled, title,
}: {
  children: React.ReactNode
  onClick: () => void
  on?: boolean
  disabled?: boolean
  title: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={on}
      className="grid size-7 place-items-center rounded transition disabled:opacity-25"
      style={{
        background: on ? "var(--primary)" : "transparent",
        color: on ? "var(--on-primary)" : "var(--on-surface-variant)",
      }}
    >
      {children}
    </button>
  )
}

const Sep = () => (
  <span className="mx-1 h-4 w-px" style={{ background: "var(--outline-variant)" }} />
)
