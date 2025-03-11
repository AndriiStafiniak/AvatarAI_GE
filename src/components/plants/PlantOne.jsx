import React, { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import { useControls } from 'leva'
import { useBox } from '@react-three/cannon'

export default function PlantOne(props) {
  // Kontrolki Leva dla rośliny
  const { position, rotation, scale } = useControls('PlantOne', {
    position: {
      value: [-2.1, 0.01, -0.2],
      step: 0.1,
    },
    rotation: {
      value: [0, -Math.PI/4, 0],
      step: 0.01,
    },
    scale: {
      value: 0.02,
      min: 0.0001,
      max: 2,
      step: 0.1,
    }
  })

  const { scene: gltfScene } = useGLTF('/plants/plants_one.glb', {
    draco: true,
    meshOptimizer: true
  })

  const clone = useMemo(() => SkeletonUtils.clone(gltfScene), [gltfScene])

  const [ref] = useBox(() => ({
    type: 'Static',
    args: [0.5, 1, 0.5], // Większa skala kolizji dla rośliny
    position: [1.5, 0.5, -1.8],
    material: { friction: 0.3 }
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

useGLTF.preload('/plants/plants_one.glb', {
  draco: true,
  meshOptimizer: true
}) 