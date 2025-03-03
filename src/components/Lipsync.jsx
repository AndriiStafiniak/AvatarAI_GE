import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'

export default function Lipsync({ model, isActive }) {
  const isPlaying = useRef(false)
  const lastTime = useRef(0)

  useFrame((_, delta) => {
    if (!model) return
    
    lastTime.current += delta
    if (lastTime.current >= 0.8) { 
      lastTime.current = 0
      
      // Prosty toggle stanu ust
      model.traverse(child => {
        if (child.isMesh && child.morphTargetDictionary && child.morphTargetDictionary.mouthOpen !== undefined) {
          const currentValue = child.morphTargetInfluences[child.morphTargetDictionary.mouthOpen]
          child.morphTargetInfluences[child.morphTargetDictionary.mouthOpen] = currentValue > 0 ? 0 : 1
        }
      })
    }
  })

  useEffect(() => {
    if (!isActive || !model) {
      // Resetuj usta do pozycji zamkniętej gdy nie jest aktywny
      model?.traverse(child => {
        if (child.isMesh && child.morphTargetDictionary && child.morphTargetDictionary.mouthOpen !== undefined) {
          child.morphTargetInfluences[child.morphTargetDictionary.mouthOpen] = 0
        }
      })
    }
  }, [isActive, model])

  return null
} 