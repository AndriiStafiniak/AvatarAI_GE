import { useGLTF } from '@react-three/drei'
import { useControls } from 'leva'
import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useBox } from '@react-three/cannon'

export function Tv() {
  const { scene } = useGLTF('./models/Tv.glb')
  const tvRef = useRef()
  const videoRef = useRef()
  const materialRef = useRef()

  const { position, rotation, scale } = useControls('TV', {
    position: {
      value: [3, 2, -2.2],
      step: 0.1,
    },
    rotation: {
      value: [0, Math.PI * 1.5 , 0],
      step: 0.01,
    },

    scale: {
      value: 1.2,
      min: 0.1,
      max: 5,
      step: 0.1,
    }
  })

  const debugControls = useControls('TV Screen Debug', {
    visible: {
      value: true,
      onChange: (v) => {
        if (materialRef.current) {
          materialRef.current.visible = v
        }
      }
    },
    rotateUV: {
      value: Math.PI/2,
      min: 0,
      max: Math.PI * 2,
      step: 0.1,
      onChange: (v) => {
        if (materialRef.current && materialRef.current.map) {
          materialRef.current.map.rotation = v
          materialRef.current.map.needsUpdate = true
        }
      }
    },
    flipX: {
      value: true,
      onChange: (v) => {
        if (materialRef.current && materialRef.current.map) {
          materialRef.current.map.repeat.x = v ? -1 : 1
          materialRef.current.map.offset.x = v ? 1 : 0
          materialRef.current.map.needsUpdate = true
        }
      }
    },
    flipY: {
      value: true,
      onChange: (v) => {
        if (materialRef.current && materialRef.current.map) {
          materialRef.current.map.repeat.y = v ? -1 : 1
          materialRef.current.map.needsUpdate = true
        }
      }
    },
    offsetX: {
      value: 0,
      min: -1,
      max: 1,
      step: 0.1,
      onChange: (v) => {
        if (materialRef.current && materialRef.current.map) {
          materialRef.current.map.offset.x = v
          materialRef.current.map.needsUpdate = true
        }
      }
    },
    offsetY: {
      value: 1,
      min: -1,
      max: 1,
      step: 0.1,
      onChange: (v) => {
        if (materialRef.current && materialRef.current.map) {
          materialRef.current.map.offset.y = v
          materialRef.current.map.needsUpdate = true
        }
      }
    }
  })

  const [ref] = useBox(() => ({
    type: 'Static',
    args: [1.5, 0.5, 0.1],
    position: [0, 0.5, -2],
    material: { friction: 0.5 }
  }))

  useEffect(() => {
    const timeoutRef = setTimeout(() => {
      const screen = scene.getObjectByName('Ekran')
      if (!screen) {
        console.error('Could not find TV screen mesh named "Ekran"')
        return
      }

      const video = document.createElement('video')
      video.src = '/videos/logo_film.mp4'
      video.crossOrigin = 'anonymous'
      video.loop = true
      video.muted = true
      video.playsInline = true
      video.preload = 'auto'

      const videoTexture = new THREE.VideoTexture(video)
      videoTexture.minFilter = THREE.LinearFilter
      videoTexture.magFilter = THREE.LinearFilter
      videoTexture.format = THREE.RGBFormat
      videoTexture.generateMipmaps = false
      
      videoTexture.repeat.x = -1
      videoTexture.offset.x = 1
      videoTexture.wrapS = THREE.RepeatWrapping

      const material = new THREE.MeshBasicMaterial({
        map: videoTexture,
        side: THREE.DoubleSide,
        toneMapped: false,
      })

      screen.material = material
      materialRef.current = material

      const playVideo = () => {
        video.play().catch(error => {})
      }

      if (video.readyState >= 3) {
        playVideo()
      } else {
        video.addEventListener('loadeddata', playVideo, { once: true })
      }

      videoRef.current = video
    }, 5000)

    return () => {
      clearTimeout(timeoutRef)
      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.src = ''
        videoRef.current.load()
        videoRef.current.remove()
        if (materialRef.current) {
          materialRef.current.map?.dispose()
          materialRef.current.dispose()
        }
      }
    }
  }, [scene])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        videoRef.current?.pause()
      } else {
        videoRef.current?.play().catch(console.error)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return (
    <group 
      ref={tvRef} 
      position={position} 
      rotation={new THREE.Euler(rotation[0], rotation[1], rotation[2])} 
      scale={scale}
    >
      <primitive object={scene} />
      <mesh ref={ref} castShadow receiveShadow>
        {/* Istniejąca geometria TV */}
      </mesh>
    </group>
  )
}

// Pre-load the model
useGLTF.preload('./models/Tv.glb') 