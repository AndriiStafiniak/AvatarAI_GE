import React, { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import { useControls } from 'leva'
import { useBox } from '@react-three/cannon'

export default function RollUpDisplay(props) {
  // Kontrolki Leva dla roll-up display
  const { position, rotation, scale } = useControls('RollUpDisplay', {
    position: {
      value: [-5, 0, 4],
      step: 0.1,
    },
    rotation: {
      value: [0, -Math.PI/1.7, 0],
      step: 0.01,
    },
    scale: {
      value: 5,
      min: 0.1,
      max: 10,
      step: 0.1,
    }
  })

  const { scene: gltfScene } = useGLTF('/models/roll-up_display.glb', {
    draco: true,
    meshOptimizer: true
  })

  const clone = useMemo(() => SkeletonUtils.clone(gltfScene), [gltfScene])

  const [ref] = useBox(() => ({
    type: 'Static',
    args: [1, 2, 0.1], // Płaska kolizja dla ekranu
    position: [1.5, 1, 2.5],
    material: { friction: 0.1 }
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

useGLTF.preload('/models/roll-up_display.glb', {
  draco: true,
  meshOptimizer: true
}) 