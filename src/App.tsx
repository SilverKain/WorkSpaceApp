import { useEffect } from 'react'
import { useAppStore } from './store/useAppStore'
import BoardManager from './components/BoardManager'
import Board from './components/Board'
import './App.css'

function App() {
  const { loadApp, currentBoardId } = useAppStore()

  useEffect(() => {
    loadApp()
  }, [])

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/WorkSpaceApp/sw.js').catch(() => {})
    }
  }, [])

  if (currentBoardId) {
    return <Board />
  }

  return <BoardManager />
}

export default App
