import React, { Suspense, useState, Component, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, PresentationControls, OrbitControls } from '@react-three/drei'
import { Leva, useControls } from 'leva'
import { ConvaiContext } from './contexts/ConvaiContext'
import { LoadingSpinner } from './components/LoadingSpinner'
// Importujemy komponenty bezpośrednio zamiast lazy loading
import { ConvaiAvatar, ConvaiAvatar2, ConvaiAvatar3, ConvaiAvatar4 } from './ConvaiAvatar'
import { ChatInterface } from './components/ChatInterface'
import { Floor } from './components/Floor'
import { Wall } from './components/Wall'
import { Tv } from './components/Tv'
import { Zegar } from './components/Zegar'
import { ReceptionDesk } from './components/ReceptionDesk'
import { Vase } from './components/Vase'
import './App.css'
import { Chair } from './components/Chair'
import { CoffeeTable } from './components/CoffeeTable'
import { Rollup } from './components/Rollup'
import { KeyboardControls } from '@react-three/drei'
import { FPVCamera } from './components/FPVCamera'
import { Physics } from '@react-three/cannon'
import  Ceiling from './components/Ceiling'
import { useCylinder } from '@react-three/cannon'


const AVATAR_ID = 'fe2da934-6aa4-11ef-8fba-42010a7be011'

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

// Optymalizacja głównego komponentu sceny
const Scene = React.memo(({ isAvatarLoaded, onAvatarLoaded, currentAction, selectedAvatar }) => {
  // Stały układ losowy wygenerowany raz na zawsze
  const initialPositions = {
    insideLeft: [-18.2, 2, 8.7],
    insideRight: [12.9, 2, -5.3],
    frontLeft: [-3, 2, 9],
    frontRight: [25, 2, -13],
    partition1: [-10, 2, -11],
    partition2: [3.1, 2, 12],
    partition3Left: [19.7, 2, 10],
    partition3Right: [3.4, 2,12],
    corner1: [18, 2, 19.8],
    corner2: [-12.6, 2, 19.4]
  };

  return (
    <Canvas 
      shadows 
      style={{ background: '#646464' }}
      camera={{ 
        position: [0, 1.5, 3],  // X: 0, Y: 1.5m (wysokość osoby), Z: 3m od przodu
        fov: 75,                // Naturalne pole widzenia
        rotation: [0, Math.PI, 0] // Patrzymy w kierunku ujemnej osi Z
      }}
      onCreated={({ gl, camera }) => {
        gl.domElement.style.touchAction = 'none'
        camera.lookAt(0, 1, 0)  // Celujemy na wysokości 1m (środek awatara)
      }}
    >
      <OrbitControls />
      <Physics gravity={[0, -9.81, 0]}>
        {/* <FPVCamera 
          speed={5} 
          sensitivity={0.0020}
        /> */}
        <Environment 
          preset="night"
          background
          blur={0.5}
          resolution={512}
          backgroundIntensity={0.6}
          environmentIntensity={0.8}
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
          <ambientLight intensity={1.2} color="#ffffff" />
          <directionalLight
            position={[15, 15, 15]}
            intensity={1.5}
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
            intensity={0.8} 
            color="#ffeedd"
            decay={0.5}
          />
          <hemisphereLight
            intensity={0.3}
            color="#ffffff"
            groundColor="#404040"
          />
          <Suspense fallback={null}>
            <group position={[0, -1, 0]}>
              {/* Dynamic avatar selection */}
              {selectedAvatar === 1 && (
                <AvatarWithPhysics position={[0, 0, 0]} rotation={[0, 0, 0]}>
                  <ConvaiAvatar castShadow receiveShadow onLoad={onAvatarLoaded} />
                </AvatarWithPhysics>
              )}
              
              {selectedAvatar === 2 && (
                <AvatarWithPhysics position={[0, 0, 0]} rotation={[0, 0, 0]}>
                  <ConvaiAvatar2 castShadow receiveShadow onLoad={onAvatarLoaded} />
                </AvatarWithPhysics>
              )}

              {selectedAvatar === 3 && (
                <AvatarWithPhysics position={[0, 0, 0]} rotation={[0, 0, 0]}>
                  <ConvaiAvatar3 castShadow receiveShadow onLoad={onAvatarLoaded} />
                </AvatarWithPhysics>
              )}

              {selectedAvatar === 4 && (
                <AvatarWithPhysics position={[0, 0, 0]} rotation={[0, 0, 0]}>
                  <ConvaiAvatar4 castShadow receiveShadow onLoad={onAvatarLoaded} />
                </AvatarWithPhysics>
              )}
              <ReceptionDesk
                currentAction={currentAction}
                position={[0, 0, 0]}
                rotation={[0, Math.PI * 0, 0]}
                scale={1.1}
              />
              <Floor />
              <Ceiling />
              <Tv />
              <Zegar />
              <CoffeeTable />
              <Vase/>
              <Chair />
              <Wall
                name="Left Wall"
                initialPosition={[-12.5, 2, 0]}  // Lewa krawędź podłogi (X = -12.5)
                initialSize={[0.2, 4, 25]}       // Cienka ściana (0.2m), wysokość 4m, długość 25m
                initialColor="#a0a0a0"
              />
              <Wall
                name="Right Wall"
                initialPosition={[12.5, 2, 0]}   // Prawa krawędź podłogi (X = +12.5)
                initialSize={[0.2, 4, 25]}       // Cienka ściana (0.2m), wysokość 4m, długość 25m
                initialColor="#a0a0a0"
              />
              <Wall
                name="Back Wall"
                initialPosition={[0, 2, -12.5]}  // Tylna krawędź podłogi (Z = -12.5)
                initialSize={[25, 4, 0.2]}       // Szerokość 25m, wysokość 4m, cienka ściana (0.2m)
                initialColor="#a0a0a0"
              />
              <Wall
                name="Front Wall"
                initialPosition={[0, 2, 12.5]}    // Przednia krawędź podłogi (Z = +12.5)
                initialSize={[25, 4, 0.2]}       // Szerokość 25m, wysokość 4m, cienka ściana (0.2m)
                initialColor="#909090"
              />
              <Wall
                name="Inside Back Wall"
                initialPosition={[3, 2, -2.45]}      // 8m od tyłu w głąb pomieszczenia
                initialSize={[18, 4, 0.2]}       // Szerokość 18m (72% szerokości podłogi)
                initialColor="#404040"
              />
            </group>
          </Suspense>
        </PresentationControls>
      </Physics>
    </Canvas>
  )
}, (prevProps, nextProps) => {
  return prevProps.isAvatarLoaded === nextProps.isAvatarLoaded &&
         prevProps.currentAction === nextProps.currentAction &&
         prevProps.selectedAvatar === nextProps.selectedAvatar
})

