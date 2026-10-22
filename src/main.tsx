import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource/noto-naskh-arabic/arabic-400.css'
import '@fontsource/nunito-sans/latin-400.css'
import '@fontsource/nunito-sans/latin-600.css'
import { App } from './App'
import { PrototypeProvider } from './state'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><BrowserRouter><PrototypeProvider><App /></PrototypeProvider></BrowserRouter></React.StrictMode>,
)
