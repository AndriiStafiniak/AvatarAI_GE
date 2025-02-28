import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'

export const Lipsync = ({ model }) => {
  const visemeData = useRef([])
  const currentFrame = useRef(0)
  const isPlaying = useRef(false)
  const lastTime = useRef(0)

  useFrame((_, delta) => {
    if (!isPlaying.current || !model) return
    
    // Aktualizuj klatkę co 100ms (10 FPS - wolniejsza animacja)
    lastTime.current += delta
    if (lastTime.current >= 0.1) {
      currentFrame.current++
      lastTime.current = 0
      
      if (currentFrame.current >= visemeData.current.length) {
        resetMorphs()
        isPlaying.current = false
        return
      }

      applyVisemeFrame(currentFrame.current)
    }
  })

  const applyVisemeFrame = (frame) => {
    if (!visemeData.current[frame]) return
    
    const weights = visemeData.current[frame]
    
    model.traverse(child => {
      if (child.isMesh && child.morphTargetDictionary) {
        // Aplikuj tylko mouthOpen
        if (child.morphTargetDictionary.mouthOpen !== undefined) {
          child.morphTargetInfluences[child.morphTargetDictionary.mouthOpen] = weights[0]
        }
      }
    })
  }

  const resetMorphs = () => {
    model?.traverse(child => {
      if (child.isMesh && child.morphTargetInfluences) {
        child.morphTargetInfluences.fill(0)
      }
    })
  }

  useEffect(() => {
    const handleVisemeUpdate = () => {
      if (!window.visemeData || !window.visemeDataActive) return
      
      visemeData.current = window.visemeData
      currentFrame.current = 0
      lastTime.current = 0
      isPlaying.current = true
    }

    window.addEventListener('viseme-data-update', handleVisemeUpdate)
    return () => window.removeEventListener('viseme-data-update', handleVisemeUpdate)
  }, [])

  // Log dostępnych morph targets przy inicjalizacji
  useEffect(() => {
    if (model) {
      console.log('Model załadowany:', model)
      let foundMorphTargets = false
      
      model.traverse(child => {
        if (child.isMesh) {
          console.log('Znaleziono mesh:', child.name)
          console.log('Morph target dictionary:', child.morphTargetDictionary)
          console.log('Morph target influences:', child.morphTargetInfluences)
          
          if (child.morphTargetDictionary) {
            foundMorphTargets = true
            // Sprawdź czy mamy odpowiednie viseme morph targets
            const expectedVisemes = [
              'viseme_sil', 'viseme_PP', 'viseme_FF', 'viseme_TH',
              'viseme_DD', 'viseme_kk', 'viseme_CH', 'viseme_SS',
              'viseme_nn', 'viseme_RR', 'viseme_aa', 'viseme_E',
              'viseme_I', 'viseme_O', 'viseme_U'
            ]
            
            const foundVisemes = expectedVisemes.filter(viseme => 
              child.morphTargetDictionary[viseme] !== undefined
            )
            
            console.log('Znalezione viseme morph targets:', foundVisemes)
          }
        }
      })
      
      if (!foundMorphTargets) {
        console.error('Model nie ma żadnych morph targets!')
      }
    }
  }, [model])

  return null
} 