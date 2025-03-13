import React, { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import { useControls } from 'leva'
import { useBox } from '@react-three/cannon'

export default function ChairOffice(props) {
  // Leva controls for the office chair
  const { position, rotation, scale } = useControls('ChairOffice', {
    position: {
      value: [3, 0.07, -1],
      step: 0.1,
    },
    rotation: {
      value: [0, -Math.PI/2.2, 0],
      step: 0.01,
    },
    scale: {
      value: 0.3,
      min: 0.1,
      max: 2,
      step: 0.1,
    }
  })

  const { scene: gltfScene } = useGLTF('/models/office_chair.glb', {
    draco: true,
    meshOptimizer: true
  })

  const clone = useMemo(() => SkeletonUtils.clone(gltfScene), [gltfScene])

  const [ref] = useBox(() => ({
    type: 'Static',
    args: [0.6, 1.2, 0.6], // Collision dimensions for the office chair
    position: position,
    rotation: rotation,
    material: { friction: 0.2 }
  }))

  return (
    <group {...props}>
      <primitive 
        object={clone} 
        position={position}
        scale={scale}
        rotation={rotation}
        castShadow
        receiveShadow
      />
      <mesh ref={ref} visible={false} />
    </group>
  )
}

useGLTF.preload('/models/office_chair.glb', {
  draco: true,
  meshOptimizer: true
}) 