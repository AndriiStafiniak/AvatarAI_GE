import React from 'react'
import { useBox } from '@react-three/cannon'
import { useControls } from 'leva'

export function Wall({ name, initialPosition = [0, 0, 0], initialSize = [1, 1, 1], initialColor = '#a0a0a0', ...props }) {
  const controls = useControls(name || 'Wall', {
    position: { value: initialPosition, label: 'Position' },
    size: { value: initialSize, label: 'Size' },
    color: { value: initialColor, label: 'Color' },
    visible: { value: true, label: 'Visible' }
  })

  const [ref] = useBox(() => ({
    type: 'Static',
    args: controls.size,
    position: controls.position,
    material: { friction: 0.5 },
    ...props
  }))

  if (!controls.visible) return null

  return (
    <mesh ref={ref} receiveShadow>
      <boxGeometry args={controls.size} />
      <meshStandardMaterial color={controls.color} />
    </mesh>
  )
} 