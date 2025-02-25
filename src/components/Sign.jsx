import { Text } from '@react-three/drei'
import { useControls } from 'leva'
import * as THREE from 'three'
import React, { useEffect } from 'react'
import { useScene } from '../contexts/SceneContext'

export default function Sign() {
  const { currentScene } = useScene()
  
  console.log("Sign renderowany z tekstem:", currentScene)
  
  const { position, scale, color } = useControls('Sign', {
    position: { value: [0, 3.5, -2.3], step: 0.1 },
    scale: { value: 1, min: 0.5, max: 3 },
    color: { value: '#1a1a1a' }
  })

  React.useLayoutEffect(() => {
    console.log("Sign useLayoutEffect - aktualizacja tekstu:", currentScene);
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