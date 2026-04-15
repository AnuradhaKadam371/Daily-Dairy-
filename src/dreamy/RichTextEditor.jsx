import { useEffect, useRef, useState } from 'react'
import { icons, stripHtml } from './data.js'

const emojiList = ['😊', '😍', '😌', '🤩', '😢', '😤', '😴', '🥹', '✨', '🌸', '🌙', '💫', '🦋', '❤️', '☁️', '🎶', '🌈', '⭐', '🔥', '💎']

function RichTextEditor({ value, placeholder, onChange, onVoiceCapture }) {
  const editorRef = useRef(null)
  const [showEmojis, setShowEmojis] = useState(false)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  const applyCommand = (command, commandValue) => {
    editorRef.current?.focus()
    document.execCommand(command, false, commandValue)
    onChange(editorRef.current?.innerHTML ?? '')
  }

  const insertEmoji = (emoji) => {
    applyCommand('insertHTML', emoji)
    setShowEmojis(false)
  }

  return (
    <div className="rich-editor-shell">
      <div className="toolbar-row">
        <button type="button" onClick={() => applyCommand('bold')} title="Bold">
          <strong>B</strong>
        </button>
        <button type="button" onClick={() => applyCommand('italic')} title="Italic">
          <em>I</em>
        </button>
        <button type="button" onClick={() => applyCommand('underline')} title="Underline">
          <u>U</u>
        </button>
        <button type="button" onClick={() => applyCommand('strikeThrough')} title="Strikethrough">
          <s>S</s>
        </button>
        <button type="button" onClick={() => applyCommand('formatBlock', 'h2')} title="Heading">
          H2
        </button>
        <button type="button" onClick={() => applyCommand('formatBlock', 'blockquote')} title="Quote">
          ❝
        </button>
        <button type="button" onClick={() => applyCommand('insertUnorderedList')} title="Bullet list">
          • List
        </button>
        <button type="button" onClick={() => setShowEmojis((c) => !c)} title="Emoji">
          {showEmojis ? '✕' : '😊'} Emoji
        </button>
        <button type="button" onClick={onVoiceCapture} title="Voice-to-text">
          {icons.mic} Voice
        </button>
      </div>

      {showEmojis ? (
        <div className="toolbar-row" style={{ flexWrap: 'wrap', gap: '4px' }}>
          {emojiList.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => insertEmoji(emoji)}
              style={{ fontSize: '1.2rem', padding: '8px 10px' }}
            >
              {emoji}
            </button>
          ))}
        </div>
      ) : null}

      <div className="editable-wrap">
        {!stripHtml(value) ? <span className="editor-placeholder">{placeholder}</span> : null}
        <div
          ref={editorRef}
          className="editable-surface"
          contentEditable
          suppressContentEditableWarning
          onInput={(event) => onChange(event.currentTarget.innerHTML)}
        />
      </div>
    </div>
  )
}

export default RichTextEditor
