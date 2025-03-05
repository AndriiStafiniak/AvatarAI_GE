import React, { Suspense, useState, Component, useCallback, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, PresentationControls, OrbitControls } from '@react-three/drei'
import { Leva, useControls } from 'leva'
import { ConvaiAvatar } from './ConvaiAvatar'
import { ConvaiAvatar2 } from './ConvaiAvatar'
import { ConvaiAvatar3 } from './ConvaiAvatar'
import { ConvaiAvatar4 } from './ConvaiAvatar'
import  ChatInterface  from './components/ChatInterface'
import Floor from './components/Floor'
import Wall from './components/Wall'
import Tv from './components/Tv'
import Zegar from './components/Zegar'
import ReceptionDesk from './components/ReceptionDesk'
import Vase from './components/Vase'
import './App.css'
import  Chair  from './components/Chair'
import CoffeeTable from './components/CoffeeTable'
import LoadingSpinner from './components/LoadingSpinner'

import { Physics } from '@react-three/cannon'
import Ceiling  from './components/Ceiling'
import { useCylinder } from '@react-three/cannon'
import Sign from './components/Sign'


const AVATAR_IDS = {
  1: 'fe2da934-6aa4-11ef-8fba-42010a7be011',
  2: '881e4aac-50d5-11ef-9461-42010a7be011',
  3: '9ff38f44-437d-11ef-9187-42010a7be011',
  4: '2734589a-ef8f-11ef-9966-42010a7be016'
};

// Usuń cały obiekt COLOR_PALETTES i zastąp go pustym
const COLOR_PALETTES = {}

// Dodaj stałą z nowymi etykietami
const LABELS = {
  1: 'TRANSFORMACJA ENERGETYCZNA FIRM',
  2: 'HUB ENERGETYCZNY I WODOROWY',
  3: 'POPRAWA EFEKTYWNOŚCI OZE',
  4: 'CZYSTE POWIETRZE'
}

// Optymalizacja ErrorBoundary z lepszą obsługą błędów
class Scene3DErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, errorDetails: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('3D Scene Error:', error, errorInfo)
    this.setState({ errorDetails: error.message })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h2>Error loading 3D scene</h2>
          <p>{this.state.errorDetails}</p>
          <button onClick={() => window.location.reload()}>
            Reload Application
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// Nowy komponent opakowujący awatar z fizyką
const AvatarWithPhysics = ({ children, onLoad, position, rotation }) => {
  const [ref] = useCylinder(() => ({
    mass: 0, // Mass 0 = obiekt statyczny
    position,
    rotation,
    args: [0.3, 0.3, 1.8, 16], // [radiusTop, radiusBottom, height, numSegments]
    material: {
      friction: 0.1,
      restitution: 0.2,
    },
  }))

  return (
    <group ref={ref} position={position} rotation={rotation}>
      {React.cloneElement(children, { onLoad })}
    </group>
  )
}

