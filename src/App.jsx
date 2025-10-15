import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  return (
    <div className="app-root">
      <QuickDoor />
    </div>
  )
}

export default App

function QuickDoor() {
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)
  const [feedback, setFeedback] = useState('') // 'success' | 'miss' | ''
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState(0) // 0..3 positions
  const [running, setRunning] = useState(false)
  const [difficulty, setDifficulty] = useState(1)
  const timeoutRef = useRef(null)
  const speedRef = useRef(1200) // ms for open interval

  useEffect(() => {
    // load best from storage
    const saved = parseInt(localStorage.getItem('quickdoor_best') || '0', 10)
    if (!isNaN(saved)) setBest(saved)
    return () => clearTimeout(timeoutRef.current)
  }, [])

  function startGame() {
    setScore(0)
    setRunning(true)
    speedRef.current = 1200
    scheduleNext()
  }

  function stopGame() {
    setRunning(false)
    setIsOpen(false)
    clearTimeout(timeoutRef.current)
    setBest((b) => {
      const nb = Math.max(b, score)
      try { localStorage.setItem('quickdoor_best', String(nb)) } catch {}
      return nb
    })
  }

  function resetBest() {
    setBest(0)
    try { localStorage.removeItem('quickdoor_best') } catch {}
  }

  function scheduleNext() {
    // pick random position and timing
    const pos = Math.floor(Math.random() * 4)
    setPosition(pos)
    // door opens briefly after a small delay
    const openDelay = 300 + Math.floor(Math.random() * 500)
    timeoutRef.current = setTimeout(() => {
      setIsOpen(true)
      // time the door stays open depends on speedRef
      const openTime = Math.max(250, speedRef.current - Math.floor(Math.random() * 400))
      timeoutRef.current = setTimeout(() => {
        // missed
        setIsOpen(false)
        // small penalty: reduce score
        setScore((s) => Math.max(0, s - 1))
        // feedback
        setFeedback('miss')
        setTimeout(() => setFeedback(''), 300)
        // increase difficulty slowly
        speedRef.current = Math.max(400, speedRef.current - 20)
        setDifficulty((d) => Math.min(10, d + 0.1))
        if (running) scheduleNext()
      }, openTime)
    }, openDelay)
  }

  function handleClick(pos) {
    if (!running) return
    if (pos !== position) return // clicked wrong door area
    if (!isOpen) {
      // clicked a closed door -> fail
      setScore((s) => Math.max(0, s - 1))
      return
    }
    // success
    setScore((s) => s + 1)
    setIsOpen(false)
    // feedback
    setFeedback('success')
    setTimeout(() => setFeedback(''), 200)
    // speed up slightly
    speedRef.current = Math.max(400, speedRef.current - 30)
    setDifficulty((d) => Math.min(10, d + 0.2))
    // schedule next after a short rest
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      if (running) scheduleNext()
    }, 250)
  }

  return (
    <div className="quickdoor-root">
      <div className={`hud ${feedback}`}>
        <div className="hud-left">
          <div className="hud-item">Score: <strong>{score}</strong></div>
          <div className="hud-item">Best: <strong>{best}</strong></div>
        </div>
        <div className="hud-right">
          <div className="hud-item small">Speed: {(1200 - speedRef.current + 200).toFixed(0)}</div>
          <div className="hud-item small">Lvl: {Math.floor(difficulty)}</div>
          <div className="controls">
            {!running ? (
              <button onClick={startGame} className="btn-primary">Start</button>
            ) : (
              <button onClick={stopGame} className="btn-primary">Stop</button>
            )}
            <button onClick={resetBest} className="btn-reset" aria-label="Reset best">Reset</button>
          </div>
        </div>
      </div>

      <div className="doors">
        {[0,1,2,3].map((i) => (
          <button
            key={i}
            className={"door " + (position===i && isOpen ? 'open' : '')}
            onPointerDown={() => handleClick(i)}
            aria-label={`Door ${i + 1} ${position===i && isOpen ? 'open' : 'closed'}`}
          >
            <span className="door-inner">
              <span className="door-emoji">{position===i && isOpen ? '🟢' : '🚪'}</span>
              <span className="door-text">{position===i && isOpen ? 'OPEN' : 'CLOSED'}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="tip">Click the OPEN door quickly. Speed increases as you score.</div>
    </div>
  )
}
