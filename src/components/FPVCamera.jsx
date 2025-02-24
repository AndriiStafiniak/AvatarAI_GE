import { useFrame, useThree } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import { Vector3 } from 'three'
import { useRef, useEffect } from 'react'
import { useSphere } from '@react-three/cannon'

export const FPVCamera = ({ speed = 5, sensitivity = 0.002 }) => {
  const { camera, gl } = useThree()
  const [ref, api] = useSphere(() => ({
    mass: 1,
    type: 'Dynamic',
    position: [0, 1.5, 3],
    args: [0.5],
    angularFactor: [0, 0, 0],
    fixedRotation: true,
  }))

  const velocity = useRef([0, 0, 0])
  useEffect(() => api.velocity.subscribe(v => (velocity.current = v)), [api])
  
  const [_, get] = useKeyboardControls()

  const isLocked = useRef(false)

  const mouseOffset = useRef({ x: 0, y: 0 })
  const targetRotation = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = gl.domElement
    
    const onPointerLockChange = () => {
      isLocked.current = document.pointerLockElement === canvas
    }
    
    const onClick = () => {
      canvas.requestPointerLock()
    }

    const onMouseMove = (e) => {
      if (isLocked.current) {
        mouseOffset.current.x -= e.movementX * sensitivity
        mouseOffset.current.y += e.movementY * sensitivity
        
        mouseOffset.current.y = Math.max(
          -Math.PI/2, 
          Math.min(
            Math.PI/2, 
            camera.rotation.x - e.movementY * sensitivity
          )
        )
      }
    }

    document.addEventListener('pointerlockchange', onPointerLockChange)
    canvas.addEventListener('click', onClick)
    canvas.addEventListener('mousemove', onMouseMove)

    return () => {
      document.removeEventListener('pointerlockchange', onPointerLockChange)
      canvas.removeEventListener('click', onClick)
      canvas.removeEventListener('mousemove', onMouseMove)
    }
  }, [camera, gl, sensitivity])

  useFrame((_, delta) => {
    // Sprawdź czy pole tekstowe czatu jest aktywne
    const chatInput = document.querySelector('.chat-input');
    if (chatInput && document.activeElement === chatInput) {
      api.velocity.set(0, velocity.current[1], 0); // Zatrzymaj ruch
      return;
    }

    targetRotation.current.y += (mouseOffset.current.x - targetRotation.current.y) * 0.1
    camera.rotation.y = targetRotation.current.y
    
    camera.rotation.x = 0

    const { forward, backward, left, right } = get()
    const direction = new Vector3()
    const frontVector = new Vector3(0, 0, (backward ? 1 : 0) - (forward ? 1 : 0))
    const sideVector = new Vector3((left ? 1 : 0) - (right ? 1 : 0), 0, 0)

    direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(speed * 2)
      .applyEuler(camera.rotation)

    api.velocity.set(direction.x, velocity.current[1], direction.z)
    ref.current.getWorldPosition(camera.position)
  })

  return null
} 