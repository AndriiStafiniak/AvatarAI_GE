import { useMemo } from 'react'
import { Grid } from '@react-three/drei'

function Ceiling() {
  // Prosta konfiguracja podstawowej siatki
 

  // Generowanie świateł biurowych
  const officeLights = useMemo(() => {
    const lights = []
    const spacing = 14 // Odstęp między lampami
    const rows = 3
    const cols = 3

    for (let x = -cols/2; x <= cols/2; x++) {
      for (let z = -rows/2; z <= rows/2; z++) {
        lights.push(
          <mesh 
            key={`light-${x}-${z}`}
            position={[x * spacing, 0.1, z * spacing]}
            rotation={[-Math.PI + (Math.random()*0.1-0.05), 0, 0]}
          >
            <boxGeometry args={[3.5, 0.1, 1.2]} />
            <meshStandardMaterial 
              color="#ffffff"
              emissive="#fff7e6"
              emissiveIntensity={2}
              metalness={0.1}
              roughness={0.7}
            />
          </mesh>
        )
      }
    }
    return lights
  }, [])

  return (
    <group position={[2, 4, 0]} rotation={[Math.PI, 0, 0]}>
    
      
      {/* System oświetlenia */}
      <group position={[0, -0.2, 0]}>
        {officeLights}
      </group>
    </group>
  )
}

export default Ceiling