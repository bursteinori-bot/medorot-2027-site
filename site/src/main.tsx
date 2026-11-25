import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import './index.css'
import App from './App.tsx'

// <html lang dir> follow the site language: set early by the script in index.html and kept by LangProvider
// (src/i18n/lang.tsx), which also covers hosts that wrap the page in their own <html> and drop those attributes

// path routes (/about, /apply …); vercel.json rewrites every non-file path to index.html
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <App />
      </MotionConfig>
    </BrowserRouter>
  </StrictMode>,
)
