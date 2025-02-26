import { Text } from '@react-three/drei'
import { useControls } from 'leva'
import * as THREE from 'three'
import React, { useEffect } from 'react'
import { useScene } from '../contexts/SceneContext'

export default function Sign() {
  const { currentScene } = useScene()
  
  const { position, scale, color } = useControls('Sign', {
    position: { value: [0, 3.5, -4.8], step: 0.1 },
    scale: { value: 1, min: 0.5, max: 3 },
    color: { value: '#ffffff' }
  })

  React.useLayoutEffect(() => {
  }, [currentScene]);

  return (
    <Text
      key={`text-${currentScene}`}
      position={position}
      rotation={[Math.PI, Math.PI, Math.PI]}
      fontSize={0.4}
      color={color}
      anchorX="center"
      anchorY="middle"
      scale={scale}
    >
      {currentScene}
    </Text>
  )
} 