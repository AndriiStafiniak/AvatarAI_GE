import React, { useState, useEffect, useMemo } from 'react'
import { useTexture } from '@react-three/drei'

export default function Ceiling() {
  const [currentAvatarType, setCurrentAvatarType] = useState(1)

  // Nasłuchuj zmiany typu awatara
  useEffect(() => {
    const handleAvatarTypeChange = (event) => {
      console.log('Ceiling received avatar type change:', event.detail);
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
    1: '#606060', // standardowy szary dla pierwszej sceny
    2: '#7AACFF', // niebieski dla drugiej sceny
    3: '#C5FF7A', // zielony dla trzeciej sceny
    4: '#F76155'  // czerwony dla czwartej sceny
  }

  // Ładowanie tekstur sufitu
  const [
    baseColorMap,
    roughnessMap,
    aoMap,
    armMap,
    displacementMap,
    normalMapDX,
    normalMapGL
  ] = useTexture([
    '/textures/ceilingTextures/brown_planks_03_ao_1k.jpg',
    '/textures/ceilingTextures/brown_planks_03_rough_1k.jpg',
    '/textures/ceilingTextures/brown_planks_03_ao_1k.jpg',
    '/textures/ceilingTextures/brown_planks_03_arm_1k.jpg',
    '/textures/ceilingTextures/brown_planks_03_disp_1k.png',
    '/textures/ceilingTextures/brown_planks_03_nor_dx_1k.jpg',
    '/textures/ceilingTextures/brown_planks_03_nor_gl_1k.jpg'
  ])

  // Parametry materiału dla różnych scen
  const materialParams = {
    1: {
      metalness: 0.8,
      roughness: 0.8,
      envMapIntensity: 0.3,
      aoMapIntensity: 0.3,
      displacementScale: -0.1, 
    },
    2: {
      metalness: 0.8,
      roughness: 0.6,
      envMapIntensity: 1.2,
      aoMapIntensity: 0.8,
      displacementScale: -0.1
    },
    3: {
      metalness: 0.15,
      roughness: 0.65,
      envMapIntensity: 1.1,
      aoMapIntensity: 0.9,
      displacementScale: -0.1
    },
    4: {
      metalness: 0.25,
      roughness: 0.55,
      envMapIntensity: 1.3,
      aoMapIntensity: 0.7,
      displacementScale: -0.1
    }
  }

  const currentColor = colors[currentAvatarType] || colors[1]
  const currentMaterialParams = materialParams[currentAvatarType] || materialParams[1]

  return (
    <group position={[0, 4.02, 0]}>
      {/* Główna płyta sufitu */}
      <mesh receiveShadow>
        <boxGeometry args={[10, 0.2, 10]} />
        <meshStandardMaterial 
          color={currentColor}
          map={baseColorMap}
          roughnessMap={roughnessMap}
          aoMap={aoMap}
          metalnessMap={armMap}
          displacementMap={displacementMap}
          normalMap={normalMapDX}
          metalness={currentMaterialParams.metalness}
          roughness={currentMaterialParams.roughness}
          envMapIntensity={currentMaterialParams.envMapIntensity}
          aoMapIntensity={currentMaterialParams.aoMapIntensity}
          displacementScale={currentMaterialParams.displacementScale}
        />
      </mesh>

      {/* System oświetlenia */}
      <group position={[0, -0.1, 0]}>
        {useMemo(() => {
          const lights = []
          const spacing = 2
          const rows = 2
          const cols = 2

          for (let x = -cols/2; x <= cols/2; x++) {
            for (let z = -rows/2; z <= rows/2; z++) {
              lights.push(
                <mesh 
                  key={`light-${x}-${z}`}
                  position={[x * spacing, 0, z * spacing]}
                >
                  <boxGeometry args={[3.5, 0.1, 1.2]} />
                  <meshStandardMaterial 
                    color={'#ffffff'}
                    emissive={'#ffffff'}
                    emissiveIntensity={1.5}
                    metalness={1}
                    roughness={0.8}
                    envMapIntensity={currentMaterialParams.envMapIntensity}
                  />
                </mesh>
              )
            }
          }
          return lights
        }, [currentAvatarType, currentColor, currentMaterialParams])}
      </group>
    </group>
  )
}

 