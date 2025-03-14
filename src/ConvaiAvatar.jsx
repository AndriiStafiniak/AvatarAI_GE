import React, { useEffect, useState, Suspense, useRef, useMemo } from 'react'
import { useGLTF, Html } from '@react-three/drei'
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

// Na początku pliku dodaj stan globalny dla aktywnego awatara
let activeAvatarType = 1;

// Zmodyfikuj funkcję emitAvatarTypeChange
const emitAvatarTypeChange = (type) => {
  activeAvatarType = type;
  
  // First hide current avatar and show loading
  window.dispatchEvent(new CustomEvent('avatar-hide'));
  window.dispatchEvent(new CustomEvent('scene-loading-start'));
  
  // After loading is shown, change avatar
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('avatar-type-change', { detail: type }));
    
    // After avatar is loaded, hide loading and show avatar
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('scene-loading-end'));
      window.dispatchEvent(new CustomEvent('avatar-show'));
    }, 500);
  }, 100);
}

const LoadingDots = () => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return dots;
};

const LoadingSpinner = () => {
  return (
    <Html center>
      <div className="loading-spinner">
        <div className="spinner"></div>
        <div className="loading-text">Loading{LoadingDots()}</div>
      </div>
    </Html>
  );
};

function AvatarModel({ modelUrl, onLoad, visible, avatarType, onReady, ...props }) {
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

  const [isVisible, setIsVisible] = useState(false)
  const [isSceneLoading, setIsSceneLoading] = useState(true)

  useEffect(() => {
    const handleHide = () => setIsVisible(false);
    const handleShow = () => setIsVisible(true);
    const handleLoadingStart = () => setIsSceneLoading(true);
    const handleLoadingEnd = () => setIsSceneLoading(false);

    window.addEventListener('avatar-hide', handleHide);
    window.addEventListener('avatar-show', handleShow);
    window.addEventListener('scene-loading-start', handleLoadingStart);
    window.addEventListener('scene-loading-end', handleLoadingEnd);

    return () => {
      window.removeEventListener('avatar-hide', handleHide);
      window.removeEventListener('avatar-show', handleShow);
      window.removeEventListener('scene-loading-start', handleLoadingStart);
      window.removeEventListener('scene-loading-end', handleLoadingEnd);
    };
  }, []);

  // Initial loading
  useEffect(() => {
    setIsSceneLoading(true);
    setIsVisible(false);
    
    const timer = setTimeout(() => {
      setIsSceneLoading(false);
      setIsVisible(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    useGLTF.preload('/models/avatar1.glb')
  }, [])

  // Handle viseme updates
  useEffect(() => {
    const handleVisemeUpdate = (event) => {
      const visemeData = event.detail
      if (clone && visemeData) {
        clone.traverse((child) => {
          if (child.isMesh && child.morphTargetInfluences) {
            visemeData.forEach((weight, index) => {
              if (index < child.morphTargetInfluences.length) {
                child.morphTargetInfluences[index] = weight
              }
            })
          }
        })
      }
    }

    window.addEventListener('viseme-update', handleVisemeUpdate)
    return () => window.removeEventListener('viseme-update', handleVisemeUpdate)
  }, [clone])

  // Reset morph targets when audio stops
  useEffect(() => {
    const handleTalkingEnd = () => {
      if (clone) {
        clone.traverse((child) => {
          if (child.isMesh && child.morphTargetInfluences) {
            child.morphTargetInfluences.fill(0)
          }
        })
      }
    }

    window.addEventListener('avatar-talking-end', handleTalkingEnd)
    return () => window.removeEventListener('avatar-talking-end', handleTalkingEnd)
  }, [clone])

  // Dodaj nowe hooki do stanu lipsync
  const [lipsyncData, setLipsyncData] = useState([])
  const [currentVisemeFrame, setCurrentVisemeFrame] = useState(0)
  const timerRef = useRef(0)
  const animationRef = useRef()

  // Dodaj efekt do animacji lipsync
  useEffect(() => {
    const animate = (timestamp) => {
      if (lipsyncData.length > 0) {
        timerRef.current += 16/1000 // delta time w sekundach
        
        const frame = Math.floor(timerRef.current * 100)
        setCurrentVisemeFrame(frame)

        if (frame >= lipsyncData.length) {
          resetMorphs()
          setLipsyncData([])
          timerRef.current = 0
        } else {
          applyVisemeFrame(frame)
        }
      }
      animationRef.current = requestAnimationFrame(animate)
    }
    
    animationRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationRef.current)
  }, [lipsyncData])

  // Funkcja do aplikowania konkretnej klatki animacji
  const applyVisemeFrame = (frame) => {
    if (!window.visemeData || frame >= window.visemeData.length) return;
    
    clone.traverse((child) => {
      if (child.isMesh && child.morphTargetInfluences) {
        for (let i = 0; i < 15; i++) {
          child.morphTargetInfluences[i] = window.visemeData[frame][i] || 0;
        }
      }
    });
  }

  // Funkcja do resetowania morph targets
  const resetMorphs = () => {
    clone.traverse((child) => {
      if (child.isMesh && child.morphTargetInfluences) {
        for (let i = 0; i < 15; i++) {
          child.morphTargetInfluences[i] = 0
        }
      }
    })
  }

  // Dodaj efekt do śledzenia zmian w danych lipsync
  useEffect(() => {
    const handleVisemeUpdate = () => {
      if (window.visemeData) {
        setLipsyncData([...window.visemeData])
        timerRef.current = 0
      }
    }
    
    window.addEventListener('viseme-data-update', handleVisemeUpdate)
    return () => window.removeEventListener('viseme-data-update', handleVisemeUpdate)
  }, [])

  useEffect(() => {
    if (clone) {
      clone.traverse((child) => {
        if (child.isMesh) {
          // Usunięto console.log pokazujący morph targets
        }
      })
    }
  }, [clone])

  useEffect(() => {
    if (avatarType && visible) {
      emitAvatarTypeChange(avatarType);
    }
  }, [avatarType, visible]);

  useEffect(() => {
    if (onReady && typeof onReady === 'function') {
      onReady(false)
      
      // Czekamy na załadowanie modelu i sceny
      const timer = setTimeout(() => {
        if (clone && !isSceneLoading && visible) {
          console.log('Avatar model ready:', avatarType)
          onReady(true)
        }
      }, 2000) // Dajemy więcej czasu na załadowanie
      
      return () => clearTimeout(timer)
    }
  }, [clone, isSceneLoading, visible, avatarType, onReady])

  if (isSceneLoading) {
    return (
      <group visible={visible}>
        <LoadingSpinner />
      </group>
    );
  }

  return (
    <group visible={visible && isVisible} ref={groupRef}>
      <primitive 
        object={clone} 
        {...props}
      />
      {clone.nodes && (
        <Lipsync model={clone} />
      )}
    </group>
  )
}

export function ConvaiAvatar({ onLoad, visible, onReady, ...props }) {
  const [modelUrl, setModelUrl] = useState(null)
  const [error, setError] = useState(null)
  const [shouldLoad, setShouldLoad] = useState(false)
  const [avatarType, setAvatarType] = useState(1)

  useEffect(() => {
    if (visible) {
      setShouldLoad(true)
    }
  }, [visible])

  useEffect(() => {
    if (!modelUrl) {
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
            setAvatarType(1)
            if (visible) {
              emitAvatarTypeChange(1)
            }
          } else {
            throw new Error('Invalid model URL')
          }
        } catch (error) {
          setError(error)
        }
      }
      fetchCharacterData()
    }
  }, [modelUrl, visible])

  useEffect(() => {
    if (modelUrl && !error) {
      useGLTF.preload('/reception_desk.glb')
      onLoad?.()
    }
  }, [modelUrl, error, onLoad])

  useEffect(() => {
    useGLTF.preload('/models/avatar1.glb')
  }, [])

  if (error) return null
  if (!modelUrl) return null

  if (!shouldLoad) return null

  return (
    <Suspense>
      <AvatarModel 
        modelUrl={modelUrl}
        onLoad={onLoad}
        visible={visible}
        avatarType={avatarType}
        onReady={onReady}
        {...props} 
      />
    </Suspense>
  )
}

