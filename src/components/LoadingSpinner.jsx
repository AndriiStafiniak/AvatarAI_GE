import React, { useEffect, useState } from 'react'
import './LoadingSpinner.css'

export function LoadingSpinner({ progress }) {
  const [displayProgress, setDisplayProgress] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setDisplayProgress(prev => {
        if (prev >= progress) return prev
        return Math.min(prev + 1, progress)
      })
    }, 30)

    return () => clearInterval(timer)
  }, [progress])

  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${displayProgress}%` }}
        ></div>
      </div>
      <div className="progress-text">{displayProgress}%</div>
    </div>
  )
} 