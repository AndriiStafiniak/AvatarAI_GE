import { Text } from '@react-three/drei'
import { useControls } from 'leva'

export default function Sign() {
  const { position, scale, color } = useControls('Sign', {
    position: { value: [0, 3.5, -2.3], step: 0.1 },
    scale: { value: 1, min: 0.5, max: 3 },
    color: { value: '#1a1a1a' }
  })

  return (
    <Text
      position={position}
      rotation={[Math.PI, Math.PI, Math.PI]}
      fontSize={0.4}
      color={color}
      anchorX="center"
      anchorY="middle"
      scale={scale}
    >
      TRANSFORMACJA ENERGETYCZNA
    </Text>
  )
} 