export const storageKey = 'dreamydaily-v3'

export const icons = {
  sparkles: '✨',
  flower: '🌸',
  moon: '🌙',
  cloud: '☁️',
  stars: '💫',
  butterfly: '🦋',
  book: '📖',
  heart: '❤️',
  pin: '📌',
  lock: '🔒',
  graph: '📊',
  fire: '🔥',
  image: '🖼️',
  mic: '🎤',
  clock: '⏰',
  music: '🎶',
  confetti: '🎉',
  gem: '💎',
  crown: '👑',
  palette: '🎨',
  search: '🔍',
  calendar: '📅',
  star: '⭐',
  sunrise: '🌅',
  rainbow: '🌈',
}

export const moodOptions = [
  { value: 'joyful', label: 'Joyful', emoji: '😊', score: 5 },
  { value: 'romantic', label: 'Romantic', emoji: '😍', score: 4.5 },
  { value: 'calm', label: 'Calm', emoji: '😌', score: 4 },
  { value: 'excited', label: 'Excited', emoji: '🤩', score: 4.5 },
  { value: 'melancholy', label: 'Melancholy', emoji: '😢', score: 2 },
  { value: 'stressed', label: 'Stressed', emoji: '😰', score: 1 },
  { value: 'grateful', label: 'Grateful', emoji: '🥹', score: 5 },
  { value: 'inspired', label: 'Inspired', emoji: '✨', score: 4 },
  { value: 'angry', label: 'Angry', emoji: '😤', score: 1.5 },
  { value: 'tired', label: 'Tired', emoji: '😴', score: 2.5 },
]

export const promptIdeas = [
  'What made you smile today? ✨',
  'What felt soft, strange, or unforgettable today?',
  'If this day had a color, what would it be? 🎨',
  'What do you want future-you to remember?',
  'What tiny miracle did you notice today? 🌸',
  'How did the sky look this evening? 🌅',
  'What song captures your mood right now? 🎶',
  'What made your heart feel full today? 💫',
  'If you could bottle one moment, which one?',
  'What are you quietly proud of? ☁️',
]

export const navItems = [
  { path: '/', label: 'Home', icon: '✨' },
  { path: '/write', label: 'Write', icon: '📖' },
  { path: '/calendar', label: 'Calendar', icon: '📅' },
  { path: '/favorites', label: 'Favorites', icon: '❤️' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
]

export const themeOptions = [
  { value: 'pastel-mix', label: '🌈 Pastel Mix' },
  { value: 'pink-blush', label: '🌸 Pink Blush' },
  { value: 'dark-dream', label: '🌙 Dark Dream' },
]

export function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function createDraft() {
  return {
    title: '',
    content: '',
    mood: 'joyful',
    images: [],
    favorite: false,
    pinned: false,
    locked: false,
    password: '',
  }
}

export function createStarterEntries() {
  const now = new Date()

  return [
    {
      id: uid(),
      title: 'Moonlit Thoughts',
      content:
        '<h2>Tonight felt slow and silver. ✨</h2><p>I let myself rest without earning it first. That felt new, and beautiful. The world outside my window was painted in soft moonlight, and I realised that peace doesn\'t always need a reason.</p>',
      mood: 'calm',
      images: [],
      createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 21, 10).toISOString(),
      updatedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 21, 10).toISOString(),
      favorite: true,
      pinned: true,
      locked: false,
      password: '',
    },
    {
      id: uid(),
      title: 'Peach Sky Walk 🌅',
      content:
        '<p>The evening sky looked painted in peach and lavender, and I actually stopped to notice it. Sometimes the most important thing you can do is simply look up and breathe.</p><p>I walked slowly today. No rush. No destination. Just me and the sky.</p>',
      mood: 'joyful',
      images: [],
      createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 19, 5).toISOString(),
      updatedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 19, 5).toISOString(),
      favorite: false,
      pinned: false,
      locked: false,
      password: '',
    },
    {
      id: uid(),
      title: 'A Tiny Ache',
      content:
        '<p>I felt a little heavier today, but writing this down made it gentler.</p><p>Maybe softness counts as progress too. 🌙 Tomorrow is a fresh page waiting to be written.</p>',
      mood: 'melancholy',
      images: [],
      createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3, 23, 0).toISOString(),
      updatedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3, 23, 0).toISOString(),
      favorite: false,
      pinned: false,
      locked: true,
      password: 'moon',
    },
    {
      id: uid(),
      title: 'Gratitude List 🌸',
      content:
        '<h2>Three things I\'m grateful for today:</h2><p>1. The warmth of morning sunlight on my face</p><p>2. A kind stranger who held the door open</p><p>3. The sound of rain against my window tonight</p>',
      mood: 'grateful',
      images: [],
      createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 22, 30).toISOString(),
      updatedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 22, 30).toISOString(),
      favorite: true,
      pinned: false,
      locked: false,
      password: '',
    },
  ]
}

export function getInitialState() {
  const raw = window.localStorage.getItem(storageKey)

  if (!raw) {
    return {
      entries: createStarterEntries(),
      theme: 'pastel-mix',
      reminderEnabled: false,
      ambientEnabled: false,
      premium: false,
    }
  }

  try {
    return JSON.parse(raw)
  } catch {
    window.localStorage.removeItem(storageKey)
    return {
      entries: createStarterEntries(),
      theme: 'pastel-mix',
      reminderEnabled: false,
      ambientEnabled: false,
      premium: false,
    }
  }
}

export function formatDateTime(dateString) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(dateString))
}

export function formatDateOnly(dateString) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateString))
}

export function dateKey(dateInput) {
  return new Date(dateInput).toISOString().slice(0, 10)
}

export function stripHtml(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function getMoodMeta(value) {
  return moodOptions.find((mood) => mood.value === value) ?? moodOptions[0]
}

export function getCalendarDays(activeMonth) {
  const firstDay = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), 1)
  const lastDay = new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 0)
  const days = []

  for (let index = 0; index < firstDay.getDay(); index += 1) {
    days.push(null)
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(new Date(activeMonth.getFullYear(), activeMonth.getMonth(), day))
  }

  return days
}

export function computeStreak(entries) {
  const uniqueDays = new Set(entries.map((entry) => dateKey(entry.createdAt)))
  let streak = 0
  const cursor = new Date()

  while (uniqueDays.has(cursor.toISOString().slice(0, 10))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

export function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  if (hour < 21) return 'Good evening'
  return 'Sweet dreams'
}

export function getRandomQuote() {
  const quotes = [
    'Small daily reflections create the clearest map back to yourself.',
    'Some days are poems. Write them down before they fade.',
    'Your diary is a love letter to your future self.',
    'The quietest moments hold the deepest truths.',
    'Every entry is a tiny miracle of self-awareness.',
    'Write softly. Remember beautifully.',
  ]
  return quotes[Math.floor(Math.random() * quotes.length)]
}
