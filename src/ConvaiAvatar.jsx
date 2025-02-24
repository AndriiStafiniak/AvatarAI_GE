import React, { useEffect, useState, Suspense, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
import * as THREE from 'three'
import { useControls, folder } from 'leva'

const API_KEY = '2d12bd421e3af7ce47223bce45944908'
const AVATAR_ID = 'fe2da934-6aa4-11ef-8fba-42010a7be011'
const AVATAR_ID_2 = '881e4aac-50d5-11ef-9461-42010a7be011'
const AVATAR_ID_3 = '9ff38f44-437d-11ef-9187-42010a7be011'
const AVATAR_ID_4 = '2734589a-ef8f-11ef-9966-42010a7be016'
const CONVAI_API_URL = 'https://api.convai.com/character/get'

function AvatarModel({ modelUrl, isPlaying, currentAction, onLoad, ...props }) {
  const { scene } = useGLTF(modelUrl)
  
  // Dodajemy kontrolki Leva
  const controls = useControls({
    'Lewa Ręka': folder({
      leftShoulderX: { value: 0.45, min: -1, max: 1, step: 0.01 },
      leftShoulderY: { value: -0.01, min: -1, max: 1, step: 0.01 },
      leftShoulderZ: { value: -0.64, min: -1, max: 1, step: 0.01 },
      
      leftArmX: { value: 0.40, min: -1, max: 1, step: 0.01 },
      leftArmY: { value: -0.01, min: -1, max: 1, step: 0.01 },
      leftArmZ: { value:0.03, min: -1, max: 1, step: 0.01 },
      
      leftForeArmX: { value:0.16, min: -1, max: 1, step: 0.01 },
      leftForeArmY: { value: 0.1, min: -1, max: 1, step: 0.01 },
      leftForeArmZ: { value: 0.1, min: -1, max: 1, step: 0.01 },
    }),
    'Prawa Ręka': folder({
      rightShoulderX: { value: 0.65, min: -1, max: 1, step: 0.01 },
      rightShoulderY: { value: 0.10, min: -1, max: 1, step: 0.01 },
      rightShoulderZ: { value: 0.61, min: -1, max: 1, step: 0.01 },
      
      rightArmX: { value: 0.37, min: -1, max: 1, step: 0.01 },
      rightArmY: { value: 0, min: -1, max: 1, step: 0.01 },
      rightArmZ: { value: -0.15, min: -1, max: 1, step: 0.01 },
      
      rightForeArmX: { value: 0, min: -1, max: 1, step: 0.01 },
      rightForeArmY: { value: -0.1, min: -1, max: 1, step: 0.01 },
      rightForeArmZ: { value: -0.1, min: -1, max: 1, step: 0.01 },
    })
  })

  const clone = React.useMemo(() => {
    const clonedScene = SkeletonUtils.clone(scene)
    
    const findBone = (name) => {
      let bone = null
      clonedScene.traverse((object) => {
        if (object.isBone && object.name === name) {
          bone = object
        }
      })
      return bone
    }

    // Lewa strona
    const leftShoulder = findBone('LeftShoulder')
    const leftArm = findBone('LeftArm')
    const leftForeArm = findBone('LeftForeArm')

    if (leftShoulder) {
      leftShoulder.rotation.x = Math.PI * controls.leftShoulderX
      leftShoulder.rotation.y = Math.PI * controls.leftShoulderY
      leftShoulder.rotation.z = Math.PI * controls.leftShoulderZ
    }
    
    if (leftArm) {
      leftArm.rotation.x = Math.PI * controls.leftArmX
      leftArm.rotation.y = Math.PI * controls.leftArmY
      leftArm.rotation.z = Math.PI * controls.leftArmZ
    }
    
    if (leftForeArm) {
      leftForeArm.rotation.x = Math.PI * controls.leftForeArmX
      leftForeArm.rotation.y = Math.PI * controls.leftForeArmY
      leftForeArm.rotation.z = Math.PI * controls.leftForeArmZ
    }

    // Prawa strona
    const rightShoulder = findBone('RightShoulder')
    const rightArm = findBone('RightArm')
    const rightForeArm = findBone('RightForeArm')

    if (rightShoulder) {
      rightShoulder.rotation.x = Math.PI * controls.rightShoulderX
      rightShoulder.rotation.y = Math.PI * controls.rightShoulderY
      rightShoulder.rotation.z = Math.PI * controls.rightShoulderZ
    }
    
    if (rightArm) {
      rightArm.rotation.x = Math.PI * controls.rightArmX
      rightArm.rotation.y = Math.PI * controls.rightArmY
      rightArm.rotation.z = Math.PI * controls.rightArmZ
    }
    
    if (rightForeArm) {
      rightForeArm.rotation.x = Math.PI * controls.rightForeArmX
      rightForeArm.rotation.y = Math.PI * controls.rightForeArmY
      rightForeArm.rotation.z = Math.PI * controls.rightForeArmZ
    }

    return clonedScene
  }, [scene, controls])

  const groupRef = useRef()
  const mixerRef = useRef()
  const [talkingAnimation, setTalkingAnimation] = useState(null)

  useEffect(() => {
    const fbxLoader = new FBXLoader()
    fbxLoader.load(
      '/animation/avatar.fbx',
      (fbx) => {
        if (fbx.animations && fbx.animations.length > 0) {
          setTalkingAnimation(fbx.animations[0])
        }
      },
      undefined,
      (error) => console.error('Error loading FBX:', error)
    )
  }, [])

  useEffect(() => {
    if (clone && talkingAnimation) {
      mixerRef.current = new THREE.AnimationMixer(clone)
      const action = mixerRef.current.clipAction(talkingAnimation)
      
      if (isPlaying) {
        action.reset().fadeIn(0.5).play()
      } else {
        action.fadeOut(0.5)
      }

      return () => {
        mixerRef.current.stopAllAction()
      }
    }
  }, [clone, talkingAnimation, isPlaying])

  useEffect(() => {
    let frameId
    const animate = () => {
      frameId = requestAnimationFrame(animate)
      if (mixerRef.current) {
        mixerRef.current.update(0.016)
      }
    }
    
    animate()
    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId)
      }
    }
  }, [])

  return (
    <group ref={groupRef}>
      <primitive 
        object={clone} 
        {...props}
      />
    </group>
  )
}