const App = () => {
  const [currentAction, setCurrentAction] = useState('')
  const [isAvatarLoaded, setIsAvatarLoaded] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState(1)

  const handleAvatarLoaded = useCallback(() => {
    setIsAvatarLoaded(true)
  }, [])

  const avatarButtons = [1, 2, 3, 4].map((num) => (
    <button
      key={num}
      onClick={() => setSelectedAvatar(num)}
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
        opacity: isAvatarLoaded ? 1 : 0.5,
        pointerEvents: isAvatarLoaded ? 'auto' : 'none'
      }}
    >
      Avatar {num}
    </button>
  ))

  return (
    <div className="app-container" style={{ 
      height: '100vh',
      width: '100vw',
      position: 'fixed',
      top: 0,
      left: 0 
    }}>
      <Leva hidden={false} />
      <ConvaiContext.Provider value={{ currentAction, setCurrentAction }}>
        <KeyboardControls
          map={[
            { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
            { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
            { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
            { name: 'right', keys: ['ArrowRight', 'KeyD'] },
          ]}
        >
          <div className="scene-container">
            {/* Nowy kontener z przyciskami */}
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
              {avatarButtons}
            </div>

            {!isAvatarLoaded && (
              <div className="loading-overlay">
                <LoadingSpinner progress={70} />
              </div>
            )}
            <Scene3DErrorBoundary>
              <Scene 
                isAvatarLoaded={isAvatarLoaded}
                onAvatarLoaded={handleAvatarLoaded}
                currentAction={currentAction}
                selectedAvatar={selectedAvatar}
              />
            </Scene3DErrorBoundary>
            {isAvatarLoaded && <ChatInterface characterId={AVATAR_ID} />}
          </div>
        </KeyboardControls>
      </ConvaiContext.Provider>
    </div>
  )
}

export default App
