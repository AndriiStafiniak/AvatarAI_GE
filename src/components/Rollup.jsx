import React, { useMemo, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import { useControls } from 'leva'
import { useBox } from '@react-three/cannon'

export const Rollup = React.memo(() => {
  // Kontrolki Leva dla rollupu z dziewczyną
  const { position, rotation, scale } = useControls('Rollup', {
    position: {
      value: [-2, 0, 0.7],
      step: 0.1,
    },
    rotation: {
      value: [0, Math.PI * 0.3, 0],
      step: 0.01,
    },
    scale: {
      value: 1,
      min: 0.1,
      max: 2,
      step: 0.1,
    }
  })

  const { scene: gltfScene } = useGLTF('./models/rollupNew.glb', {
    draco: true,
    meshOptimizer: true
  })

  const clone = useMemo(() => SkeletonUtils.clone(gltfScene), [gltfScene])

  const [ref] = useBox(() => ({
    type: 'Static',
    args: [0.8, 1.2, 0.8],
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
        rotation={rotation}
        scale={scale}
      />
      <mesh ref={ref} castShadow receiveShadow>
        {/* Istniejąca geometria rollupu */}
      </mesh>
    </group>
  )
})

// Pre-load modelu
useGLTF.preload('./models/rollupNew.glb', {
  draco: true,
  meshOptimizer: true
}) 