import React, { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import { useControls } from 'leva'
import { useBox } from '@react-three/cannon'

export const Vase = React.memo(({ 
  currentAction,
}) => {
  // Dodajemy kontrolki Leva dla wazy
  const { position, rotation, scale } = useControls('Vase', {
    position: {
      value: [1.2, 0.95, 0.7],
      step: 0.1,
    },
    rotation: {
      value: [0, Math.PI / 4, 0],
      step: 0.01,
    },
    scale: {
      value: 0.4,
      min: 0.1,
      max: 5,
      step: 0.1,
    }
  })

  const { scene: gltfScene } = useGLTF('./models/vase.glb', {
    draco: true,
    meshOptimizer: true
  })

  const clone = useMemo(() => SkeletonUtils.clone(gltfScene), [gltfScene])

  const [ref] = useBox(() => ({
    type: 'Static',
    args: [0.3, 0.5, 0.3],
    position: [1.5, 0.25, 1.5],
    material: { friction: 0.5 }
  }))

  return (
    <group>
      <primitive 
        object={clone} 
        position={position}
        scale={scale}
        rotation={rotation}
      />
      <mesh ref={ref} castShadow receiveShadow>
        {/* Istniejąca geometria wazy */}
      </mesh>
    </group>
  )
})

// Pre-load modelu wazy
useGLTF.preload('./models/vase.glb', {
  draco: true,
  meshOptimizer: true
}) 