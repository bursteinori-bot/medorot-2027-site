import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import './index.css'
import App from './App.tsx'

// set here as well as in index.html: hosts that wrap the page in their own <html> drop those attributes
document.documentElement.lang = 'he'
document.documentElement.dir = 'rtl'

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
