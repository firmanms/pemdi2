import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { List, ListOrdered, Bold, Italic } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        strike: false,
        code: false
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose prose-sm prose-slate focus:outline-none min-h-[100px] w-full max-w-none p-3',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Update editor content when value changes externally (e.g., when switching items)
  React.useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  if (!editor) {
    return null
  }

  return (
    <div className="border border-input rounded-md bg-white overflow-hidden focus-within:ring-1 focus-within:ring-ring focus-within:border-input shadow-sm">
      <div className="flex items-center gap-1 bg-slate-50 border-b border-input p-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "p-1.5 rounded hover:bg-slate-200 transition-colors text-slate-600",
            editor.isActive('bold') && "bg-slate-200 text-slate-900"
          )}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            "p-1.5 rounded hover:bg-slate-200 transition-colors text-slate-600",
            editor.isActive('italic') && "bg-slate-200 text-slate-900"
          )}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        
        <div className="w-[1px] h-4 bg-slate-300 mx-1" />
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            "p-1.5 rounded hover:bg-slate-200 transition-colors text-slate-600",
            editor.isActive('bulletList') && "bg-slate-200 text-slate-900"
          )}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            "p-1.5 rounded hover:bg-slate-200 transition-colors text-slate-600",
            editor.isActive('orderedList') && "bg-slate-200 text-slate-900"
          )}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
      </div>
      <EditorContent editor={editor} />
      <style dangerouslySetInnerHTML={{ __html: `
        .ProseMirror p.is-editor-empty:first-child::before {
          content: '${placeholder || 'Ketik sesuatu...'}';
          float: left;
          color: #94a3b8;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-top: 0.25rem;
          margin-bottom: 0.25rem;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-top: 0.25rem;
          margin-bottom: 0.25rem;
        }
        .ProseMirror p {
          margin-top: 0.25rem;
          margin-bottom: 0.25rem;
        }
      `}} />
    </div>
  )
}
