import React, { useEffect, useState } from 'react'
import { useBox } from '@react-three/cannon'
import { useControls } from 'leva'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

export default function Wall({ name, initialPosition = [0, 0, 0], initialSize = [1, 1, 1], ...props }) {
  const [currentAvatarType, setCurrentAvatarType] = useState(1)
  
  const controls = useControls(name || 'Wall', {
    position: { value: initialPosition, label: 'Position' },
    size: { value: initialSize, label: 'Size' },
    visible: { value: true, label: 'Visible' }
  })

  // Nasłuchuj zmiany typu awatara
  useEffect(() => {
    const handleAvatarTypeChange = (event) => {
      console.log('Wall received avatar type change:', event.detail);
      setTimeout(() => {
        setCurrentAvatarType(event.detail);
      }, 100);
    };

    window.addEventListener('avatar-type-change', handleAvatarTypeChange);
    return () => {
      window.removeEventListener('avatar-type-change', handleAvatarTypeChange);
    };
  }, []);

  // Kolory dla różnych scen
  const colors = {
    1: '#e0e0e0', // jasny szary dla pierwszej sceny
    2: '#c8e6c9', // jasny zielony dla drugiej sceny
    3: '#bbdefb', // jasny niebieski dla trzeciej sceny
    4: '#ffecb3'  // jasny żółty dla czwartej sceny
  }

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

  const currentColor = colors[currentAvatarType] || colors[1]

  return (
    <mesh ref={ref} receiveShadow>
      <boxGeometry args={controls.size} />
      <meshStandardMaterial 
        color={currentColor}
        map={baseColorMap}
        displacementMap={displacementMap}
        displacementScale={0.1}
        normalMap={normalMap}
        roughnessMap={roughnessMap}
        metalnessMap={metallicMap}
        // Dodajemy parametry dla lepszego efektu wizualnego
        metalness={currentAvatarType > 1 ? 0.3 : 0.1}
        roughness={currentAvatarType > 1 ? 0.6 : 0.8}
        envMapIntensity={currentAvatarType > 1 ? 1.2 : 0.8}
      />
    </mesh>
  )
} 