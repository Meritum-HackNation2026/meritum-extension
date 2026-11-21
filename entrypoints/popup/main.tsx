import '@fontsource-variable/archivo/wdth.css'
import '@fontsource/azeret-mono/400.css'
import './ui.css'
import './popup.css'
import './fonts.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'

const root = document.getElementById('root')
if (!root) throw new Error('#root missing in index.html')
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
