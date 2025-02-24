import React, { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'

export const ReceptionDesk = React.memo(({ currentAction, position, rotation, scale }) => {
  const { scene: gltfScene } = useGLTF('./models/resize_reception.glb', {
    draco: true,
    meshOptimizer: true
  })

  const clone = useMemo(() => SkeletonUtils.clone(gltfScene), [gltfScene])

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive 
        object={clone} 
        position={[0, 0, 0.7]}
      />
    </group>
  )
})

// Pre-load modelu z optymalizacjami
useGLTF.preload('./models/resize_reception.glb', {
  draco: true,
  meshOptimizer: true
}) 