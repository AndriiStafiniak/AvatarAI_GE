import React, {
  Suspense,
  useState,
  Component,
  useCallback,
  useEffect,
} from "react";
import { Canvas } from "@react-three/fiber";
import {
  Environment,
  PresentationControls,
  OrbitControls,
} from "@react-three/drei";
import { Leva, useControls } from "leva";
import {
  ConvaiAvatar,
  ConvaiAvatar2,
  ConvaiAvatar3,
  ConvaiAvatar4,
} from "./ConvaiAvatar";
import ChatInterface from "./chat/ChatInterface";
import Floor from "./walls/Floor";
import Wall from "./walls/Wall";
import Tv from "./components/interiorElements/Tv";
import Zegar from "./components/interiorElements/Zegar";
import ReceptionDesk from "./components/interiorElements/ReceptionDesk";
import Vase from "./components/interiorElements/Vase";
import "./App.css";
import Chair from "./components/interiorElements/Chair";
import CoffeeTable from "./components/interiorElements/CoffeeTable";
import LoadingSpinner from "./asset/LoadingSpinner";
import ChairOffice from "./components/interiorElements/ChairOffice";
import { FaFlag } from "react-icons/fa";

import { Physics } from "@react-three/cannon";
import Ceiling from "./walls/Ceiling";
import { useCylinder } from "@react-three/cannon";
import Sign from "./components/interiorElements/Sign";
import PlantOne from "./components/interiorElements/PlantOne";
import RollUpDisplay from "./components/interiorElements/RollUpDisplay";
import OfficeCabinet from "./components/interiorElements/OfficeCabinet";

// New MobileNotification component
const MobileNotification = () => {
  return (
    <div
      className="mobile-notification"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        zIndex: 9999,
        color: "white",
        textAlign: "center",
      }}
    >
      <div
        className="notification-content"
        style={{
          padding: "30px",
          backgroundColor: "rgba(33, 150, 243, 0.8)",
          borderRadius: "10px",
          maxWidth: "80%",
        }}
      >
        <h2 style={{ marginBottom: "15px", fontSize: "24px" }}>
          Trwają prace nad wersją mobilną
        </h2>
        <p style={{ marginBottom: "10px", fontSize: "16px" }}>
          Aplikacja jest obecnie dostępna na laptopach oraz wszystkich większych
          ekranach.
        </p>
        <p style={{ fontSize: "16px" }}>
          Zapraszamy do korzystania z wersji pełnoekranowej.
        </p>
      </div>
    </div>
  );
};

export const AVATAR_IDS = {
  1: "fe2da934-6aa4-11ef-8fba-42010a7be011",
  2: "881e4aac-50d5-11ef-9461-42010a7be011",
  3: "9ff38f44-437d-11ef-9187-42010a7be011",
  4: "2734589a-ef8f-11ef-9966-42010a7be016",
};

// Removed COLOR_PALETTES object and replaced with empty
const COLOR_PALETTES = {};

// Added constant with new labels
const LABELS = {
  1: "ENERGY TRANSFORMATION OF COMPANIES",
  2: "ENERGY AND HYDROGEN HUB",
  3: "IMPROVEMENT OF RENEWABLE ENERGY EFFICIENCY",
  4: "CLEAN AIR",
};

// Optimization of ErrorBoundary with better error handling
class Scene3DErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorDetails: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("3D Scene Error:", error, errorInfo);
    this.setState({ errorDetails: error.message });
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
      );
    }
    return this.props.children;
  }
}

// New component wrapping avatar with physics
const AvatarWithPhysics = ({ children, onLoad, position, rotation }) => {
  const [ref] = useCylinder(() => ({
    mass: 0, // Mass 0 = static object
    position,
    rotation,
    args: [0.3, 0.3, 1.8, 16], // [radiusTop, radiusBottom, height, numSegments]
    material: {
      friction: 0.1,
      restitution: 0.2,
    },
  }));

  return (
    <group ref={ref} position={position} rotation={rotation}>
      {React.cloneElement(children, { onLoad })}
    </group>
  );
};