export function ConvaiAvatar2({ onLoad, visible = false, onReady, ...props }) {
  const [modelUrl, setModelUrl] = useState(null)
  const [error, setError] = useState(null)
  const [shouldLoad, setShouldLoad] = useState(false)
  const [avatarType, setAvatarType] = useState(2)

  useEffect(() => {
    if (visible) {
      setShouldLoad(true)
    }
  }, [visible])

  useEffect(() => {
    if (!modelUrl) {
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
            setAvatarType(2)
            if (visible) {
              emitAvatarTypeChange(2)
            }
          } else {
            throw new Error('Invalid model URL')
          }
        } catch (error) {
          setError(error)
        }
      }
      fetchCharacterData()
    }
  }, [modelUrl, visible])

  useEffect(() => {
    if (modelUrl && !error) {
      useGLTF.preload('/reception_desk.glb')
      onLoad?.()
    }
  }, [modelUrl, error, onLoad])

  useEffect(() => {
    useGLTF.preload('/models/avatar1.glb')
  }, [])

  if (error) return null
  if (!modelUrl) return null

  if (!shouldLoad) return null

  return (
    <Suspense>
      <AvatarModel 
        modelUrl={modelUrl}
        onLoad={onLoad}
        visible={visible}
        avatarType={avatarType}
        onReady={onReady}
        {...props} 
      />
    </Suspense>
  )
}

