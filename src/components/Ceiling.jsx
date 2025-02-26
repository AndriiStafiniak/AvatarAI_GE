import { useMemo } from 'react'


export default function Ceiling({ color = '#606060' }) {
  return (
    <group position={[0, 4.02, 0]}>
      {/* Główna płyta sufitu */}
      <mesh receiveShadow>
        <boxGeometry args={[10, 0.2, 10]} /> {/* Dopasowane do rozmiaru podłogi 25x25 */}
        <meshStandardMaterial 
          color={color}
          metalness={0.1}
          roughness={0.7}
        />
      </mesh>

      {/* System oświetlenia */}
      <group position={[0, -0.1, 0]}>
        {useMemo(() => {
          const lights = []
          const spacing = 2
          const rows = 1
          const cols = 1

          for (let x = -cols/2; x <= cols/2; x++) {
            for (let z = -rows/2; z <= rows/2; z++) {
              lights.push(
                <mesh 
                  key={`light-${x}-${z}`}
                  position={[x * spacing, 0, z * spacing]}
                >
                  <boxGeometry args={[3.5, 0.1, 1.2]} />
                  <meshStandardMaterial 
                    color="#ffffff"
                    emissive="#fff7e6"
                    emissiveIntensity={1.5}
                    metalness={0.05}
                    roughness={0.8}
                  />
                </mesh>
              )
            }
          }
          return lights
        }, [])}
      </group>
    </group>
  )
}

 