// Modification of Scene component to use context
const Scene = ({
  activeScene,
  isAvatarLoaded,
  onAvatarLoaded,
  currentAction,
  selectedAvatar,
  isLoading,
  forceUpdate,
  avatars,
  visibleAvatar,
  onAvatarReady,
}) => {
  return (
    <Canvas
      shadows
      style={{ background: "#646464" }}
      camera={{
        position: [0, 1, 3],
        fov: 75,
        rotation: [0, Math.PI, 0],
      }}
      onCreated={({ gl, camera }) => {
        gl.domElement.style.touchAction = "none";
        camera.lookAt(0, 0, 0);
      }}
    >
      {/* <OrbitControls /> */}
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
          <ambientLight intensity={0.5} color="#ffffff" />
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
                      <group key={id} visible={Number(id) === visibleAvatar}>
                        {React.cloneElement(avatar, {
                          visible: Number(id) === visibleAvatar,
                          onReady: onAvatarReady,
                        })}
                        {Number(id) === 1 && (
                          <OfficeCabinet position={[2, 0, 0]} />
                        )}
                      </group>
                    );
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
                  <ChairOffice />
                  <RollUpDisplay
                    position={[2.2, 0, 1.5]}
                    rotation={[0, -Math.PI / 3, 0]}
                    scale={0.9}
                  />
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
                  <PlantOne />
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
  );
};

// New component for avatar buttons
function AvatarButtons({
  selectedAvatar,
  isLoading,
  handleAvatarChange,
  setActiveScene,
}) {
  const handleAvatarClick = (num) => {
    handleAvatarChange(num);
    setActiveScene(num);
  };

  return (
    <div className="avatar-buttons">
      <button
        onClick={() => handleAvatarClick(1)}
        className={`avatar-button ${selectedAvatar === 1 ? "active" : ""}`}
        disabled={isLoading}
      >
        English
      </button>
      <button
        onClick={() => handleAvatarClick(2)}
        className={`avatar-button ${selectedAvatar === 2 ? "active" : ""}`}
        disabled={isLoading}
      >
        Polski
      </button>
      <button
        onClick={() => handleAvatarClick(3)}
        className={`avatar-button ${selectedAvatar === 3 ? "active" : ""}`}
        disabled={isLoading}
      >
        Français
      </button>
      <button
        onClick={() => handleAvatarClick(4)}
        className={`avatar-button ${selectedAvatar === 4 ? "active" : ""}`}
        disabled={isLoading}
      >
        العربية
      </button>
    </div>
  );
}

