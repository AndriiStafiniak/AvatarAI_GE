import React, { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import { useControls } from 'leva'
import { useBox } from '@react-three/cannon'

export const CoffeeTable = React.memo(() => {
  // Kontrolki Leva dla stolika kawowego
  const { position, rotation, scale } = useControls('Coffee Table', {
    position: {
      value: [2.4, 0.0, 0.4],
      step: 0.1,
    },
    rotation: {
      value: [0, Math.PI / 2, 0],
      step: 0.01,
    },
    scale: {
      value: 1.2,
      min: 0.1,
      max: 2,
      step: 0.1,
    }
  })

  const { scene: gltfScene } = useGLTF('./models/coffee_table.glb', {
    draco: true,
    meshOptimizer: true
  })

  const clone = useMemo(() => SkeletonUtils.clone(gltfScene), [gltfScene])

  const [ref] = useBox(() => ({
    type: 'Static',
    args: [1.5, 0.5, 1.5],
    position: [0, 0.25, 0],
    material: { friction: 0.5 }
  }))

  return (
    <group>
      <primitive 
        object={clone} 
        position={position}
        rotation={rotation}
        scale={scale}
      />
      <mesh ref={ref} castShadow receiveShadow>
        {/* Istniejąca geometria stolika */}
      </mesh>
    </group>
  )
})

// Pre-load modelu
useGLTF.preload('./models/coffee_table.glb', {
  draco: true,
  meshOptimizer: true
}) 