import React, { useState, useRef, useEffect, useCallback } from "react";
import Draggable from "react-draggable";
import "./ChatInterface.css";
import {
  MdSend,
  MdRefresh,
  MdExpandMore,
  MdExpandLess,
  MdMic,
  MdMicOff,
  MdSpeed,
} from "react-icons/md";
import { ConvaiClient } from "convai-web-sdk";

export default function ChatInterface({
  characterId,
  setActiveScene,
  isAvatarReady,
}) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isMicPermissionGranted, setIsMicPermissionGranted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fastResponseMode, setFastResponseMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [clientReady, setClientReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentCharacterId, setCurrentCharacterId] = useState(null);

  // Refs
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const nodeRef = useRef(null);
  const convaiClient = useRef(null);
  const userTextStream = useRef("");
  const npcTextStream = useRef("");
  const timeoutRef = useRef(null);
  const isInitializing = useRef(false);
  const initAttempts = useRef(0);

  // Funkcja pomocnicza do wyświetlania komunikatów błędów
  const handleError = (error, context) => {
    console.error(`Error in ${context}:`, error);
    let userMessage = "Wystąpił błąd. Spróbuj ponownie.";

    if (error.message?.includes("permission")) {
      userMessage =
        "Brak dostępu do mikrofonu! Zezwól na dostęp w ustawieniach przeglądarki.";
    } else if (error.message?.includes("network")) {
      userMessage =
        "Problem z połączeniem internetowym. Sprawdź swoje połączenie.";
    }

    // Wyświetlamy błąd tylko w przypadku, gdy to nie jest błąd podczas przetwarzania zapytania
    if (!isProcessing) {
      setErrorMessage(userMessage);
      setMessages((prev) => [
        ...prev,
        {
          text: userMessage,
          sender: "error",
        },
      ]);
    } else {
      console.warn(
        "Błąd podczas przetwarzania - nie wyświetlamy użytkownikowi:",
        userMessage
      );
    }

    setTimeout(() => {
      setErrorMessage("");
    }, 5000);
  };

  // Czyszczenie zasobów
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (convaiClient.current) {
      try {
        if (typeof convaiClient.current.destroy === "function") {
          convaiClient.current.destroy();
        } else if (typeof convaiClient.current.close === "function") {
          convaiClient.current.close();
        }
      } catch (error) {
        console.error("Błąd podczas czyszczenia klienta:", error);
      }
      convaiClient.current = null;
    }

    setMessages([]);
    setInputMessage("");
    setIsTyping(false);
    setClientReady(false);
    setIsProcessing(false);
    userTextStream.current = "";
    npcTextStream.current = "";
    initAttempts.current = 0;
  }, []);

  // Efekt śledzący zmiany ID postaci
  useEffect(() => {
    // Jeśli to nowa postać lub pierwsza inicjalizacja
    if (characterId !== currentCharacterId) {
      console.log(`Zmiana postaci: ${currentCharacterId} -> ${characterId}`);
      setCurrentCharacterId(characterId);

      // Reset stanu
      cleanup();
      isInitializing.current = false;
    }
  }, [characterId, currentCharacterId, cleanup]);

  // Efekt śledzący gotowość awatara i inicjujący klienta
  useEffect(() => {
    if (characterId && isAvatarReady && !isInitializing.current) {
      console.log(
        `Inicjalizacja klienta dla postaci ${characterId} (gotowość: ${isAvatarReady})`
      );
      isInitializing.current = true;

      timeoutRef.current = setTimeout(() => {
        initClient().finally(() => {
          isInitializing.current = false;
        });
      }, 800);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [characterId, isAvatarReady, cleanup]);

  // Inicjalizacja klienta Convai
  const initClient = async () => {
    if (!characterId || !isAvatarReady) {
      console.warn("Próba inicjalizacji bez ID postaci lub gotowego awatara");
      return null;
    }

    setIsLoading(true);
    console.log(`Inicjalizacja klienta Convai dla postaci: ${characterId}`);

    // Sprawdzamy czy nie próbujemy zainicjować zbyt wiele razy
    initAttempts.current += 1;
    if (initAttempts.current > 3) {
      console.error("Zbyt wiele prób inicjalizacji, przerywam");
      setIsLoading(false);
      return null;
    }

    try {
      // Najpierw upewnij się, że stary klient jest zamknięty
      if (convaiClient.current) {
        try {
          if (typeof convaiClient.current.destroy === "function") {
            convaiClient.current.destroy();
          } else if (typeof convaiClient.current.close === "function") {
            convaiClient.current.close();
          }
        } catch (error) {
          console.error("Błąd podczas czyszczenia starego klienta:", error);
        }
        convaiClient.current = null;
      }

      const client = new ConvaiClient({
        apiKey: "2d12bd421e3af7ce47223bce45944908",
        characterId: characterId,
        enableAudio: true,
        faceModal: 3,
        enableFacialData: true,
      });

      // Ustawienie timeoutu połączenia
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (!clientReady) {
          console.warn("Timeout podczas łączenia z awatarem");
          setIsLoading(false);
        }
      }, 15000);

      // Callback dla odpowiedzi
      client.setResponseCallback((response) => {
        // Czyszczenie timeoutu przy pierwszej odpowiedzi
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        if (!clientReady) {
          setClientReady(true);
          console.log(`Klient gotowy dla postaci: ${characterId}`);
        }

        // Obsługa zapytania użytkownika
        if (response.hasUserQuery()) {
          const transcript = response.getUserQuery();
          if (transcript) {
            userTextStream.current += " " + transcript.getTextData();

            if (transcript.getIsFinal()) {
              setMessages((prev) => [
                ...prev,
                {
                  text: userTextStream.current.trim(),
                  sender: "user",
                },
              ]);
              userTextStream.current = "";
            }
          }
        }

        // Obsługa odpowiedzi audio
        if (response.hasAudioResponse()) {
          // Wyłączamy loader przetwarzania
          setIsProcessing(false);

          const audioResponse = response.getAudioResponse();
          const newText = audioResponse.getTextData();

          if (newText && newText.trim()) {
            npcTextStream.current += " " + newText;

            // Bezpośrednia aktualizacja wiadomości bota
            setMessages((prev) => {
              const lastMessage = prev[prev.length - 1];
              if (lastMessage?.sender === "bot") {
                // Aktualizacja ostatniej wiadomości bota
                const updatedMessages = [...prev];
                updatedMessages[prev.length - 1] = {
                  text: npcTextStream.current.trim(),
                  sender: "bot",
                };
                return updatedMessages;
              } else {
                // Dodanie nowej wiadomości bota
                return [
                  ...prev,
                  {
                    text: npcTextStream.current.trim(),
                    sender: "bot",
                  },
                ];
              }
            });

            // Zatrzymanie wskaźnika pisania
            setIsTyping(false);
          }

          // Obsługa danych wizualizacji mowy
          if (audioResponse.hasVisemesData()) {
            try {
              const lipsyncData = audioResponse.getVisemesData().array[0];
              if (lipsyncData && lipsyncData[0] !== -2) {
                window.visemeData = window.visemeData || [];
                window.visemeData.push(lipsyncData);
                window.visemeDataActive = true;
                window.dispatchEvent(new Event("viseme-data-update"));
              }
            } catch (e) {
              console.warn(
                "Błąd podczas przetwarzania danych wizualizacji mowy:",
                e
              );
            }
          }
        }
      });

      // Callbacks dla audio
      client.onAudioPlay(() => {
        window.dispatchEvent(new Event("avatar-talking-start"));
      });

      client.onAudioStop(() => {
        window.dispatchEvent(new Event("avatar-talking-end"));

        // Wyłączamy loader przetwarzania jeśli wciąż jest włączony
        if (isProcessing) {
          setIsProcessing(false);
        }
      });

      // Zapisujemy klienta w ref
      convaiClient.current = client;

      // Reset stanu czatu
      setMessages([]);
      npcTextStream.current = "";
      userTextStream.current = "";

      // Automatyczne przywitanie po załadowaniu
      setTimeout(() => {
        if (client && clientReady && convaiClient.current === client) {
          try {
            client
              .sendTextChunk(
                "Przywitaj się krótko i zapytaj w czym możesz pomóc"
              )
              .catch((err) => console.error("Błąd przywitania:", err));
          } catch (error) {
            console.error("Błąd podczas wysyłania przywitania:", error);
          }
        }
      }, 2000);

      setIsLoading(false);
      initAttempts.current = 0;
      return client;
    } catch (error) {
      console.error("Error initializing client:", error);
      setIsLoading(false);
      return null;
    }
  };

  // Wysyłanie wiadomości tekstowej
  const sendTextMessage = async (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isProcessing) return;

    const messageToSend = inputMessage.trim();
    setInputMessage("");
    setIsTyping(true);
    setIsProcessing(true);

    try {
      setMessages((prev) => [
        ...prev,
        {
          text: messageToSend,
          sender: "user",
        },
      ]);

      // Sprawdzenie czy mamy aktywne połączenie z właściwą postacią
      if (!convaiClient.current || currentCharacterId !== characterId) {
        console.log(`Próba inicjalizacji klienta dla postaci: ${characterId}`);
        await initClient();
      }

      // Sprawdzamy ponownie po inicjalizacji
      if (!convaiClient.current) {
        console.error("Nie udało się nawiązać połączenia z awatarem");
        setIsProcessing(false);
        setIsTyping(false);
        return;
      }

      // Ustawiamy timeout na przetwarzanie wiadomości
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (isProcessing) {
          setIsProcessing(false);
          setIsTyping(false);
          console.warn("Timeout podczas oczekiwania na odpowiedź");
        }
      }, 20000);

      // Wysyłamy wiadomość
      try {
        await convaiClient.current.sendTextChunk(messageToSend);
      } catch (error) {
        console.error("Błąd podczas wysyłania wiadomości:", error);

        // Wyłączamy loader po krótkim czasie
        setTimeout(() => {
          setIsProcessing(false);
          setIsTyping(false);
        }, 1000);
      }
    } catch (error) {
      console.error("Błąd w sendTextMessage:", error);
      setIsProcessing(false);
      setIsTyping(false);
    }
  };

  // Przewijanie czatu do dołu
  const scrollToBottom = () => {
    try {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.warn("Błąd podczas przewijania czatu:", error);
    }
  };

  // Przewijanie po nowych wiadomościach
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Odświeżanie czatu
  const handleRefresh = async () => {
    if (isProcessing) return; // Blokujemy odświeżanie podczas przetwarzania

    setMessages([]);
    setInputMessage("");
    setIsTyping(false);
    setIsProcessing(false);
    userTextStream.current = "";
    npcTextStream.current = "";
    isInitializing.current = false;

    try {
      // Reinicjalizacja klienta
      if (convaiClient.current) {
        try {
          if (typeof convaiClient.current.destroy === "function") {
            convaiClient.current.destroy();
          } else if (typeof convaiClient.current.close === "function") {
            convaiClient.current.close();
          }
        } catch (error) {
          console.error("Błąd podczas zamykania klienta:", error);
        }
        convaiClient.current = null;
      }

      // Reset licznika prób
      initAttempts.current = 0;
      await initClient();
    } catch (error) {
      console.error("Błąd odświeżania:", error);
    }
  };

  // Przełączanie rozwinięcia/zwinięcia czatu
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Obsługa kliknięcia mikrofonu
  const handleMicrophoneClick = async () => {
    if (isProcessing) return; // Blokujemy nagrywanie podczas przetwarzania

    try {
      if (!isMicPermissionGranted) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        stream.getTracks().forEach((track) => track.stop());
        setIsMicPermissionGranted(true);
      }

      if (!isRecording) {
        // Sprawdzenie czy mamy aktywne połączenie z właściwą postacią
        if (!convaiClient.current || currentCharacterId !== characterId) {
          console.log(
            `Próba inicjalizacji klienta przed użyciem mikrofonu dla postaci: ${characterId}`
          );
          await initClient();

          // Sprawdzamy ponownie po inicjalizacji
          if (!convaiClient.current) {
            console.error("Nie udało się nawiązać połączenia z awatarem");
            return;
          }
        }

        setIsRecording(true);
        setIsProcessing(true);
        userTextStream.current = "";
        npcTextStream.current = "";

        // Ustawiamy timeout na nagrywanie
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          if (isRecording) {
            setIsRecording(false);
            setIsProcessing(false);
            console.warn("Timeout podczas nagrywania");

            if (convaiClient.current) {
              try {
                convaiClient.current.endAudioChunk();
              } catch (error) {
                console.error("Błąd podczas kończenia nagrywania:", error);
              }
            }
          }
        }, 30000);

        try {
          convaiClient.current.startAudioChunk();
        } catch (error) {
          console.error("Błąd podczas rozpoczynania nagrywania:", error);
          setIsRecording(false);
          setIsProcessing(false);
        }
      } else {
        setIsRecording(false);
        setTimeout(() => {
          if (convaiClient.current) {
            try {
              convaiClient.current.endAudioChunk();
            } catch (error) {
              console.error("Błąd podczas kończenia nagrywania:", error);
              setIsProcessing(false);
            }
          }
        }, 100);
      }
    } catch (error) {
      console.error("Błąd mikrofonu:", error);
      setIsRecording(false);
      setIsProcessing(false);
      setIsMicPermissionGranted(false);
    }
  };

  // Przełączanie trybu szybkiej odpowiedzi
  const toggleFastResponseMode = () => {
    setFastResponseMode(!fastResponseMode);
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      bounds="body"
      cancel=".chat-input, .chat-send-button, .refresh-button, .mic-button"
    >
      <div
        ref={nodeRef}
        className="chat-interface"
        style={{ height: isExpanded ? "500px" : "40px" }}
      >
        <div className="chat-header">
          <span>
            Chat{" "}
            {currentCharacterId ? `(${currentCharacterId.slice(0, 6)}...)` : ""}
          </span>
          <div className="header-controls">
            <button
              className={`fast-response-button ${
                fastResponseMode ? "active" : ""
              }`}
              onClick={toggleFastResponseMode}
              title={
                fastResponseMode
                  ? "Wyłącz tryb szybkiej odpowiedzi"
                  : "Włącz tryb szybkiej odpowiedzi"
              }
              disabled={isProcessing}
            >
              <MdSpeed />
            </button>
            <button
              className="refresh-button"
              onClick={handleRefresh}
              title="Odśwież czat"
              disabled={isProcessing}
            >
              <MdRefresh />
            </button>
            <div className="expand-icon-container" onClick={toggleExpand}>
              {isExpanded ? (
                <MdExpandMore className="expand-icon" />
              ) : (
                <MdExpandLess className="expand-icon" />
              )}
            </div>
          </div>
        </div>
        {isExpanded && (
          <>
            <div ref={chatContainerRef} className="chat-messages">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`message ${msg.sender} ${
                    msg.sender === "error" ? "error-message" : ""
                  }`}
                >
                  {msg.text}
                </div>
              ))}
              {isTyping && (
                <div className="message bot typing">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
              {isRecording && (
                <div className="message user speech-preview">
                  Mów teraz...
                  <div className="voice-wave"></div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="chat-controls">
              <form onSubmit={sendTextMessage} className="chat-input-form">
                <button
                  type="button"
                  className={`mic-button ${isRecording ? "recording" : ""} ${
                    errorMessage ? "error" : ""
                  }`}
                  onClick={handleMicrophoneClick}
                  title={
                    isRecording
                      ? "Zatrzymaj nagrywanie"
                      : "Rozpocznij nagrywanie"
                  }
                  disabled={isProcessing || isLoading}
                >
                  {isRecording ? <MdMicOff /> : <MdMic />}
                </button>
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={
                    isProcessing ? "Przetwarzanie..." : "Napisz wiadomość..."
                  }
                  className="chat-input"
                  disabled={isProcessing || isLoading}
                />
                <button
                  type="submit"
                  className="chat-send-button"
                  title="Wyślij"
                  disabled={isProcessing || isLoading || !inputMessage.trim()}
                >
                  <MdSend />
                </button>
              </form>
            </div>
            {(isLoading || isProcessing) && (
              <div className="chat-loading">
                {isLoading ? "Łączenie z awatarem..." : "Przetwarzanie..."}
              </div>
            )}
          </>
        )}
      </div>
    </Draggable>
  );
}
