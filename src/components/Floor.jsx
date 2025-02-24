import React from 'react'
import { usePlane } from '@react-three/cannon'

export function Floor(props) {
  const [ref] = usePlane(() => ({ 
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
    ...props 
  }))

  return (
    <mesh 
      ref={ref} 
      receiveShadow
    >
      <planeGeometry args={[25, 25]} /> 
      <meshStandardMaterial color="#666666" />
    </mesh>
  )
} 