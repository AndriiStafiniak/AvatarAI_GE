import React, { Suspense, useState, Component, useCallback, useEffect } from 'react'
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
import { Ceiling } from './components/Ceiling'
import { useCylinder } from '@react-three/cannon'
import Sign from './components/Sign'
import { SceneProvider, useScene } from './contexts/SceneContext'


const AVATAR_IDS = {
  1: 'fe2da934-6aa4-11ef-8fba-42010a7be011',
  2: '881e4aac-50d5-11ef-9461-42010a7be011',
  3: '9ff38f44-437d-11ef-9187-42010a7be011',
  4: '2734589a-ef8f-11ef-9966-42010a7be016'
};

// Modyfikacja stałej z paletami kolorów - dodaję kolory dla wewnętrznej ściany
const COLOR_PALETTES = {
  1: {
    walls: '#a0a0a0',
    floor: '#4a4a4a',
    ceiling: '#606060',
    frontWall: '#909090',
    insideBackWall: '#d9a295' // Stonowana terrakota zamiast intensywnej czerwieni
  },
  2: {
    walls: '#7c9eb2',
    floor: '#3a5f6f',
    ceiling: '#5a7f8f',
    frontWall: '#6a8da0',
    insideBackWall: '#a0c3d9' // Jasny błękit zamiast intensywnego niebieskiego
  },
  3: {
    walls: '#b28c7c',
    floor: '#6f3a3a',
    ceiling: '#8f5a5a',
    frontWall: '#a06a6a',
    insideBackWall: '#b8cfb9' // Szałwiowa zieleń zamiast intensywnej zieleni
  },
  4: {
    walls: '#7cb27c',
    floor: '#3a6f3a',
    ceiling: '#5a8f5a',
    frontWall: '#6aa06a',
    insideBackWall: '#c9b8d3' // Jasny lawendowy zamiast intensywnego fioletu
  }
};

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
  isAvatarLoaded, 
  onAvatarLoaded, 
  currentAction, 
  selectedAvatar, 
  isLoading,
  forceUpdate
}) => {
  const currentColors = COLOR_PALETTES[selectedAvatar];
  
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
        position: [0,1, 3],  // X: 0, Y: 1.5m (wysokość osoby), Z: 3m od przodu
        fov: 75,                // Naturalne pole widzenia
        rotation: [0, Math.PI, 0] // Patrzymy w kierunku ujemnej osi Z
      }}
      onCreated={({ gl, camera }) => {  
        gl.domElement.style.touchAction = 'none'
        camera.lookAt(0, 0, 0)  // Celujemy na wysokości 1m (środek awatara)
        console.log("Canvas został utworzony"); // Sprawdzamy czy Canvas się tworzy
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
              {!isLoading && (
                <>
                  {selectedAvatar === 1 && <ConvaiAvatar onLoad={onAvatarLoaded} />}
                  {selectedAvatar === 2 && <ConvaiAvatar2 onLoad={onAvatarLoaded} />}
                  {selectedAvatar === 3 && <ConvaiAvatar3 onLoad={onAvatarLoaded} />}
                  {selectedAvatar === 4 && <ConvaiAvatar4 onLoad={onAvatarLoaded} />}
                </>
              )}
              <ReceptionDesk
                currentAction={currentAction}
                position={[0, 0, 0]}
                rotation={[0, Math.PI * 0, 0]}
                scale={1.1}
              />
              <Floor color={currentColors.floor} />
              <Ceiling color={currentColors.ceiling} />
              <Tv />
              <Zegar />
              <Sign 
                position={[0, 3.5, -4.9]} 
                scale={1.2} 
                color={currentColors.frontWall}
              />
              {console.log("Sign renderowany wewnątrz Canvas")}
              <CoffeeTable />
              <Vase/>
              <Chair />
              <Wall
                name="Left Wall"
                initialPosition={[-12.5, 2, 0]}  // Lewa krawędź podłogi (X = -12.5)
                initialSize={[0.2, 4, 25]}       // Cienka ściana (0.2m), wysokość 4m, długość 25m
                initialColor={currentColors.walls}
              />
              <Wall
                name="Right Wall"
                initialPosition={[12.5, 2, 0]}   // Prawa krawędź podłogi (X = +12.5)
                initialSize={[0.2, 4, 25]}       // Cienka ściana (0.2m), wysokość 4m, długość 25m
                initialColor={currentColors.walls}
              />
              <Wall
                name="Back Wall"
                initialPosition={[0, 2, -12.5]}  // Tylna krawędź podłogi (Z = -12.5)
                initialSize={[25, 4, 0.2]}       // Szerokość 25m, wysokość 4m, cienka ściana (0.2m)
                initialColor={currentColors.walls}
              />
              <Wall
                name="Front Wall"
                initialPosition={[0, 2, 12.5]}    // Przednia krawędź podłogi (Z = +12.5)
                initialSize={[25, 4, 0.2]}       // Szerokość 25m, wysokość 4m, cienka ściana (0.2m)
                initialColor={currentColors.frontWall}
              />
              <Wall
                name="Inside Back Wall"
                initialPosition={[3, 2, -2.45]}
                initialSize={[18, 4, 0.2]}
                initialColor={currentColors.insideBackWall}
                color={currentColors.insideBackWall}
              />
            </group>
          </Suspense>
        </PresentationControls>
      </Physics>
    </Canvas>
  )
}

