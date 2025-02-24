import React from 'react'
import { Plane } from '@react-three/drei'
import { usePlane } from '@react-three/cannon'

export const Floor = () => {
  const [ref] = usePlane(() => ({
    type: 'Static',
    rotation: [-Math.PI / 2, 0, 0],  // Obrót poziomy
    position: [2.5, 0, 2],           // Pozycja zgodna z wizualną podłogą
    material: {
      friction: 0.5,
      restitution: 0.2
    }
  }))

  return (
    <Plane
      args={[50, 50]}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[2.5, 0, 2]}
      receiveShadow
    >
      <meshStandardMaterial 
        color="#4a4a4a"
        metalness={0.1}
        roughness={0.6}
      />
    </Plane>
  )
} 