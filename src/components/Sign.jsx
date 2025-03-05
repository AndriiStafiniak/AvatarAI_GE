import { Text } from '@react-three/drei'
import { useControls } from 'leva'
import * as THREE from 'three'
import React, { useEffect } from 'react'

const LABELS = {
  1: 'TRANSFORMACJA ENERGETYCZNA FIRM',
  2: 'HUB ENERGETYCZNY I WODOROWY',
  3: 'POPRAWA EFEKTYWNOŚCI OZE', 
  4: 'CZYSTE POWIETRZE'
}

export default function Sign({ activeScene }) {
  const { position, scale, color } = useControls('Sign', {
    position: { value: [0, 3.5, -4.8], step: 0.1 },
    scale: { value: 1, min: 0.5, max: 3 },
    color: { value: '#ffffff' }
  })

  React.useLayoutEffect(() => {
    // Możesz dodać logikę zależną od activeScene
  }, [activeScene]);

  return (
    <Text
      key={`text-${activeScene}`}
      position={position}
      rotation={[Math.PI, Math.PI, Math.PI]}
      fontSize={0.4}
      color={color}
      anchorX="center"
      anchorY="middle"
      scale={scale}
    >
      {LABELS[activeScene] || `Scena ${activeScene}`}
    </Text>
  )
} 