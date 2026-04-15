import { useEffect, useMemo, useState } from 'react'
import confetti from 'canvas-confetti'
import { AnimatePresence, motion } from 'framer-motion'
import './App.css'

const ENTRIES_STORAGE_KEY = 'dailydairy-entries'
const THEME_STORAGE_KEY = 'dailydairy-theme'

const moodOptions = [
  { emoji: '\u{1F60A}', label: 'Happy' },
  { emoji: '\u{1F622}', label: 'Sad' },
  { emoji: '\u{1F621}', label: 'Angry' },
  { emoji: '\u{1F60D}', label: 'Loved' },
]

const promptIdeas = [
  'How was your day?',
  'What made you smile today?',
  'What do you want to remember from this moment?',
  'What feeling needs a little more space tonight?',
]

const quoteOfTheDay =
  'Small daily reflections create the clearest map back to yourself.'

function createEmptyDraft() {
  return {
    title: '',
    content: '',
    mood: '\u{1F60A}',
  }
}

const MotionMain = motion.main
const MotionSection = motion.section
const MotionAside = motion.aside
const MotionArticle = motion.article
const MotionDiv = motion.div

function loadEntries() {
  const rawEntries = window.localStorage.getItem(ENTRIES_STORAGE_KEY)

  if (!rawEntries) {
    return []
  }

  try {
    return JSON.parse(rawEntries)
  } catch {
    window.localStorage.removeItem(ENTRIES_STORAGE_KEY)
    return []
  }
}

function loadTheme() {
  return window.localStorage.getItem(THEME_STORAGE_KEY) ?? 'light'
}

function formatFullDateTime(dateString) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(dateString))
}

