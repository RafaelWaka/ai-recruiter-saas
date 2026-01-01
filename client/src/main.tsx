import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // Ajoute cet import
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter> {/* Ajoute cette balise ici */}
      <App />
    </BrowserRouter> {/* Et referme-la ici */}
  </React.StrictMode>,
)