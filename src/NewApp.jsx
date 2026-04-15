import { Toaster } from 'react-hot-toast'
import { HashRouter } from 'react-router-dom'
import AppShell from './dreamy/AppShell.jsx'
import './dreamy/dreamy.css'

function NewApp() {
  return (
    <HashRouter>
      <AppShell />
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'dream-toast',
          duration: 2400,
        }}
      />
    </HashRouter>
  )
}

export default NewApp
