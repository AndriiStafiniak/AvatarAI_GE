import React, { Suspense, useEffect, useRef, useCallback } from 'react'
import { useGLTF } from '@react-three/drei'
import { useControls } from 'leva'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Optymalizacja komponentu zegara z React.memo
export const Zegar = React.memo(() => {
  const { scene } = useGLTF('./models/Zegar.glb', {
    draco: true,
    meshOptimizer: true
  })
  
  const secondHand = useRef()
  const minuteHand = useRef()
  const hourHand = useRef()

  // Inicjalizacja wskazówek
  const initializeHands = useCallback(() => {
    try {
      secondHand.current = scene.getObjectByName('sekundy')
      minuteHand.current = scene.getObjectByName('Minuty')
      hourHand.current = scene.getObjectByName('Godziny')

      if (secondHand.current) {
        secondHand.current.visible = true
        secondHand.current.renderOrder = 1
      }
    } catch (error) {
      console.error('Error initializing clock hands:', error)
    }
  }, [scene])

  useEffect(() => {
    initializeHands()
    
    return () => {
      // Cleanup dla referencji
      secondHand.current = null
      minuteHand.current = null
      hourHand.current = null
    }
  }, [initializeHands])

  // Optymalizacja animacji wskazówek
  const updateClockHands = useCallback(() => {
    const now = new Date()
    const seconds = now.getSeconds()
    const minutes = now.getMinutes()
    const hours = now.getHours()

    const secondDegrees = (seconds / 60) * 360
    const minuteDegrees = ((minutes + seconds / 60) / 60) * 360
    const hourDegrees = ((hours % 12 + minutes / 60) / 12) * 360

    const toRadians = (degrees) => degrees * (-Math.PI / 180)

    if (secondHand.current) {
      secondHand.current.rotation.x = toRadians(secondDegrees)
      secondHand.current.visible = true
    }
    if (minuteHand.current) {
      minuteHand.current.rotation.x = toRadians(minuteDegrees)
    }
    if (hourHand.current) {
      hourHand.current.rotation.x = toRadians(hourDegrees)
    }
  }, [])

  useFrame(updateClockHands)

  const { position, rotationY, scale } = useControls('Zegar', {
    position: {
      value: [-2, 2, -2.5],
      step: 0.1,
    },
    rotationY: {
      value: 272,
      min: 0, 
      max: 360, 
      step: 1 
    },
    scale: {
      value: 2.4,
      min: 0.1,
      max: 5,
      step: 0.1,
    }
  })

  return (
    <Suspense fallback={null}>
      <primitive 
        object={scene} 
        position={position}
        rotation={[0, THREE.MathUtils.degToRad(rotationY), 0]}
        scale={scale}
        castShadow
        receiveShadow
      />
    </Suspense>
  )
})

// Pre-load modelu z optymalizacjami
useGLTF.preload('./models/Zegar.glb', {
  draco: true,
  meshOptimizer: true
}) 