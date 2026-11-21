import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import BrandMark from './components/BrandMark'
import './styles.css'
import './additional.css'

class RootErrorBoundary extends React.Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) { console.error('AgileForge render error:', error, info) }
  render() {
    if (this.state.error) return <main className="runtime-error"><div><BrandMark/><h1>AgileForge couldn’t open this page</h1><p>Reload the page. If the problem continues, check the browser console and make sure the API is running.</p>{import.meta.env.DEV&&<pre>{this.state.error.message}</pre>}<button className="primary-button" onClick={() => window.location.reload()}>Reload app</button></div></main>
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(<React.StrictMode><RootErrorBoundary><BrowserRouter><App /></BrowserRouter></RootErrorBoundary></React.StrictMode>)
