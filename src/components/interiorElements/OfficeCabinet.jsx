import React, { useMemo, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';
import { useControls } from 'leva';
import { useBox } from '@react-three/cannon';
import { MeshStandardMaterial } from 'three';

export default function OfficeCabinet(props) {
  // Kontrolki Leva dla szafki biurowej
  const { position, rotation, scale } = useControls('OfficeCabinet', {
    position: {
      value: [2.4, 1.17, -0.5], // Domyślna pozycja
      step: 0.1,
    },
    rotation: {
      value: [0, Math.PI, 0], // Domyślna rotacja
      step: 0.01,
    },
    scale: {
      value: 0.2, // Domyślna skala
      min: 0,
      max: 2,
      step: 0.1,
    }
  });

  const { scene: gltfScene } = useGLTF('/models/file_cabinet.glb', {
    draco: true,
    meshOptimizer: true
  });

  const clone = useMemo(() => SkeletonUtils.clone(gltfScene), [gltfScene]);

//   useEffect(() => {
//     clone.traverse((child) => {
//       if (child.isMesh) {
//         child.material = new MeshStandardMaterial({ color: '#5E5E5E' });
//       }
//     });
//   }, [clone]);

  const [ref] = useBox(() => ({
    type: 'Static',
    args: [1, 1, 1], // Wymiary kolizji dla szafki biurowej
    position: position,
    rotation: rotation,
    material: { friction: 0.5 }
  }));

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
  );
}

useGLTF.preload('/models/file_cabinet.glb');