// Modyfikacja komponentu Scene, aby używał kontekstu
const Scene = ({ 
  activeScene,
  isAvatarLoaded, 
  onAvatarLoaded, 
  currentAction, 
  selectedAvatar, 
  isLoading,
  forceUpdate,
  avatars,
  visibleAvatar
}) => {
  return (
    <Canvas 
      shadows 
      style={{ background: '#646464' }}
      camera={{ 
        position: [0,1, 3],
        fov: 75,
        rotation: [0, Math.PI, 0]
      }}
      onCreated={({ gl, camera }) => {  
        gl.domElement.style.touchAction = 'none'
        camera.lookAt(0, 0, 0)
      }}
    >
      <OrbitControls />
      <Physics gravity={[0, -9.81, 0]}>
        <Leva hidden={true} />
        <Environment 
          preset="night"
          background
          blur={0.5}
          resolution={512}
          backgroundIntensity={1.5}
          environmentIntensity={1.5}
        />
        
        <PresentationControls
          global
          position={[0, -0.5, 0]}
          rotation={[0, 0, 0]}
          polar={[-0.2, 0.2]}
          azimuth={[-0.3, 0.3]}
          config={{ mass: 2, tension: 400 }}
          snap={{ mass: 3, tension: 200 }}
          speed={1.5}
          zoom={1}
        >
          <ambientLight intensity={2} color="#ffffff" />
          <directionalLight
            position={[15, 15, 15]}
            intensity={2}
            castShadow
            shadow-mapSize={[4096, 4096]}
            shadow-camera-far={100}
            shadow-camera-left={-30}
            shadow-camera-right={30}
            shadow-camera-top={30}
            shadow-camera-bottom={-30}
          />
          <pointLight 
            position={[-15, 10, -15]} 
            intensity={1.2}
            color="#ffeedd"
            decay={0.5}
          />
          <hemisphereLight
            intensity={0.5}
            color="#ffffff"
            groundColor="#404040"
          />
          <directionalLight
            position={[-15, 15, -15]}
            intensity={1}
            color="#ffffff"
          />
          <Suspense fallback={null}>
            <group position={[0, -1, 0]}>
              {!isLoading && avatars && (
                <>
                  {Object.entries(avatars).map(([id, avatar]) => {
                    return (
                      <group 
                        key={id} 
                        visible={Number(id) === visibleAvatar}
                      >
                        {React.cloneElement(avatar, {
                          visible: Number(id) === visibleAvatar
                        })}
                      </group>
                    )
                  })}
                </>
              )}
              <ReceptionDesk
                currentAction={currentAction}
                position={[0, 0, 0]}
                rotation={[0, Math.PI * 0, 0]}
                scale={1.1}
              />
              <Floor />
              <Ceiling />
              {activeScene === 1 && (
                <>
                  <Tv />
                  <Zegar />
                </>
              )}
              {activeScene === 2 && (
                <>
                  <Chair />
                  <CoffeeTable />
                </>
              )}
              {activeScene === 3 && (
                <>
                  <Vase />
                  <Zegar />
                </>
              )}
              {activeScene === 4 && (
                <>
                  <Tv />
                  <CoffeeTable />
                </>
              )}
              <Sign 
                position={[0, 3.5, -4.9]} 
                scale={1.2}
                activeScene={activeScene}
              />
              <Wall
                name="Left Wall"
                initialPosition={[-5, 2, 0]}
                initialSize={[0.2, 4, 10]}
              />
              <Wall
                name="Right Wall"
                initialPosition={[5, 2, 0]}
                initialSize={[0.2, 4, 10]}
              />
              <Wall
                name="Back Wall"
                initialPosition={[0, 2, -5]}
                initialSize={[10, 4, 0.2]}
              />
              <Wall
                name="Front Wall"
                initialPosition={[0, 2, 5]}
                initialSize={[10, 4, 0.2]}
              />
            </group>
          </Suspense>
        </PresentationControls>
      </Physics>
    </Canvas>
  )
}

// Nowy komponent dla przycisków awatara
function AvatarButtons({ selectedAvatar, isLoading, handleAvatarChange, setActiveScene }) {
  const handleAvatarClick = (num) => {
    handleAvatarChange(num)
    setActiveScene(num)
  }
  
  return [1, 2, 3, 4].map((num) => (
    <button
      key={num}
      onClick={() => handleAvatarClick(num)}
      style={{
        padding: '12px 24px',
        margin: '0 8px',
        backgroundColor: selectedAvatar === num ? '#2196F3' : '#666',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
        transition: 'all 0.3s ease',
        opacity: isLoading ? (selectedAvatar === num ? 1 : 0.3) : 1,
        pointerEvents: isLoading ? 'none' : 'auto'
      }}
    >
      {isLoading && selectedAvatar === num ? 'Ładowanie...' : LABELS[num]}
    </button>
  ));
}