function formatMonthYear(date) {
  return new Intl.DateTimeFormat('en-IN', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function getDateKey(dateString) {
  return new Date(dateString).toISOString().slice(0, 10)
}

function getCalendarDays(activeMonth) {
  const year = activeMonth.getFullYear()
  const month = activeMonth.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const days = []

  for (let index = 0; index < firstDay.getDay(); index += 1) {
    days.push(null)
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(new Date(year, month, day))
  }

  return days
}

function matchesSearch(entry, query) {
  const searchableText = `${entry.title} ${entry.content}`.toLowerCase()
  return searchableText.includes(query.toLowerCase())
}

function App() {
  const [entries, setEntries] = useState(loadEntries)
  const [theme, setTheme] = useState(loadTheme)
  const [draft, setDraft] = useState(createEmptyDraft)
  const [editingId, setEditingId] = useState(null)
  const [selectedId, setSelectedId] = useState(() => loadEntries()[0]?.id ?? null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })
  const [promptIndex, setPromptIndex] = useState(0)
  const [showWelcome, setShowWelcome] = useState(true)

  useEffect(() => {
    window.localStorage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(entries))
  }, [entries])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    const promptTimer = window.setInterval(() => {
      setPromptIndex((current) => (current + 1) % promptIdeas.length)
    }, 2800)

    return () => window.clearInterval(promptTimer)
  }, [])

  const totalWords = useMemo(
    () =>
      entries.reduce((count, entry) => {
        const words = entry.content.trim().split(/\s+/).filter(Boolean)
        return count + words.length
      }, 0),
    [entries],
  )

  const favoriteCount = useMemo(
    () => entries.filter((entry) => entry.isFavorite).length,
    [entries],
  )

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesKeyword = !searchTerm || matchesSearch(entry, searchTerm)
      const matchesDate = !selectedDate || getDateKey(entry.createdAt) === selectedDate
      const matchesFavorite = !showFavoritesOnly || entry.isFavorite

      return matchesKeyword && matchesDate && matchesFavorite
    })
  }, [entries, searchTerm, selectedDate, showFavoritesOnly])

  const selectedEntry =
    filteredEntries.find((entry) => entry.id === selectedId) ??
    entries.find((entry) => entry.id === selectedId) ??
    null

  const calendarDays = useMemo(() => getCalendarDays(calendarMonth), [calendarMonth])

  const entryDates = useMemo(() => {
    return new Set(entries.map((entry) => getDateKey(entry.createdAt)))
  }, [entries])

  const handleDraftChange = (field, value) => {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const resetDraft = () => {
    setDraft(createEmptyDraft())
    setEditingId(null)
  }

  const handleSave = () => {
    const cleanTitle = draft.title.trim()
    const cleanContent = draft.content.trim()

    if (!cleanTitle || !cleanContent) {
      return
    }

    const timeStamp = new Date().toISOString()

    if (editingId) {
      setEntries((current) =>
        current.map((entry) =>
          entry.id === editingId
            ? {
                ...entry,
                title: cleanTitle,
                content: cleanContent,
                mood: draft.mood,
                updatedAt: timeStamp,
              }
            : entry,
        ),
      )
      setSelectedId(editingId)
    } else {
      const entryDate = new Date(timeStamp)
      const newEntry = {
        id: crypto.randomUUID(),
        title: cleanTitle,
        content: cleanContent,
        mood: draft.mood,
        createdAt: timeStamp,
        isFavorite: false,
      }

      setEntries((current) => [newEntry, ...current])
      setSelectedId(newEntry.id)
      setSelectedDate(getDateKey(timeStamp))
      setCalendarMonth(new Date(entryDate.getFullYear(), entryDate.getMonth(), 1))
    }

    confetti({
      particleCount: 70,
      spread: 90,
      origin: { y: 0.65 },
      colors: ['#f7a8c1', '#ffd8e5', '#ffffff', '#f48fb1'],
    })

    resetDraft()
  }

  const handleEdit = (entry) => {
    setDraft({
      title: entry.title,
      content: entry.content,
      mood: entry.mood,
    })
    setEditingId(entry.id)
    setSelectedId(entry.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = (id) => {
    setEntries((current) => current.filter((entry) => entry.id !== id))

    if (selectedId === id) {
      const nextEntry =
        filteredEntries.find((entry) => entry.id !== id) ??
        entries.find((entry) => entry.id !== id)
      setSelectedId(nextEntry?.id ?? null)
    }

    if (editingId === id) {
      resetDraft()
    }
  }

  const toggleFavorite = (id) => {
    setEntries((current) =>
      current.map((entry) =>
        entry.id === id ? { ...entry, isFavorite: !entry.isFavorite } : entry,
      ),
    )
  }

  const changeMonth = (direction) => {
    setCalendarMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + direction, 1),
    )
  }

  return (
    <MotionMain
      className="app-shell"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <AnimatePresence>
        {showWelcome ? (
          <MotionSection
            className="welcome-card glass-card"
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
          >
            <div>
              <p className="section-tag">Welcome</p>
              <h1>DailyDairy</h1>
              <p className="welcome-copy">{quoteOfTheDay}</p>
            </div>
            <button
              className="primary-button"
              type="button"
              onClick={() => setShowWelcome(false)}
            >
              Start writing
            </button>
          </MotionSection>
        ) : null}
      </AnimatePresence>

      <MotionSection
        className="hero-panel glass-card"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.45 }}
      >
        <div className="hero-copy">
          <p className="eyebrow">Your private journal</p>
          <h2>Write softly. Remember beautifully.</h2>
          <p className="hero-text">
            A pastel diary space with search, favorites, calendar browsing, and
            gentle motion designed for your everyday reflections.
          </p>
        </div>

        <div className="hero-actions">
          <button
            className="theme-toggle"
            type="button"
            onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
          >
            {theme === 'light' ? 'Dark mode' : 'Light mode'}
          </button>
          <div className="hero-stats">
            <article>
              <strong>{entries.length}</strong>
              <span>entries</span>
            </article>
            <article>
              <strong>{favoriteCount}</strong>
              <span>favorites</span>
            </article>
            <article>
              <strong>{totalWords}</strong>
              <span>words</span>
            </article>
          </div>
        </div>
      </MotionSection>

      <MotionSection
        className="control-strip glass-card"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.45 }}
      >
        <label className="field compact-field">
          <span>Search</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by title or keyword"
          />
        </label>

        <label className="field compact-field">
          <span>Filter by date</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
        </label>

        <button
          className={`chip-button ${showFavoritesOnly ? 'chip-active' : ''}`}
          type="button"
          onClick={() => setShowFavoritesOnly((current) => !current)}
        >
          Favorites only
        </button>

        <button
          className="secondary-button"
          type="button"
          onClick={() => {
            setSearchTerm('')
            setSelectedDate('')
            setShowFavoritesOnly(false)
          }}
        >
          Clear filters
        </button>
      </MotionSection>

      <section className="workspace">
        <MotionSection
          className="editor-card glass-card"
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.16, duration: 0.45 }}
        >
          <div className="section-heading">
            <div>
              <p className="section-tag">Write</p>
              <h3>{editingId ? 'Edit your page' : "Today's diary entry"}</h3>
            </div>
            <button className="secondary-button" type="button" onClick={resetDraft}>
              {editingId ? 'Cancel edit' : 'Clear draft'}
            </button>
          </div>

          <label className="field">
            <span>Title</span>
            <input
              type="text"
              value={draft.title}
              onChange={(event) => handleDraftChange('title', event.target.value)}
              placeholder="Give this page a feeling"
            />
          </label>

          <div className="editor-meta">
            <div className="field">
              <span>Mood</span>
              <div className="mood-grid">
                {moodOptions.map((mood) => (
                  <button
                    key={mood.emoji}
                    className={`mood-button ${draft.mood === mood.emoji ? 'mood-active' : ''}`}
                    type="button"
                    onClick={() => handleDraftChange('mood', mood.emoji)}
                  >
                    <span>{mood.emoji}</span>
                    <small>{mood.label}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="hint-card">
              <span>Prompt</span>
              <AnimatePresence mode="wait">
                <motion.p
                  key={promptIdeas[promptIndex]}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.24 }}
                >
                  {promptIdeas[promptIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          <label className="field">
            <span>Your thoughts</span>
            <textarea
              rows="12"
              value={draft.content}
              onChange={(event) => handleDraftChange('content', event.target.value)}
              placeholder={promptIdeas[promptIndex]}
            />
          </label>

          <div className="editor-actions">
            <div className="timestamp-chip">
              {editingId ? 'Updating with current time' : 'Time added automatically on save'}
            </div>
            <button
              className="primary-button"
              type="button"
              onClick={handleSave}
              disabled={!draft.title.trim() || !draft.content.trim()}
            >
              {editingId ? 'Update entry' : 'Save entry'}
            </button>
          </div>
        </MotionSection>

        <div className="sidebar-stack">
          <MotionAside
            className="calendar-card glass-card"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.45 }}
          >
            <div className="calendar-head">
              <button type="button" onClick={() => changeMonth(-1)}>
                ←
              </button>
              <h3>{formatMonthYear(calendarMonth)}</h3>
              <button type="button" onClick={() => changeMonth(1)}>
                →
              </button>
            </div>
            <div className="calendar-weekdays">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
            <div className="calendar-grid">
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <span key={`blank-${index}`} className="calendar-empty" />
                }

                const dateKey = day.toISOString().slice(0, 10)
                const hasEntry = entryDates.has(dateKey)
                const isActive = selectedDate === dateKey

                return (
                  <button
                    key={dateKey}
                    className={`calendar-day ${hasEntry ? 'calendar-has-entry' : ''} ${isActive ? 'calendar-active' : ''}`}
                    type="button"
                    onClick={() =>
                      setSelectedDate((current) => (current === dateKey ? '' : dateKey))
                    }
                  >
                    {day.getDate()}
                  </button>
                )
              })}
            </div>
          </MotionAside>

          <MotionAside
            className="entries-card glass-card"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.24, duration: 0.45 }}
          >
            <div className="section-heading">
              <div>
                <p className="section-tag">Library</p>
                <h3>Saved pages</h3>
              </div>
              <span className="results-count">{filteredEntries.length} shown</span>
            </div>

            {filteredEntries.length === 0 ? (
              <div className="empty-state">
                <p>No matching entries yet.</p>
                <span>Try another search term, date, or save a new page.</span>
              </div>
            ) : (
              <div className="entry-list">
                <AnimatePresence initial={false}>
                  {filteredEntries.map((entry) => (
                    <MotionArticle
                      key={entry.id}
                      className={`entry-item ${selectedId === entry.id ? 'active' : ''}`}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <button
                        className="entry-preview"
                        type="button"
                        onClick={() => setSelectedId(entry.id)}
                      >
                        <div>
                          <h4>{entry.title}</h4>
                          <p>{formatFullDateTime(entry.createdAt)}</p>
                        </div>
                        <div className="entry-badges">
                          <span>{entry.mood}</span>
                          {entry.isFavorite ? <span>❤️</span> : null}
                        </div>
                      </button>

                      <div className="entry-controls">
                        <button type="button" onClick={() => toggleFavorite(entry.id)}>
                          {entry.isFavorite ? 'Unfavorite' : 'Favorite'}
                        </button>
                        <button type="button" onClick={() => handleEdit(entry)}>
                          Edit
                        </button>
                        <button type="button" onClick={() => handleDelete(entry.id)}>
                          Delete
                        </button>
                      </div>
                    </MotionArticle>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </MotionAside>
        </div>
      </section>

      <MotionSection
        className="preview-card glass-card"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.45 }}
      >
        <div className="section-heading">
          <div>
            <p className="section-tag">Preview</p>
            <h3>Reading view</h3>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {selectedEntry ? (
            <MotionArticle
              key={selectedEntry.id}
              className="selected-entry"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.28 }}
            >
              <div className="selected-entry-head">
                <div>
                  <h4>{selectedEntry.title}</h4>
                  <p>{formatFullDateTime(selectedEntry.updatedAt ?? selectedEntry.createdAt)}</p>
                </div>
                <div className="entry-badges">
                  <span>{selectedEntry.mood}</span>
                  {selectedEntry.isFavorite ? <span>❤️</span> : null}
                </div>
              </div>
              <p>{selectedEntry.content}</p>
            </MotionArticle>
          ) : (
            <MotionDiv
              key="empty-preview"
              className="empty-state preview-empty"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
            >
              <p>Select an entry to read it here.</p>
              <span>This space becomes your calm full-page reflection view.</span>
            </MotionDiv>
          )}
        </AnimatePresence>
      </MotionSection>
    </MotionMain>
  )
}

export default App
