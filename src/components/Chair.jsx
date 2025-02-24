import React, { useMemo, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import { useControls } from 'leva'
import { useBox } from '@react-three/cannon'

export const Chair = React.memo(({ 
  currentAction,
}) => {
  // Kontrolki Leva dla wózka
  const { position, rotation, scale } = useControls('Chair', {
    position: {
      value: [3.1, 0.0,-0.7],
      step: 0.1,
    },
    rotation: {
      value: [0, -Math.PI / 4.5, 0],
      step: 0.01,
    },
    scale: {
      value: 1,
      min: 0.1,
      max: 5,
      step: 0.1,
    }
  })

  const { scene: gltfScene } = useGLTF('./models/resized_chair.glb', {
    draco: true,
    meshOptimizer: true
  })

  const clone = useMemo(() => SkeletonUtils.clone(gltfScene), [gltfScene])

  const [ref] = useBox(() => ({
    type: 'Static',
    args: [0.5, 1, 0.5],
    position: position,
    material: { friction: 0.5 }
  }))

  useEffect(() => {
    if(ref.current) {
      ref.current.position.set(...position)
    }
  }, [position, ref])

  return (
    <group>
      <primitive 
        object={clone} 
        position={position}
        scale={scale}
        rotation={rotation}
      />
      <mesh ref={ref} castShadow receiveShadow>
        {/* Istniejąca geometria krzesła */}
      </mesh>
    </group>
  )
})

// Pre-load modelu wózka
useGLTF.preload('./models/resized_chair.glb', {
  draco: true,
  meshOptimizer: true
}) 