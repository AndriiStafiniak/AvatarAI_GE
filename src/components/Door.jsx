import { useBox } from '@react-three/cannon'

const [ref] = useBox(() => ({
  type: 'Static',
  args: [1.2, 2.5, 0.5],
  position: [-4.95, 1.1, 2.9],
  onCollide: (e) => {
    if(e.body.userData?.isPlayer) {
      const currentZ = e.body.position.z
      const teleportOffset = currentZ > 2.9 ? -10 : 10
      e.body.position.setZ(currentZ + teleportOffset)
    }
  }
})) 