import { useEffect, useMemo, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { AnimatePresence, motion } from 'framer-motion'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { toast } from 'react-hot-toast'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import EntryCard from './EntryCard.jsx'
import RichTextEditor from './RichTextEditor.jsx'
import {
  computeStreak,
  createDraft,
  dateKey,
  formatDateOnly,
  formatDateTime,
  getCalendarDays,
  getGreeting,
  getInitialState,
  getMoodMeta,
  getRandomQuote,
  icons,
  moodOptions,
  navItems,
  promptIdeas,
  storageKey,
  stripHtml,
  themeOptions,
  uid,
} from './data.js'

/* ── Motion shorthands ── */
const MotionMain = motion.main
const MotionSection = motion.section
const MotionArticle = motion.article

/* ── Page transition variants ── */
const pageVariants = {
  initial: { opacity: 0, y: 18, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -14, scale: 0.99 },
}

const pageTransition = { duration: 0.35, ease: [0.4, 0, 0.2, 1] }

/* ════════════════════════════════════════════════════════════════════
   AppShell — Root layout with sidebar + routed pages
   ════════════════════════════════════════════════════════════════════ */
function AppShell() {
  const [initialState] = useState(() => getInitialState())
  const [entries, setEntries] = useState(initialState.entries)
  const [theme, setTheme] = useState(initialState.theme)
  const [reminderEnabled, setReminderEnabled] = useState(initialState.reminderEnabled)
  const [ambientEnabled, setAmbientEnabled] = useState(initialState.ambientEnabled)
  const [premium, setPremium] = useState(initialState.premium)
  const [draft, setDraft] = useState(createDraft)
  const [editingId, setEditingId] = useState(null)
  const [filters, setFilters] = useState({ query: '', date: '', mood: 'all', favoritesOnly: false })
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })
  const [promptIndex, setPromptIndex] = useState(0)
  const [unlockedIds, setUnlockedIds] = useState([])
  const [memoryIndex, setMemoryIndex] = useState(0)
  const audioRef = useRef(null)
  const location = useLocation()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  /* ── Persist state ── */
  useEffect(() => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ entries, theme, reminderEnabled, ambientEnabled, premium }),
    )
  }, [entries, theme, reminderEnabled, ambientEnabled, premium])

  /* ── Apply theme to document ── */
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  /* ── Rotating prompts ── */
  useEffect(() => {
    const promptTimer = window.setInterval(() => {
      setPromptIndex((current) => (current + 1) % promptIdeas.length)
    }, 3000)
    return () => window.clearInterval(promptTimer)
  }, [])

  /* ── Daily reminder notification ── */
  useEffect(() => {
    if (!reminderEnabled || !('Notification' in window) || Notification.permission !== 'granted') {
      return undefined
    }

    const now = new Date()
    const nextReminder = new Date(now)
    nextReminder.setHours(20, 0, 0, 0)
    if (nextReminder <= now) {
      nextReminder.setDate(nextReminder.getDate() + 1)
    }

    const timeout = window.setTimeout(() => {
      new Notification('Dreamy Diary ✨', {
        body: 'A gentle reminder to capture today before it fades away.',
      })
    }, nextReminder.getTime() - now.getTime())

    return () => window.clearTimeout(timeout)
  }, [reminderEnabled])

  /* ── Ambient audio (soft synth) ── */
  useEffect(() => {
    if (!ambientEnabled) {
      if (audioRef.current?.context) {
        audioRef.current.context.close()
        audioRef.current = null
      }
      return undefined
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) {
      toast.error('Ambient audio is not supported here.')
      return undefined
    }

    const context = new AudioContextClass()
    const masterGain = context.createGain()
    masterGain.gain.value = 0.02
    masterGain.connect(context.destination)

    const oscillators = [196, 246.94, 293.66].map((frequency) => {
      const oscillator = context.createOscillator()
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      oscillator.connect(masterGain)
      oscillator.start()
      return oscillator
    })

    audioRef.current = { context, oscillators }

    return () => {
      oscillators.forEach((oscillator) => oscillator.stop())
      context.close()
      audioRef.current = null
    }
  }, [ambientEnabled])

  /* ── Computed values ── */
  const totalWords = useMemo(
    () =>
      entries.reduce((count, entry) => {
        return count + stripHtml(entry.content).split(/\s+/).filter(Boolean).length
      }, 0),
    [entries],
  )

  const streak = useMemo(() => computeStreak(entries), [entries])
  const favoriteEntries = useMemo(() => entries.filter((e) => e.favorite || e.pinned), [entries])
  const pinnedEntries = useMemo(() => entries.filter((e) => e.pinned), [entries])

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const queryMatch =
        !filters.query ||
        `${entry.title} ${stripHtml(entry.content)}`
          .toLowerCase()
          .includes(filters.query.toLowerCase())
      const dateMatch = !filters.date || dateKey(entry.createdAt) === filters.date
      const moodMatch = filters.mood === 'all' || entry.mood === filters.mood
      const favoriteMatch = !filters.favoritesOnly || entry.favorite
      return queryMatch && dateMatch && moodMatch && favoriteMatch
    })
  }, [entries, filters])

  const moodChartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date()
      day.setDate(day.getDate() - (6 - index))
      const key = dateKey(day)
      const dayEntries = entries.filter((entry) => dateKey(entry.createdAt) === key)
      const average =
        dayEntries.length === 0
          ? 0
          : dayEntries.reduce((sum, entry) => sum + getMoodMeta(entry.mood).score, 0) /
            dayEntries.length
      return { day: key.slice(5), moodScore: Number(average.toFixed(1)) }
    })
  }, [entries])

  const moodDistribution = useMemo(
    () =>
      moodOptions
        .map((mood) => ({
          mood: mood.emoji + ' ' + mood.label,
          total: entries.filter((entry) => entry.mood === mood.value).length,
        }))
        .filter((d) => d.total > 0),
    [entries],
  )

  const memoryMoments = useMemo(() => {
    const today = new Date()
    return entries.filter((entry) => {
      const entryDate = new Date(entry.createdAt)
      return (
        entryDate.getDate() === today.getDate() &&
        entryDate.getMonth() === today.getMonth() &&
        entryDate.getFullYear() !== today.getFullYear()
      )
    })
  }, [entries])

  const currentMemory =
    memoryMoments.length > 0 ? memoryMoments[memoryIndex % memoryMoments.length] : null

  /* ── Actions ── */
  const saveDraft = () => {
    if (!draft.title.trim() || !stripHtml(draft.content)) {
      toast.error('Add a title and some writing first.')
      return
    }

    if (!premium && entries.length >= 12 && !editingId) {
      toast.error('Free plan supports up to 12 entries. Upgrade to Premium! 💎')
      return
    }

    const timeStamp = new Date().toISOString()

    if (editingId) {
      setEntries((current) =>
        current.map((entry) =>
          entry.id === editingId ? { ...entry, ...draft, updatedAt: timeStamp } : entry,
        ),
      )
      toast.success('Entry updated beautifully ✨')
    } else {
      setEntries((current) => [
        { id: uid(), ...draft, createdAt: timeStamp, updatedAt: timeStamp },
        ...current,
      ])
      toast.success('Dreamy entry saved! 🌸')
    }

    confetti({
      particleCount: 100,
      spread: 90,
      origin: { y: 0.65 },
      colors: ['#f8bdd0', '#d4c1ff', '#bfe7ff', '#c8f7d6', '#fff5b8', '#ffd6b8'],
    })
    setDraft(createDraft())
    setEditingId(null)
  }

  const editEntry = (entry) => {
    setDraft({
      title: entry.title,
      content: entry.content,
      mood: entry.mood,
      images: entry.images,
      favorite: entry.favorite,
      pinned: entry.pinned,
      locked: entry.locked,
      password: entry.password,
    })
    setEditingId(entry.id)
    toast.success('Entry loaded into editor ✏️')
  }

  const deleteEntry = (entryId) => {
    setEntries((current) => current.filter((entry) => entry.id !== entryId))
    if (editingId === entryId) {
      setDraft(createDraft())
      setEditingId(null)
    }
    toast.success('Entry removed 🗑️')
  }

  const favoriteEntry = (entryId) => {
    setEntries((current) =>
      current.map((entry) =>
        entry.id === entryId ? { ...entry, favorite: !entry.favorite } : entry,
      ),
    )
  }

  const pinEntry = (entryId) => {
    setEntries((current) => {
      const index = current.findIndex((entry) => entry.id === entryId)
      if (index === -1) return current
      const updated = { ...current[index], pinned: !current[index].pinned }
      const next = [...current]
      next.splice(index, 1)
      return updated.pinned ? [updated, ...next] : [...next, updated]
    })
  }

  const unlockEntry = (entry, password) => {
    if (entry.password === password) {
      setUnlockedIds((current) => [...current, entry.id])
      toast.success('Private entry unlocked 🔓')
      return
    }
    toast.error('Password did not match.')
  }

  const attachImages = async (files) => {
    const previews = await Promise.all(
      [...files].map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve({ id: uid(), src: reader.result, name: file.name })
            reader.readAsDataURL(file)
          }),
      ),
    )

    setDraft((current) => ({ ...current, images: [...current.images, ...previews] }))
    toast.success('Image attached 🖼️')
  }

  const voiceCapture = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition) {
      toast.error('Voice journaling is not available in this browser.')
      return
    }
    const recognition = new Recognition()
    recognition.lang = 'en-US'
    toast.success('Listening... speak now 🎤')
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setDraft((current) => ({ ...current, content: `${current.content}<p>${transcript}</p>` }))
      toast.success('Voice note captured! ✨')
    }
    recognition.onerror = () => {
      toast.error('Voice capture failed. Try again.')
    }
    recognition.start()
  }

  const requestNotifications = async () => {
    if (!('Notification' in window)) {
      toast.error('Notifications are not supported here.')
      return
    }
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      setReminderEnabled(true)
      toast.success('Daily reminders enabled ⏰')
    }
  }

  const dragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setEntries((current) => {
      const oldIndex = current.findIndex((e) => e.id === active.id)
      const newIndex = current.findIndex((e) => e.id === over.id)
      return arrayMove(current, oldIndex, newIndex)
    })
    toast.success('Entry order updated ✨')
  }

  /* ════════════════════════════════
     RENDER
     ════════════════════════════════ */
  return (
    <MotionMain className="app-shell" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>

      {/* ── Sidebar ── */}
      <aside className="sidebar glass-panel">
        <div className="brand-block">
          <p className="brand-mark">{icons.sparkles} DREAMY DIARY</p>
          <h1>Your softly beautiful notebook</h1>
          <p className="muted-copy">{icons.flower} {entries.length} dreamy pages saved</p>
        </div>

        <nav className="nav-stack">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-pill ${isActive ? 'nav-pill-active' : ''}`}
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-card dreamy-card">
          <p className="eyebrow">{premium ? 'Premium Active' : 'Upgrade'}</p>
          <h2>{premium ? `${icons.crown} Premium Mode` : `${icons.gem} Go Premium`}</h2>
          <p>{premium ? 'Unlimited entries, cloud-ready, and dreamy analytics.' : 'Unlock unlimited entries, charts, custom themes & more.'}</p>
        </div>
      </aside>

      {/* ── Main Column ── */}
      <div className="main-column">

        {/* Top bar */}
        <MotionSection
          className="top-glow glass-panel"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div>
            <p className="eyebrow">{getGreeting()}</p>
            <h2>{icons.stars} {themeOptions.find((o) => o.value === theme)?.label}</h2>
          </div>
          <div className="stat-row">
            <span className="mini-stat">{icons.fire} {streak} day streak</span>
            <span className="mini-stat">{icons.book} {totalWords} words</span>
            <span className="mini-stat">{icons.heart} {favoriteEntries.length} faves</span>
            <button className="primary-button" type="button" onClick={() => setPremium((c) => !c)}>
              {premium ? `${icons.crown} Premium On` : `${icons.gem} Unlock Premium`}
            </button>
          </div>
        </MotionSection>

        {/* Routed pages */}
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <DashboardPage
                  entries={entries}
                  favoriteEntries={favoriteEntries}
                  pinnedEntries={pinnedEntries}
                  moodChartData={moodChartData}
                  moodDistribution={moodDistribution}
                  currentMemory={currentMemory}
                  onShuffle={() => setMemoryIndex((c) => c + 1)}
                  streak={streak}
                  totalWords={totalWords}
                />
              }
            />
            <Route
              path="/write"
              element={
                <WritePage
                  draft={draft}
                  editingId={editingId}
                  prompt={promptIdeas[promptIndex]}
                  setDraft={setDraft}
                  onAttachImages={attachImages}
                  onSave={saveDraft}
                  onReset={() => { setDraft(createDraft()); setEditingId(null) }}
                  onVoiceCapture={voiceCapture}
                />
              }
            />
            <Route
              path="/calendar"
              element={
                <CalendarPage
                  entries={filteredEntries}
                  filters={filters}
                  setFilters={setFilters}
                  calendarMonth={calendarMonth}
                  setCalendarMonth={setCalendarMonth}
                  onFavorite={favoriteEntry}
                  onPin={pinEntry}
                  onEdit={editEntry}
                  onDelete={deleteEntry}
                  onUnlock={unlockEntry}
                  unlockedIds={unlockedIds}
                />
              }
            />
            <Route
              path="/favorites"
              element={
                <FavoritesPage
                  sensors={sensors}
                  entries={favoriteEntries}
                  onDragEnd={dragEnd}
                  onFavorite={favoriteEntry}
                  onPin={pinEntry}
                  onEdit={editEntry}
                  onDelete={deleteEntry}
                  onUnlock={unlockEntry}
                  unlockedIds={unlockedIds}
                />
              }
            />
            <Route
              path="/settings"
              element={
                <SettingsPage
                  premium={premium}
                  theme={theme}
                  reminderEnabled={reminderEnabled}
                  ambientEnabled={ambientEnabled}
                  onThemeChange={setTheme}
                  onRequestNotifications={requestNotifications}
                  onReminderToggle={() => setReminderEnabled((c) => !c)}
                  onAmbientToggle={() => setAmbientEnabled((c) => !c)}
                />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </div>
    </MotionMain>
  )
}

/* ════════════════════════════════════════════════════════════════════
   Page Frame — shared animated wrapper for each route
   ════════════════════════════════════════════════════════════════════ */
function PageFrame({ title, icon, children }) {
  return (
    <motion.section
      className="page-frame"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
    >
      <div className="page-title-row">
        <div>
          <p className="eyebrow">Navigation</p>
          <h2>{icon} {title}</h2>
        </div>
      </div>
      {children}
    </motion.section>
  )
}

/* ════════════════════════════════════════════════════════════════════
   Dashboard / Home Page
   ════════════════════════════════════════════════════════════════════ */
function DashboardPage({ favoriteEntries, pinnedEntries, moodChartData, moodDistribution, currentMemory, onShuffle, streak, totalWords }) {
  const insight = [...moodDistribution].sort((a, b) => b.total - a.total)[0]
  const quote = useMemo(() => getRandomQuote(), [])

  return (
    <PageFrame title="Dashboard" icon={icons.sparkles}>
      <div className="dashboard-grid">

        {/* Hero */}
        <MotionSection
          className="hero-card gradient-card glass-panel floating-panel"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <p className="eyebrow">Welcome back</p>
          <h2>{icons.sparkles} Your premium diary sanctuary</h2>
          <p className="muted-copy">{quote}</p>
          <div className="hero-tags">
            <span>{icons.moon} Glassmorphism</span>
            <span>{icons.graph} Mood Insights</span>
            <span>{icons.heart} Premium</span>
            <span>{icons.butterfly} Dreamy Motion</span>
          </div>
        </MotionSection>

        {/* Stat cards */}
        <StatCard title="Streak" value={`${streak} days`} icon={icons.fire} />
        <StatCard title="Total Words" value={`${totalWords}`} icon={icons.book} />
        <StatCard title="Favorites" value={`${favoriteEntries.length}`} icon={icons.heart} />
        <StatCard title="Pinned" value={`${pinnedEntries.length}`} icon={icons.pin} />

        {/* Mood Flow Chart */}
        <ChartPanel title="Weekly Mood Flow" tag="Mood Tracker">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={moodChartData}>
              <defs>
                <linearGradient id="dreamArea" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#f08fb4" stopOpacity={0.7} />
                  <stop offset="50%" stopColor="#b894ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7ec8f0" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(150,120,180,0.15)" />
              <XAxis dataKey="day" stroke="currentColor" fontSize={12} />
              <YAxis domain={[0, 5]} stroke="currentColor" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.5)',
                  borderRadius: '14px',
                  fontSize: '0.85rem',
                }}
              />
              <Area type="monotone" dataKey="moodScore" stroke="#f08fb4" fill="url(#dreamArea)" strokeWidth={3} dot={{ r: 4, fill: '#f08fb4', strokeWidth: 2, stroke: '#fff' }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartPanel>

        {/* Emotion Insights Chart */}
        <ChartPanel
          title={insight?.total ? `${insight.mood} has been leading your week` : 'Write more to unlock emotion insights'}
          tag="Emotion Insights"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={moodDistribution}>
              <defs>
                <linearGradient id="barGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#b894ff" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#f08fb4" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(150,120,180,0.15)" />
              <XAxis dataKey="mood" stroke="currentColor" fontSize={11} />
              <YAxis stroke="currentColor" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.5)',
                  borderRadius: '14px',
                  fontSize: '0.85rem',
                }}
              />
              <Bar dataKey="total" fill="url(#barGradient)" radius={[14, 14, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        {/* Memory Card */}
        <MotionArticle className="memory-card dreamy-card glass-panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Random Memory</p>
              <h3>On This Day {icons.butterfly}</h3>
            </div>
            <button className="secondary-button" type="button" onClick={onShuffle}>
              {icons.sparkles} Shuffle
            </button>
          </div>
          {currentMemory ? (
            <>
              <h4>{currentMemory.title}</h4>
              <p className="muted-copy">{formatDateOnly(currentMemory.createdAt)}</p>
              <p>{stripHtml(currentMemory.content).slice(0, 200)}...</p>
            </>
          ) : (
            <p className="muted-copy">Keep journaling through the seasons and your memory vault will bloom here. {icons.flower}</p>
          )}
        </MotionArticle>

        {/* Favorites Highlights */}
        <MotionArticle className="library-card glass-panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Favorite Highlights</p>
              <h3>{icons.heart} Entries worth revisiting</h3>
            </div>
          </div>
          <div className="entry-mini-list">
            {favoriteEntries.slice(0, 5).map((entry) => (
              <div key={entry.id} className="mini-entry">
                <strong>{getMoodMeta(entry.mood).emoji} {entry.title}</strong>
                <span>{formatDateTime(entry.createdAt)}</span>
              </div>
            ))}
            {favoriteEntries.length === 0 ? (
              <p className="muted-copy">Heart a few entries and they will glow here. {icons.sparkles}</p>
            ) : null}
          </div>
        </MotionArticle>

      </div>
    </PageFrame>
  )
}

/* ════════════════════════════════════════════════════════════════════
   Write Page
   ════════════════════════════════════════════════════════════════════ */
function WritePage({ draft, editingId, prompt, setDraft, onAttachImages, onSave, onReset, onVoiceCapture }) {
  return (
    <PageFrame title={editingId ? 'Edit Entry' : 'Write'} icon={icons.book}>
      <div className="write-grid">

        {/* Editor */}
        <MotionSection className="editor-card glass-panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Compose</p>
              <h3>{editingId ? `${icons.sparkles} Edit your memory` : `${icons.flower} Write today into something beautiful`}</h3>
            </div>
            <button className="secondary-button" type="button" onClick={onReset}>
              {editingId ? '✕ Cancel' : '↺ Clear'}
            </button>
          </div>

          {/* Title field */}
          <label className="field">
            <span>Entry Title</span>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => setDraft((c) => ({ ...c, title: e.target.value }))}
              placeholder="Moonlight notes, peach skies, tiny miracles..."
            />
          </label>

          {/* Mood + Prompt row */}
          <div className="compose-grid">
            <div className="field">
              <span>Choose a Mood</span>
              <div className="mood-grid">
                {moodOptions.map((mood) => (
                  <motion.button
                    key={mood.value}
                    className={`mood-button ${draft.mood === mood.value ? 'mood-active' : ''}`}
                    type="button"
                    onClick={() => setDraft((c) => ({ ...c, mood: mood.value }))}
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.08 }}
                  >
                    <strong>{mood.emoji}</strong>
                    <small>{mood.label}</small>
                  </motion.button>
                ))}
              </div>
            </div>
            <div className="dreamy-card tiny-panel">
              <p className="eyebrow">Writing Prompt</p>
              <AnimatePresence mode="wait">
                <motion.div
                  key={prompt}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="prompt-card"
                >
                  {prompt}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Rich text editor */}
          <RichTextEditor
            value={draft.content}
            placeholder={prompt}
            onChange={(value) => setDraft((c) => ({ ...c, content: value }))}
            onVoiceCapture={onVoiceCapture}
          />

          {/* Attachment row */}
          <div className="attachment-row">
            <label className="upload-chip">
              {icons.image} Attach Images
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => { if (e.target.files?.length) onAttachImages(e.target.files) }}
              />
            </label>
            <motion.button
              className={`chip-button ${draft.favorite ? 'chip-active' : ''}`}
              type="button"
              onClick={() => setDraft((c) => ({ ...c, favorite: !c.favorite }))}
              whileTap={{ scale: 0.92 }}
            >
              {draft.favorite ? `${icons.heart} Loved` : '♡ Favorite'}
            </motion.button>
            <motion.button
              className={`chip-button ${draft.pinned ? 'chip-active' : ''}`}
              type="button"
              onClick={() => setDraft((c) => ({ ...c, pinned: !c.pinned }))}
              whileTap={{ scale: 0.92 }}
            >
              {draft.pinned ? `${icons.pin} Pinned` : '📍 Pin'}
            </motion.button>
            <motion.button
              className={`chip-button ${draft.locked ? 'chip-active' : ''}`}
              type="button"
              onClick={() => setDraft((c) => ({ ...c, locked: !c.locked, password: c.locked ? '' : c.password }))}
              whileTap={{ scale: 0.92 }}
            >
              {draft.locked ? `${icons.lock} Private` : '🔓 Lock'}
            </motion.button>
          </div>

          {/* Password field for locked entries */}
          {draft.locked ? (
            <label className="field">
              <span>{icons.lock} Password for Private Entry</span>
              <input
                type="password"
                value={draft.password}
                onChange={(e) => setDraft((c) => ({ ...c, password: e.target.value }))}
                placeholder="Create a simple password..."
              />
            </label>
          ) : null}

          {/* Image previews */}
          {draft.images.length > 0 ? (
            <div className="image-grid">
              {draft.images.map((image) => (
                <img key={image.id} src={image.src} alt={image.name} className="entry-image" />
              ))}
            </div>
          ) : null}

          {/* Save actions */}
          <div className="editor-actions">
            <span className="pill-note">{icons.clock} Timestamped automatically on save</span>
            <motion.button
              className="primary-button"
              type="button"
              onClick={onSave}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.03 }}
            >
              {editingId ? `${icons.sparkles} Update Entry` : `${icons.confetti} Save Dreamy Entry`}
            </motion.button>
          </div>
        </MotionSection>

        {/* Live Preview */}
        <MotionSection className="preview-card glass-panel">
          <p className="eyebrow">Live Preview</p>
          <h3>{getMoodMeta(draft.mood).emoji} {draft.title || 'Untitled memory...'}</h3>
          <div className="rich-preview" dangerouslySetInnerHTML={{ __html: draft.content }} />
          {draft.images.length > 0 ? (
            <div className="image-grid">
              {draft.images.map((image) => (
                <img key={image.id} src={image.src} alt={image.name} className="entry-image" />
              ))}
            </div>
          ) : (
            <p className="muted-copy">{icons.flower} Add images, formatting, and voice notes to create a premium keepsake.</p>
          )}
        </MotionSection>

      </div>
    </PageFrame>
  )
}

/* ════════════════════════════════════════════════════════════════════
   Calendar Page
   ════════════════════════════════════════════════════════════════════ */
function CalendarPage({ entries, filters, setFilters, calendarMonth, setCalendarMonth, onFavorite, onPin, onEdit, onDelete, onUnlock, unlockedIds }) {
  const calendarDays = useMemo(() => getCalendarDays(calendarMonth), [calendarMonth])
  const entryDays = useMemo(() => new Set(entries.map((e) => dateKey(e.createdAt))), [entries])

  return (
    <PageFrame title="Calendar" icon={icons.calendar}>
      <div className="calendar-layout">

        {/* Calendar + Filters */}
        <MotionSection className="calendar-card glass-panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Filters & Calendar</p>
              <h3>{icons.search} Search your memories</h3>
            </div>
          </div>

          {/* Filter grid */}
          <div className="filter-grid">
            <label className="field">
              <span>{icons.search} Keyword</span>
              <input
                type="text"
                value={filters.query}
                onChange={(e) => setFilters((c) => ({ ...c, query: e.target.value }))}
                placeholder="Find by title or memory..."
              />
            </label>
            <label className="field">
              <span>{icons.calendar} Date</span>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters((c) => ({ ...c, date: e.target.value }))}
              />
            </label>
            <label className="field">
              <span>Mood Filter</span>
              <select
                value={filters.mood}
                onChange={(e) => setFilters((c) => ({ ...c, mood: e.target.value }))}
              >
                <option value="all">All Moods</option>
                {moodOptions.map((mood) => (
                  <option key={mood.value} value={mood.value}>{mood.emoji} {mood.label}</option>
                ))}
              </select>
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'end', flexWrap: 'wrap' }}>
              <motion.button
                className={`chip-button ${filters.favoritesOnly ? 'chip-active' : ''}`}
                type="button"
                onClick={() => setFilters((c) => ({ ...c, favoritesOnly: !c.favoritesOnly }))}
                whileTap={{ scale: 0.92 }}
              >
                {icons.heart} Favorites
              </motion.button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => setFilters({ query: '', date: '', mood: 'all', favoritesOnly: false })}
              >
                ↺ Clear
              </button>
            </div>
          </div>

          {/* Calendar nav */}
          <div className="calendar-header">
            <button
              className="secondary-button"
              type="button"
              onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
            >
              ← Prev
            </button>
            <h3>{calendarMonth.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}</h3>
            <button
              className="secondary-button"
              type="button"
              onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
            >
              Next →
            </button>
          </div>

          {/* Weekdays */}
          <div className="calendar-weekdays">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="calendar-grid">
            {calendarDays.map((day, index) => {
              if (!day) return <div key={`empty-${index}`} className="calendar-empty" />
              const key = day.toISOString().slice(0, 10)
              const active = filters.date === key
              const hasEntry = entryDays.has(key)
              return (
                <motion.button
                  key={key}
                  className={`calendar-day ${hasEntry ? 'calendar-day-has-entry' : ''} ${active ? 'calendar-day-active' : ''}`}
                  type="button"
                  onClick={() => setFilters((c) => ({ ...c, date: c.date === key ? '' : key }))}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {day.getDate()}
                </motion.button>
              )
            })}
          </div>
        </MotionSection>

        {/* Entry list */}
        <MotionSection className="entries-column glass-panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Matching Entries</p>
              <h3>{entries.length} diary moments {icons.sparkles}</h3>
            </div>
          </div>
          <div className="entry-column-list">
            <AnimatePresence>
              {entries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onFavorite={onFavorite}
                  onPin={onPin}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onUnlock={onUnlock}
                  unlocked={unlockedIds.includes(entry.id)}
                />
              ))}
            </AnimatePresence>
            {entries.length === 0 ? (
              <div className="empty-card">No entries match your dreamy filters. Try adjusting your search. {icons.cloud}</div>
            ) : null}
          </div>
        </MotionSection>

      </div>
    </PageFrame>
  )
}

/* ════════════════════════════════════════════════════════════════════
   Favorites Page (with drag-and-drop reorder)
   ════════════════════════════════════════════════════════════════════ */
function FavoritesPage({ sensors, entries, onDragEnd, onFavorite, onPin, onEdit, onDelete, onUnlock, unlockedIds }) {
  return (
    <PageFrame title="Favorites" icon={icons.heart}>
      <div className="favorites-layout">

        <MotionSection className="favorites-hero glass-panel">
          <p className="eyebrow">Curated Collection</p>
          <h3>{icons.heart} Drag, reorder, and protect the entries that matter most</h3>
          <p className="muted-copy">Favorites and pinned memories live here — your most meaningful pages always stay close. {icons.butterfly}</p>
        </MotionSection>

        <MotionSection className="favorites-board glass-panel">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={entries.map((e) => e.id)} strategy={verticalListSortingStrategy}>
              <div className="entry-column-list">
                <AnimatePresence>
                  {entries.map((entry) => (
                    <SortableEntryCard
                      key={entry.id}
                      entry={entry}
                      onFavorite={onFavorite}
                      onPin={onPin}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onUnlock={onUnlock}
                      unlocked={unlockedIds.includes(entry.id)}
                    />
                  ))}
                </AnimatePresence>
                {entries.length === 0 ? (
                  <div className="empty-card">{icons.heart} Favorite or pin entries to build your dreamy collection.</div>
                ) : null}
              </div>
            </SortableContext>
          </DndContext>
        </MotionSection>

      </div>
    </PageFrame>
  )
}

/* ════════════════════════════════════════════════════════════════════
   Settings Page
   ════════════════════════════════════════════════════════════════════ */
function SettingsPage({ premium, theme, reminderEnabled, ambientEnabled, onThemeChange, onRequestNotifications, onReminderToggle, onAmbientToggle }) {
  return (
    <PageFrame title="Settings" icon="⚙️">
      <div className="settings-grid">

        {/* Themes */}
        <MotionSection className="settings-card glass-panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Themes</p>
              <h3>{icons.palette} Choose your dreamy palette</h3>
            </div>
          </div>
          <div className="theme-grid">
            {themeOptions.map((option) => (
              <motion.button
                key={option.value}
                className={`theme-swatch ${theme === option.value ? 'theme-swatch-active' : ''}`}
                type="button"
                onClick={() => onThemeChange(option.value)}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
              >
                {option.label}
              </motion.button>
            ))}
          </div>
        </MotionSection>

        {/* Dream Tools */}
        <MotionSection className="settings-card glass-panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Dream Tools</p>
              <h3>{icons.moon} Reminders, music & comfort</h3>
            </div>
          </div>
          <div className="settings-list">
            <button className="settings-row" type="button" onClick={onRequestNotifications}>
              <span>
                {icons.clock} Notifications
                <small>Allow daily browser reminders</small>
              </span>
              <strong>{reminderEnabled ? '✅ Enabled' : 'Ask permission'}</strong>
            </button>
            <button className="settings-row" type="button" onClick={onReminderToggle}>
              <span>
                ⏰ Daily Reminder
                <small>Gentle nudge every evening while the app is open</small>
              </span>
              <strong>{reminderEnabled ? '🟢 On' : '⭕ Off'}</strong>
            </button>
            <button className="settings-row" type="button" onClick={onAmbientToggle}>
              <span>
                {icons.music} Ambient Soundscape
                <small>Soft synth background while you write</small>
              </span>
              <strong>{ambientEnabled ? '🎵 Playing' : '🔇 Muted'}</strong>
            </button>
          </div>
        </MotionSection>

        {/* Premium */}
        <MotionSection className="settings-card premium-card glass-panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Premium</p>
              <h3>{premium ? `${icons.crown} Premium Mode Active` : `${icons.gem} Unlock the Full Dreamy Experience`}</h3>
            </div>
          </div>
          <ul className="premium-list">
            <li>Unlimited diary entries — no cap</li>
            <li>Advanced mood analytics & charts {icons.graph}</li>
            <li>Cloud backup ready architecture</li>
            <li>Custom themes & color personalization {icons.palette}</li>
            <li>Premium voice journaling {icons.mic}</li>
            <li>Subscription via Stripe (monthly/yearly)</li>
          </ul>
          <motion.button
            className="primary-button"
            type="button"
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.03 }}
          >
            {premium ? `${icons.crown} Premium Active` : `${icons.gem} Premium managed in dashboard`}
          </motion.button>
        </MotionSection>

      </div>
    </PageFrame>
  )
}

/* ════════════════════════════════════════════════════════════════════
   Shared Sub-Components
   ════════════════════════════════════════════════════════════════════ */
function StatCard({ title, value, icon }) {
  return (
    <MotionArticle
      className="stat-card glass-panel"
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <span>{icon}</span>
      <strong>{value}</strong>
      <small>{title}</small>
    </MotionArticle>
  )
}

function ChartPanel({ title, tag, children }) {
  return (
    <MotionSection className="chart-card glass-panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">{tag}</p>
          <h3>{title}</h3>
        </div>
      </div>
      <div className="chart-wrap">{children}</div>
    </MotionSection>
  )
}

function SortableEntryCard(props) {
  const { entry } = props
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: entry.id })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} {...attributes} {...listeners}>
      <EntryCard {...props} />
    </div>
  )
}

export default AppShell
