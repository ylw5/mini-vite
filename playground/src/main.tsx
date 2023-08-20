import React from 'react'
import ReactDOM from 'react-dom/client'
// import App from './App.tsx'
import str from './test'
import './index.css'

const App = () => (<button>{str}</button>)

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
import.meta.hot?.accept(() => {
  root.render(<App />)
})