export function ConvaiAvatar3({ onLoad, visible = false, onReady, ...props }) {
  const [modelUrl, setModelUrl] = useState(null)
  const [error, setError] = useState(null)
  const [shouldLoad, setShouldLoad] = useState(false)
  const [avatarType, setAvatarType] = useState(3)

  useEffect(() => {
    if (visible) {
      setShouldLoad(true)
    }
  }, [visible])

  useEffect(() => {
    if (!modelUrl) {
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
            setAvatarType(3)
            if (visible) {
              emitAvatarTypeChange(3)
            }
          } else {
            throw new Error('Invalid model URL')
          }
        } catch (error) {
          setError(error)
        }
      }
      fetchCharacterData()
    }
  }, [modelUrl, visible])

  useEffect(() => {
    if (modelUrl && !error) {
      useGLTF.preload('/reception_desk.glb')
      onLoad?.()
    }
  }, [modelUrl, error, onLoad])

  useEffect(() => {
    useGLTF.preload('/models/avatar1.glb')
  }, [])

  if (error) return null
  if (!modelUrl) return null

  if (!shouldLoad) return null

  return (
    <Suspense>
      <AvatarModel 
        modelUrl={modelUrl}
        onLoad={onLoad}
        visible={visible}
        avatarType={avatarType}
        onReady={onReady}
        {...props} 
      />
    </Suspense>
  )
}

export function ConvaiAvatar4({ onLoad, visible = false, onReady, ...props }) {
  const [modelUrl, setModelUrl] = useState(null)
  const [error, setError] = useState(null)
  const [shouldLoad, setShouldLoad] = useState(false)
  const [avatarType, setAvatarType] = useState(4)

  useEffect(() => {
    if (visible) {
      setShouldLoad(true)
    }
  }, [visible])

  useEffect(() => {
    if (!modelUrl) {
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
            setAvatarType(4)
            if (visible) {
              emitAvatarTypeChange(4)
            }
          } else {
            throw new Error('Invalid model URL')
          }
        } catch (error) {
          setError(error)
        }
      }
      fetchCharacterData()
    }
  }, [modelUrl, visible])

  useEffect(() => {
    if (modelUrl && !error) {
      useGLTF.preload('/reception_desk.glb')
      onLoad?.()
    }
  }, [modelUrl, error, onLoad])

  useEffect(() => {
    useGLTF.preload('/models/avatar1.glb')
  }, [])

  if (error) return null
  if (!modelUrl) return null

  if (!shouldLoad) return null

  return (
    <Suspense>
      <AvatarModel 
        modelUrl={modelUrl}
        onLoad={onLoad}
        visible={visible}
        avatarType={avatarType}
        onReady={onReady}
        {...props} 
      />
    </Suspense>
  )
} 