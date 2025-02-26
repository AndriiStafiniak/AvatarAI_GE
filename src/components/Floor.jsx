import React from 'react'
import { usePlane } from '@react-three/cannon'
import { useTexture } from '@react-three/drei'

export default function Floor({ ...props }) {
  const [ref] = usePlane(() => ({ 
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, -0.05, 0],
    ...props 
  }))

  // Ładowanie tekstur podłogi
  const [
    baseColorMap,
    displacementMap,
    metallicMap,
    normalMap,
    roughnessMap
  ] = useTexture([
    '/textures/floorTextures/Poliigon_WoodVeneerOak_7760_BaseColor.jpg',
    '/textures/floorTextures/Poliigon_WoodVeneerOak_7760_Displacement.jpg',
    '/textures/floorTextures/Poliigon_WoodVeneerOak_7760_Metallic.jpg',
    '/textures/floorTextures/Poliigon_WoodVeneerOak_7760_Normal.png',
    '/textures/floorTextures/Poliigon_WoodVeneerOak_7760_Roughness.jpg'
  ])

  return (
    <mesh 
      ref={ref} 
      receiveShadow
    >
      <planeGeometry args={[10, 10]} />
      <meshStandardMaterial 
        color="#4a4a4a"
        map={baseColorMap}
        displacementMap={displacementMap}
        displacementScale={0.1}
        normalMap={normalMap}
        roughnessMap={roughnessMap}
        metalnessMap={metallicMap}
        roughness={0.8}
        metalness={0.2}
      />
    </mesh>
  )
} 