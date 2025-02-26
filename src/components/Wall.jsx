import React, { useEffect } from 'react'
import { useBox } from '@react-three/cannon'
import { useControls } from 'leva'
import { useTexture } from '@react-three/drei'

export default function Wall({ name, initialPosition = [0, 0, 0], initialSize = [1, 1, 1], initialColor = '#a0a0a0', ...props }) {
  const controls = useControls(name || 'Wall', {
    position: { value: initialPosition, label: 'Position' },
    size: { value: initialSize, label: 'Size' },
    color: { value: initialColor, label: 'Color' },
    visible: { value: true, label: 'Visible' }
  })

  // Ładowanie tekstur
  const [
    baseColorMap,
    displacementMap,
    metallicMap,
    normalMap,
    roughnessMap
  ] = useTexture([
    '/textures/walltextures/Poliigon_BrickWallReclaimed_8320_BaseColor.jpg',
    '/textures/walltextures/Poliigon_BrickWallReclaimed_8320_Displacement.jpg',
    '/textures/walltextures/Poliigon_BrickWallReclaimed_8320_Metallic.jpg',
    '/textures/walltextures/Poliigon_BrickWallReclaimed_8320_Normal.png',
    '/textures/walltextures/Poliigon_BrickWallReclaimed_8320_Roughness.jpg'
  ])

  const [ref] = useBox(() => ({
    type: 'Static',
    args: controls.size,
    position: controls.position,
    material: { friction: 0.5 },
    ...props
  }))

  if (!controls.visible) return null

  return (
    <mesh ref={ref} receiveShadow>
      <boxGeometry args={controls.size} />
      <meshStandardMaterial 
        color={controls.color}
        map={baseColorMap}
        displacementMap={displacementMap}
        displacementScale={0.1}
        normalMap={normalMap}
        roughnessMap={roughnessMap}
        metalnessMap={metallicMap}
      />
    </mesh>
  )
} 