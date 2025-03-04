import React, { useState, useEffect } from 'react'
import { usePlane } from '@react-three/cannon'
import { useTexture } from '@react-three/drei'

export default function Floor({ ...props }) {
  const [currentAvatarType, setCurrentAvatarType] = useState(1)

  // Nasłuchuj zmiany typu awatara
  useEffect(() => {
    const handleAvatarTypeChange = (event) => {
      console.log('Floor received avatar type change:', event.detail);
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
    1: '#4a4a4a', // standardowy ciemny dla pierwszej sceny
    2: '#3b4a3b', // ciemny zielonkawy dla drugiej sceny
    3: '#3b424a', // ciemny niebieskawy dla trzeciej sceny
    4: '#4a463b'  // ciemny żółtawy dla czwartej sceny
  }

  // Parametry materiału dla różnych scen
  const materialParams = {
    1: {
      metalness: 0.2,
      roughness: 0.8,
      envMapIntensity: 1.0
    },
    2: {
      metalness: 0.3,
      roughness: 0.7,
      envMapIntensity: 1.2
    },
    3: {
      metalness: 0.25,
      roughness: 0.75,
      envMapIntensity: 1.1
    },
    4: {
      metalness: 0.35,
      roughness: 0.65,
      envMapIntensity: 1.3
    }
  }

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

  const currentColor = colors[currentAvatarType] || colors[1]
  const currentMaterialParams = materialParams[currentAvatarType] || materialParams[1]

  return (
    <mesh 
      ref={ref} 
      receiveShadow
    >
      <planeGeometry args={[10, 10]} />
      <meshStandardMaterial 
        color={currentColor}
        map={baseColorMap}
        displacementMap={displacementMap}
        displacementScale={0.1}
        normalMap={normalMap}
        roughnessMap={roughnessMap}
        metalnessMap={metallicMap}
        metalness={currentMaterialParams.metalness}
        roughness={currentMaterialParams.roughness}
        envMapIntensity={currentMaterialParams.envMapIntensity}
      />
    </mesh>
  )
} 