export function ConvaiAvatar({ onLoad, ...props }) {
  const [modelUrl, setModelUrl] = useState(null)
  const [isTalking, setIsTalking] = useState(false)
  const [currentAction, setCurrentAction] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    const handleTalkingStart = () => setIsTalking(true)
    const handleTalkingEnd = () => setIsTalking(false)

    window.addEventListener('avatar-talking-start', handleTalkingStart)
    window.addEventListener('avatar-talking-end', handleTalkingEnd)

    return () => {
      window.removeEventListener('avatar-talking-start', handleTalkingStart)
      window.removeEventListener('avatar-talking-end', handleTalkingEnd)
    }
  }, [])

  useEffect(() => {
    async function fetchCharacterData() {
      try {
        const response = await fetch(CONVAI_API_URL, {
          method: 'POST',
          headers: {
            'CONVAI-API-KEY': API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ charID: AVATAR_ID })
        })

        if (!response.ok) throw new Error('Failed to fetch character')
        
        const data = await response.json()
        if (data?.model_details?.modelLink) {
          setModelUrl(data.model_details.modelLink)
        } else {
          throw new Error('Invalid model URL')
        }
      } catch (error) {
        console.error('Error:', error)
        setError(error)
      }
    }
    fetchCharacterData()
  }, [])

  useEffect(() => {
    if (modelUrl && !error) {
      useGLTF.preload('/reception_desk.glb')
      onLoad?.()
    }
  }, [modelUrl, error, onLoad])

  if (error) return null
  if (!modelUrl) return null

  return (
    <Suspense>
      <AvatarModel 
        modelUrl={modelUrl}
        isPlaying={isTalking}
        currentAction={currentAction}
        onLoad={onLoad}
        {...props} 
      />
    </Suspense>
  )
}

export function ConvaiAvatar2({ onLoad, ...props }) {
  const [modelUrl, setModelUrl] = useState(null)
  const [isTalking, setIsTalking] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchCharacterData() {
      try {
        const response = await fetch(CONVAI_API_URL, {
          method: 'POST',
          headers: {
            'CONVAI-API-KEY': API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ charID: AVATAR_ID_2 })
        })

        if (!response.ok) throw new Error('Failed to fetch character')
        
        const data = await response.json()
        if (data?.model_details?.modelLink) {
          setModelUrl(data.model_details.modelLink)
        } else {
          throw new Error('Invalid model URL')
        }
      } catch (error) {
        console.error('Error:', error)
        setError(error)
      }
    }
    fetchCharacterData()
  }, [])

  if (error) return null
  if (!modelUrl) return null

  return (
    <Suspense>
      <AvatarModel 
        modelUrl={modelUrl}
        isPlaying={isTalking}
        onLoad={onLoad}
        {...props} 
      />
    </Suspense>
  )
}

export function ConvaiAvatar3({ onLoad, ...props }) {
  const [modelUrl, setModelUrl] = useState(null)
  const [isTalking, setIsTalking] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchCharacterData() {
      try {
        const response = await fetch(CONVAI_API_URL, {
          method: 'POST',
          headers: {
            'CONVAI-API-KEY': API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ charID: AVATAR_ID_3 })
        })

        if (!response.ok) throw new Error('Failed to fetch character')
        
        const data = await response.json()
        if (data?.model_details?.modelLink) {
          setModelUrl(data.model_details.modelLink)
        } else {
          throw new Error('Invalid model URL')
        }
      } catch (error) {
        console.error('Error:', error)
        setError(error)
      }
    }
    fetchCharacterData()
  }, [])

  if (error) return null
  if (!modelUrl) return null

  return (
    <Suspense>
      <AvatarModel 
        modelUrl={modelUrl}
        isPlaying={isTalking}
        onLoad={onLoad}
        {...props} 
      />
    </Suspense>
  )
}

export function ConvaiAvatar4({ onLoad, ...props }) {
  const [modelUrl, setModelUrl] = useState(null)
  const [isTalking, setIsTalking] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchCharacterData() {
      try {
        const response = await fetch(CONVAI_API_URL, {
          method: 'POST',
          headers: {
            'CONVAI-API-KEY': API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ charID: AVATAR_ID_4 })
        })

        if (!response.ok) throw new Error('Failed to fetch character')
        
        const data = await response.json()
        if (data?.model_details?.modelLink) {
          setModelUrl(data.model_details.modelLink)
        } else {
          throw new Error('Invalid model URL')
        }
      } catch (error) {
        console.error('Error:', error)
        setError(error)
      }
    }
    fetchCharacterData()
  }, [])

  if (error) return null
  if (!modelUrl) return null

  return (
    <Suspense>
      <AvatarModel 
        modelUrl={modelUrl}
        isPlaying={isTalking}
        onLoad={onLoad}
        {...props} 
      />
    </Suspense>
  )
} 