const App = () => {
  const [currentAction, setCurrentAction] = useState("");
  const [activeScene, setActiveScene] = useState(1);
  const [isAvatarLoaded, setIsAvatarLoaded] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [avatars, setAvatars] = useState({});
  const [isLoadingAvatars, setIsLoadingAvatars] = useState(true);
  const [visibleAvatar, setVisibleAvatar] = useState(1);
  const [isAvatarReady, setIsAvatarReady] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 1000);
    };

    // Initial check
    checkMobileView();

    // Add listener for window resize
    window.addEventListener("resize", checkMobileView);

    // Cleanup
    return () => window.removeEventListener("resize", checkMobileView);
  }, []);

  const handleAvatarChange = useCallback(
    (avatarNumber) => {
      setIsAvatarLoaded(false);
      setIsAvatarReady(false);
      setSelectedAvatar(avatarNumber);
      setVisibleAvatar(avatarNumber);
      setActiveScene(avatarNumber);

      if (avatars[avatarNumber]) {
        setTimeout(() => {
          setIsAvatarLoaded(true);
        }, 500);
      }
    },
    [avatars]
  );

  const handleSceneChange = useCallback((sceneName) => {
    setForceUpdate((prev) => prev + 1);

    // Automatic avatar change depending on the scene
    const avatarMapping = {
      "ENERGY TRANSFORMATION": 1,
      "ENERGY AND HYDROGEN HUB": 2,
      "IMPROVEMENT OF RENEWABLE ENERGY EFFICIENCY": 3,
      "CLEAN AIR": 4,
    };

    const newAvatar = avatarMapping[sceneName] || 1;
    setSelectedAvatar(newAvatar);
    setVisibleAvatar(newAvatar);
  }, []);

  // Function to load all avatars
  useEffect(() => {
    const loadAvatars = async () => {
      try {
        const loadedAvatars = {
          1: <ConvaiAvatar onLoad={() => handleAvatarLoad(1)} />,
          2: <ConvaiAvatar2 onLoad={() => handleAvatarLoad(2)} />,
          3: <ConvaiAvatar3 onLoad={() => handleAvatarLoad(3)} />,
          4: <ConvaiAvatar4 onLoad={() => handleAvatarLoad(4)} />,
        };
        setAvatars(loadedAvatars);
        setIsLoadingAvatars(false);
      } catch (error) {
        console.error("Error loading avatars:", error);
      }
    };

    loadAvatars();
  }, []);

  const handleAvatarLoad = (avatarId) => {
    if (avatarId === selectedAvatar) {
      setIsAvatarLoaded(true);
    }
  };

  const handleAvatarReady = useCallback((isReady) => {
    console.log("Avatar ready state:", isReady);
    setIsAvatarReady(isReady);
  }, []);

  return (
    <div
      className="app-container"
      style={{
        height: "100vh",
        width: "100vw",
        position: "fixed",
        top: 0,
        left: 0,
      }}
    >
      {isMobileView && <MobileNotification />}
      <div className="scene-container">
        {selectedAvatar === 1 && (
          <div className="avatar-language-info">
            <p className="language-text">This avatar speaks only English</p>
          </div>
        )}
        {selectedAvatar === 2 && (
          <div className="avatar-language-info">
            <p className="language-text">
              Ten avatar posługuje się językiem polskim
            </p>
          </div>
        )}
        {selectedAvatar === 3 && (
          <div className="avatar-language-info">
            <p className="language-text">Cet avatar parle français</p>
          </div>
        )}
        {selectedAvatar === 4 && (
          <div className="avatar-language-info">
            <p className="language-text">هذا الصورة تتحدث العربية</p>
          </div>
        )}

        <div
          style={{
            position: "absolute",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            display: "flex",
            gap: "10px",
            padding: "10px",
            backgroundColor: "rgba(0,0,0,0.5)",
            borderRadius: "8px",
            backdropFilter: "blur(4px)",
          }}
        >
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
            onAvatarReady={handleAvatarReady}
          />
        </Scene3DErrorBoundary>
        {isAvatarLoaded && isAvatarReady && (
          <ChatInterface
            characterId={AVATAR_IDS[selectedAvatar]}
            setActiveScene={setActiveScene}
            isAvatarReady={isAvatarReady}
            language={
              selectedAvatar === 1
                ? "en"
                : selectedAvatar === 2
                ? "pl"
                : selectedAvatar === 3
                ? "fr"
                : "ar"
            }
          />
        )}

        <SceneButtons setActiveScene={setActiveScene} />
      </div>
    </div>
  );
};

// New component for scene buttons
function SceneButtons({ setActiveScene }) {
  return (
    <div className="scene-buttons">
      <button onClick={() => setActiveScene(1)}>Energy Transformation</button>
      <button onClick={() => setActiveScene(2)}>Energy Hub</button>
      <button onClick={() => setActiveScene(3)}>
        IMPROVEMENT OF RENEWABLE ENERGY EFFICIENCY
      </button>
      <button
        onClick={() => {
          const randomText = "TEST " + Math.floor(Math.random() * 1000);
          setActiveScene(randomText);
        }}
      >
        Test Random Text
      </button>
    </div>
  );
}

export default App;