// Nowy komponent dla przycisków awatara
function AvatarButtons({ selectedAvatar, isLoading, handleAvatarChange }) {
  const { setCurrentScene } = useScene();
  
  const handleAvatarClick = (num) => {
    handleAvatarChange(num);
    setCurrentScene(LABELS[num]); // Aktualizujemy scenę przy zmianie awatara
  };
  
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
  const [isAvatarLoaded, setIsAvatarLoaded] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(0);

  const handleAvatarChange = useCallback((avatarNumber) => {
    setIsLoading(true)
    setSelectedAvatar(avatarNumber)
    
    setTimeout(() => {
      setIsLoading(false)
      setIsAvatarLoaded(true)
    }, 2000)
  }, [selectedAvatar, isLoading])

  const handleSceneChange = (sceneName) => {
    console.log("handleSceneChange wywołany z:", sceneName);
    setForceUpdate(prev => prev + 1); // Wymuszamy re-render bez przeładowania strony
  };

  return (
    <div className="app-container" style={{ 
      height: '100vh',
      width: '100vw',
      position: 'fixed',
      top: 0,
      left: 0 
    }}>
      <Leva hidden={false} />
      <SceneProvider>
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
                <AvatarButtons 
                  selectedAvatar={selectedAvatar} 
                  isLoading={isLoading} 
                  handleAvatarChange={handleAvatarChange} 
                />
              </div>

              {!isAvatarLoaded && (
                <div className="loading-overlay">
                  <LoadingSpinner progress={70} />
                </div>
              )}
              <Scene3DErrorBoundary>
                <Scene 
                  key={`scene-${forceUpdate}`}
                  isAvatarLoaded={isAvatarLoaded}
                  onAvatarLoaded={() => setIsAvatarLoaded(true)}
                  currentAction={currentAction}
                  selectedAvatar={selectedAvatar}
                  isLoading={isLoading}
                  forceUpdate={forceUpdate}
                />
              </Scene3DErrorBoundary>
              {isAvatarLoaded && <ChatInterface characterId={AVATAR_IDS[selectedAvatar]} />}

              <SceneButtons />
            </div>
          </KeyboardControls>
        </ConvaiContext.Provider>
      </SceneProvider>
    </div>
  )
}

// Nowy komponent dla przycisków sceny
function SceneButtons() {
  const { setCurrentScene } = useScene();
  
  return (
    <div className="scene-buttons">
      <button onClick={() => setCurrentScene(LABELS[1])}>
        Transformacja Energetyczna
      </button>
      <button onClick={() => setCurrentScene(LABELS[2])}>
        Hub Energetyczny
      </button>
      <button onClick={() => setCurrentScene(LABELS[3])}>
        POPRAWA EFEKTYWNOŚCI OZE
      </button>
      <button onClick={() => {
        const randomText = "TEST " + Math.floor(Math.random() * 1000);
        setCurrentScene(randomText);
      }}>
        Test Losowego Tekstu
      </button>
    </div>
  );
}

export default App