const App = () => {
  const [currentAction, setCurrentAction] = useState('')
  const [activeScene, setActiveScene] = useState(1)
  const [isAvatarLoaded, setIsAvatarLoaded] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(0);
  const [avatars, setAvatars] = useState({})
  const [isLoadingAvatars, setIsLoadingAvatars] = useState(true)
  const [visibleAvatar, setVisibleAvatar] = useState(1)

  const handleAvatarChange = useCallback((avatarNumber) => {
    setIsAvatarLoaded(false)
    setSelectedAvatar(avatarNumber)
    setVisibleAvatar(avatarNumber)
    setActiveScene(avatarNumber)
    
    if (avatars[avatarNumber]) {
      setIsAvatarLoaded(true)
    }
  }, [avatars])

  const handleSceneChange = useCallback((sceneName) => {
    setForceUpdate(prev => prev + 1)
    
    // Automatyczna zmiana awatara w zależności od sceny
    const avatarMapping = {
      'TRANSFORMACJA ENERGETYCZNA': 1,
      'HUB ENERGETYCZNY I WODOROWY': 2,
      'POPRAWA EFEKTYWNOŚCI OZE': 3,
      'CZYSTE POWIETRZE': 4
    }
    
    const newAvatar = avatarMapping[sceneName] || 1
    setSelectedAvatar(newAvatar)
    setVisibleAvatar(newAvatar)
  }, [])

  // Funkcja do ładowania wszystkich awatarów
  useEffect(() => {
    const loadAvatars = async () => {
      try {
        const loadedAvatars = {
          1: <ConvaiAvatar onLoad={() => handleAvatarLoad(1)} />,
          2: <ConvaiAvatar2 onLoad={() => handleAvatarLoad(2)} />,
          3: <ConvaiAvatar3 onLoad={() => handleAvatarLoad(3)} />,
          4: <ConvaiAvatar4 onLoad={() => handleAvatarLoad(4)} />
        }
        setAvatars(loadedAvatars)
        setIsLoadingAvatars(false)
      } catch (error) {
        console.error('Error loading avatars:', error)
      }
    }

    loadAvatars()
  }, [])

  const handleAvatarLoad = (avatarId) => {
    if (avatarId === selectedAvatar) {
      setIsAvatarLoaded(true)
    }
  }

  return (
    <div className="app-container" style={{ 
      height: '100vh',
      width: '100vw',
      position: 'fixed',
      top: 0,
      left: 0 
    }}>
      <div className="scene-container">
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          display: 'flex',
          gap: '10px',
          padding: '10px',
          backgroundColor: 'rgba(0,0,0,0.5)',
          borderRadius: '8px',
          backdropFilter: 'blur(4px)'
        }}>
          <AvatarButtons 
            selectedAvatar={selectedAvatar} 
            isLoading={isLoading} 
            handleAvatarChange={handleAvatarChange}
            setActiveScene={setActiveScene}
          />
        </div>

        {!isAvatarLoaded && (
          <div className="loading-overlay">
            <LoadingSpinner progress={100} />
          </div>
        )}
        <Scene3DErrorBoundary>
          <Scene 
            key={`scene-${forceUpdate}`}
            activeScene={activeScene}
            isAvatarLoaded={isAvatarLoaded}
            onAvatarLoaded={() => setIsAvatarLoaded(true)}
            currentAction={currentAction}
            selectedAvatar={selectedAvatar}
            isLoading={isLoading}
            forceUpdate={forceUpdate}
            avatars={avatars}
            visibleAvatar={visibleAvatar}
          />
        </Scene3DErrorBoundary>
        {isAvatarLoaded && <ChatInterface characterId={AVATAR_IDS[selectedAvatar]} setActiveScene={setActiveScene} />}

        <SceneButtons setActiveScene={setActiveScene} />
      </div>
    </div>
  )
}

// Nowy komponent dla przycisków sceny
function SceneButtons({ setActiveScene }) {
  return (
    <div className="scene-buttons">
      <button onClick={() => setActiveScene(1)}>
        Transformacja Energetyczna
      </button>
      <button onClick={() => setActiveScene(2)}>
        Hub Energetyczny
      </button>
      <button onClick={() => setActiveScene(3)}>
        POPRAWA EFEKTYWNOŚCI OZE
      </button>
      <button onClick={() => {
        const randomText = "TEST " + Math.floor(Math.random() * 1000);
        setActiveScene(randomText);
      }}>
        Test Losowego Tekstu
      </button>
    </div>
  );
}

export default App
