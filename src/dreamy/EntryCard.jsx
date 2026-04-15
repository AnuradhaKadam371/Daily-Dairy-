import { useState } from 'react'
import { motion } from 'framer-motion'
import { formatDateTime, getMoodMeta, icons, stripHtml } from './data.js'

const MotionArticle = motion.article

function EntryCard({ entry, onFavorite, onPin, onEdit, onDelete, onUnlock, unlocked }) {
  const [passwordInput, setPasswordInput] = useState('')
  const mood = getMoodMeta(entry.mood)

  return (
    <MotionArticle
      className="entry-card"
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
    >
      <div className="entry-head">
        <div>
          <p className="entry-meta">
            {mood.emoji} {mood.label} · {formatDateTime(entry.createdAt)}
          </p>
          <h4>{entry.title}</h4>
        </div>
        <div className="entry-badges">
          {entry.favorite ? (
            <motion.span
              key="heart"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 12 }}
            >
              {icons.heart}
            </motion.span>
          ) : null}
          {entry.pinned ? (
            <motion.span
              key="pin"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 12 }}
            >
              {icons.pin}
            </motion.span>
          ) : null}
          {entry.locked ? (
            <motion.span
              key="lock"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 12 }}
            >
              {icons.lock}
            </motion.span>
          ) : null}
        </div>
      </div>

      {entry.locked && !unlocked ? (
        <div className="lock-box">
          <p>{icons.lock} This memory is private. Enter the password to reveal it.</p>
          <div className="lock-controls">
            <input
              type="password"
              value={passwordInput}
              onChange={(event) => setPasswordInput(event.target.value)}
              placeholder="Enter password..."
              onKeyDown={(event) => {
                if (event.key === 'Enter') onUnlock(entry, passwordInput)
              }}
            />
            <button
              type="button"
              className="primary-button"
              onClick={() => onUnlock(entry, passwordInput)}
            >
              Unlock
            </button>
          </div>
        </div>
      ) : (
        <>
          <div
            className="entry-html"
            dangerouslySetInnerHTML={{
              __html:
                stripHtml(entry.content).length > 200
                  ? entry.content.slice(0, 200) + '...'
                  : entry.content,
            }}
          />
          {entry.images.length > 0 ? (
            <div className="image-grid">
              {entry.images.slice(0, 4).map((image) => (
                <img key={image.id} src={image.src} alt={image.name} className="entry-image" />
              ))}
            </div>
          ) : null}
        </>
      )}

      <div className="entry-actions">
        <motion.button
          type="button"
          className={`chip-button ${entry.favorite ? 'chip-active' : ''}`}
          onClick={() => onFavorite(entry.id)}
          whileTap={{ scale: 0.92 }}
        >
          {entry.favorite ? `${icons.heart} Loved` : '♡ Favorite'}
        </motion.button>
        <motion.button
          type="button"
          className={`chip-button ${entry.pinned ? 'chip-active' : ''}`}
          onClick={() => onPin(entry.id)}
          whileTap={{ scale: 0.92 }}
        >
          {entry.pinned ? `${icons.pin} Pinned` : '📍 Pin'}
        </motion.button>
        <motion.button
          type="button"
          className="chip-button"
          onClick={() => onEdit(entry)}
          whileTap={{ scale: 0.92 }}
        >
          ✏️ Edit
        </motion.button>
        <motion.button
          type="button"
          className="chip-button"
          onClick={() => onDelete(entry.id)}
          whileTap={{ scale: 0.92 }}
        >
          🗑️ Delete
        </motion.button>
      </div>
    </MotionArticle>
  )
}

export default EntryCard
