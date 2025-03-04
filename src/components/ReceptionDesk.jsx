import React, { useMemo, useState, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import * as THREE from 'three'

export default function ReceptionDesk({ currentAction, position, rotation, scale }) {
  const [currentAvatarType, setCurrentAvatarType] = useState(1)
  const { scene: gltfScene } = useGLTF('./models/resize_reception.glb', {
    draco: true,
    meshOptimizer: true
  })

  useEffect(() => {
    const handleAvatarTypeChange = (event) => {
      console.log('Reception desk received avatar type change:', event.detail);
      setTimeout(() => {
        setCurrentAvatarType(event.detail);
      }, 100);
    };

    window.addEventListener('avatar-type-change', handleAvatarTypeChange);
    return () => {
      window.removeEventListener('avatar-type-change', handleAvatarTypeChange);
    };
  }, []);

  const clone = useMemo(() => {
    const clonedScene = SkeletonUtils.clone(gltfScene)
    
    const colors = {
      1: new THREE.Color('#FFFFFF'), // biały dla pierwszego awatara
      2: new THREE.Color('#FFD700'), // złoty dla drugiego
      3: new THREE.Color('#C0C0C0'), // srebrny dla trzeciego
      4: new THREE.Color('#CD7F32')  // brązowy dla czwartego
    }

    console.log('Reception desk applying color for avatar type:', currentAvatarType);
    const color = colors[currentAvatarType] || colors[1]

    // Zmień kolor tylko dla wybranego elementu (np. "Cube008")
    clonedScene.traverse((child) => {
      if (child.isMesh && child.name === "Cube008") { // Możesz zmienić nazwę na właściwą
        if (child.material) {
          child.material = child.material.clone()
          console.log('Applying color to mesh:', child.name, 'Color:', color);
          child.material.color.copy(color)
          if (currentAvatarType > 1) {
            child.material.metalness = 0.8
            child.material.roughness = 0.2
          } else {
            child.material.metalness = 0
            child.material.roughness = 0.5
          }
        }
      }
    })

    return clonedScene
  }, [gltfScene, currentAvatarType])

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive 
        object={clone} 
        position={[0, 0, 0.7]}
      />
    </group>
  )
}

// Pre-load modelu z optymalizacjami
useGLTF.preload('./models/resize_reception.glb', {
  draco: true,
  meshOptimizer: true
}) 