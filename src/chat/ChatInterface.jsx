import React, { useState, useRef, useEffect, useCallback } from 'react'
import Draggable from 'react-draggable'
import './ChatInterface.css'
import { MdSend, MdRefresh, MdExpandMore, MdExpandLess, MdMic, MdMicOff, MdKeyboardVoice, MdVoiceOverOff, MdSpeed } from 'react-icons/md'
import { ConvaiClient } from 'convai-web-sdk'
import { AVATAR_IDS } from '../App'

export default function ChatInterface({ characterId, setActiveScene, isAvatarReady }) {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const chatContainerRef = useRef(null)
  const nodeRef = useRef(null)
  
  const convaiClient = useRef(null)
  const userTextStream = useRef("")
  const npcTextStream = useRef("")
  const keyPressed = useRef(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [isMicPermissionGranted, setIsMicPermissionGranted] = useState(false)
  const [micError, setMicError] = useState('')
  const [userSpeechText, setUserSpeechText] = useState('')
  const [autoGreetingDone, setAutoGreetingDone] = useState(false)
  const [clientReady, setClientReady] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [fastResponseMode, setFastResponseMode] = useState(false)
  
  // Dodajemy system kolejkowania audio
  const audioQueue = useRef([])
  const isPlayingAudio = useRef(false)
  const audioCollectionTimeout = useRef(null)
  const pendingAudioSegments = useRef([])
  const responseStartTime = useRef(null)

  const [isLoading, setIsLoading] = useState(false)
  const initTimeoutRef = useRef(null)
  const connectionTimeoutRef = useRef(null)

  // Funkcja pomocnicza do wyświetlania przyjaznych komunikatów błędów
  const handleError = (error, context) => {
    console.error(`Error in ${context}:`, error)
    let userMessage = 'Przepraszamy, wystąpił nieoczekiwany błąd. Spróbuj ponownie.'

    if (error.message?.includes('permission')) {
      userMessage = 'Brak dostępu do mikrofonu! Kliknij ikonę kłódki w pasku przeglądarki i zezwól na dostęp.'
    } else if (error.message?.includes('network')) {
      userMessage = 'Problem z połączeniem internetowym. Sprawdź swoje połączenie i spróbuj ponownie.'
    } else if (error.message?.includes('audio')) {
      userMessage = 'Problem z systemem audio. Sprawdź czy Twój mikrofon działa poprawnie.'
    }

    setErrorMessage(userMessage)
    setMessages(prev => [...prev, {
      text: userMessage,
      sender: 'error',
      timestamp: new Date().toISOString()
    }])
    
    // Automatycznie ukryj błąd po 5 sekundach
    setTimeout(() => {
      setErrorMessage('')
    }, 5000)
  }

  // Funkcja do odtwarzania kolejnego audio z kolejki
  const playNextAudio = () => {
    if (audioQueue.current.length === 0) {
      isPlayingAudio.current = false
      return
    }
    
    // Jeśli włączony tryb szybkiej odpowiedzi, pomijamy odtwarzanie audio
    if (fastResponseMode) {
      audioQueue.current = []
      isPlayingAudio.current = false
      return
    }
    
    isPlayingAudio.current = true
    const nextAudio = audioQueue.current.shift()
    
    try {
      if (convaiClient.current && typeof convaiClient.current.playAudio === 'function') {
        convaiClient.current.playAudio(nextAudio)
      } else {
        playNextAudio()
      }
    } catch (error) {
      console.error('Błąd odtwarzania audio:', error)
      playNextAudio()
    }
  }

  const processAudioSegments = () => {
    if (pendingAudioSegments.current.length > 0) {
      audioQueue.current.push(...pendingAudioSegments.current)
      pendingAudioSegments.current = []
      
      if (!isPlayingAudio.current) {
        playNextAudio()
      }
    }
  }

  // Cleanup function
  const cleanup = useCallback(() => {
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current)
    }
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current)
    }
    if (convaiClient.current) {
      if (typeof convaiClient.current.destroy === 'function') {
        convaiClient.current.destroy()
      } else if (typeof convaiClient.current.close === 'function') {
        convaiClient.current.close()
      }
      convaiClient.current = null
    }
    setMessages([])
    setInputMessage('')
    setIsTyping(false)
    setAutoGreetingDone(false)
    setClientReady(false)
    userTextStream.current = ""
    npcTextStream.current = ""
    audioQueue.current = []
    isPlayingAudio.current = false
    if (audioCollectionTimeout.current) {
      clearTimeout(audioCollectionTimeout.current)
    }
  }, [])

  // Effect for character changes
  useEffect(() => {
    cleanup()
    
    if (characterId && isAvatarReady) {
      console.log('Initializing client for character:', characterId)
      initTimeoutRef.current = setTimeout(() => {
        initClient()
      }, 1000) // Zwiększamy opóźnienie inicjalizacji
    }

    return cleanup
  }, [characterId, isAvatarReady, cleanup])

  // Initialize Convai client
  const initClient = async () => {
    if (!characterId || !isAvatarReady) return

    setIsLoading(true)
    try {
      console.log('Creating new ConvaiClient instance')
      const client = new ConvaiClient({
        apiKey: '2d12bd421e3af7ce47223bce45944908',
        characterId: characterId,
        enableAudio: true,
        faceModal: 3,
        enableFacialData: true,
      })

      // Connection timeout
      connectionTimeoutRef.current = setTimeout(() => {
        if (!clientReady) {
          handleError(new Error('Timeout podczas łączenia z awatarem'), 'Connection Timeout')
          cleanup()
        }
      }, 15000) // Zwiększamy timeout do 15 sekund

      // Response callback
      client.setResponseCallback((response) => {
        // Clear timeout on first response
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current)
          connectionTimeoutRef.current = null
        }
        
        if (!clientReady) {
          console.log('Client connected successfully')
          setClientReady(true)
        }
        
        // Handle user query
        if (response.hasUserQuery()) {
          const transcript = response.getUserQuery()
          if (transcript) {
            userTextStream.current += " " + transcript.getTextData()
            
            if (transcript.getIsFinal()) {
              setMessages(prev => [...prev, {
                text: userTextStream.current.trim(),
                sender: 'user'
              }])
              userTextStream.current = ""
              
              // Rozpoczynamy pomiar czasu odpowiedzi
              responseStartTime.current = Date.now()
            }
          }
        }

        // Handle audio response
        if (response.hasAudioResponse()) {
          const audioResponse = response.getAudioResponse()
          const newText = audioResponse.getTextData()
          
          if (newText && newText.trim()) {
            npcTextStream.current += " " + newText
            
            // Aktualizujemy wiadomość bota natychmiast, nie czekając na audio
            setMessages(prev => {
              const lastMessage = prev[prev.length - 1]
              if (lastMessage?.sender === 'bot') {
                const updatedMessages = [...prev]
                updatedMessages[prev.length - 1] = {
                  text: npcTextStream.current.trim(),
                  sender: 'bot'
                }
                return updatedMessages
              }
              return [...prev, {
                text: npcTextStream.current.trim(),
                sender: 'bot'
              }]
            })
            
            // Jeśli to pierwsza odpowiedź, zatrzymujemy wskaźnik pisania
            setIsTyping(false)
            
            // Mierzymy czas odpowiedzi
            if (responseStartTime.current) {
              const responseTime = Date.now() - responseStartTime.current
              console.log(`Czas odpowiedzi: ${responseTime}ms`)
              responseStartTime.current = null
            }
          }

          // Zbieramy segmenty audio
          if (audioResponse.array && audioResponse.array[0]) {
            pendingAudioSegments.current.push(audioResponse.array[0])
            
            // Resetujemy timer za każdym razem gdy otrzymamy nowy segment
            if (audioCollectionTimeout.current) {
              clearTimeout(audioCollectionTimeout.current)
            }
            
            // Ustawiamy timer na przetworzenie zebranych segmentów - zmniejszamy opóźnienie
            audioCollectionTimeout.current = setTimeout(() => {
              processAudioSegments()
            }, fastResponseMode ? 50 : 200) // Zmniejszamy czas oczekiwania
          }

          // Handle viseme data
          if (audioResponse.hasVisemesData()) {
            const lipsyncData = audioResponse.getVisemesData().array[0]
            if (lipsyncData[0] !== -2) {
              window.visemeData = window.visemeData || []
              window.visemeData.push(lipsyncData)
              window.visemeDataActive = true
              window.dispatchEvent(new Event('viseme-data-update'))
            }
          }
        }
      })

      // Audio callbacks
      client.onAudioPlay(() => {
        window.dispatchEvent(new Event('avatar-talking-start'))
      })

      client.onAudioStop(() => {
        window.dispatchEvent(new Event('avatar-talking-end'))
        // Po zakończeniu odtwarzania audio, odtwarzamy następne z kolejki
        setTimeout(() => {
          playNextAudio()
        }, 50) // Zmniejszamy opóźnienie między segmentami audio
      })

      convaiClient.current = client
      
      // Resetujemy stan czatu przy zmianie awatara
      setMessages([])
      npcTextStream.current = ""
      userTextStream.current = ""
      
      // Resetujemy stan automatycznego przywitania
      setAutoGreetingDone(false)

      setIsLoading(false)
    } catch (error) {
      console.error('Error initializing client:', error)
      setIsLoading(false)
      handleError(error, 'Client Initialization')
      cleanup()
    }
  }

  const sendTextMessage = async (e) => {
    e?.preventDefault()
    if (!inputMessage.trim()) return

    setIsTyping(true)
    
    try {
      setMessages(prev => [...prev, {
        text: inputMessage,
        sender: 'user'
      }])
      
      if (!convaiClient.current) {
        throw new Error('Połączenie z awatarem nie zostało ustanowione. Odśwież stronę i spróbuj ponownie.')
      }
      
      // Rozpoczynamy pomiar czasu odpowiedzi
      responseStartTime.current = Date.now()
      
      // Wysyłamy wiadomość z priorytetem dla tekstu
      await convaiClient.current.sendTextChunk(inputMessage)
      setInputMessage('')
    } catch (error) {
      handleError(error, 'Send Text Message')
      setIsTyping(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleRefresh = async () => {
    setMessages([])
    setInputMessage('')
    setIsTyping(false)
    userTextStream.current = ""
    npcTextStream.current = ""
    
    // Czyszczenie kolejki audio
    audioQueue.current = []
    isPlayingAudio.current = false
    
    try {
      // Reinicjalizacja klienta
      if (convaiClient.current) {
        if (typeof convaiClient.current.destroy === 'function') {
          convaiClient.current.destroy()
        } else if (typeof convaiClient.current.close === 'function') {
          convaiClient.current.close()
        }
        convaiClient.current = null
      }
      
      await initClient()
    } catch (error) {
      handleError(error, 'Refresh')
    }
  }

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  const handleMicrophoneClick = async () => {
    try {
      if (!isMicPermissionGranted) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach(track => track.stop())
        setIsMicPermissionGranted(true)
      }

      if (!isRecording) {
        if (!convaiClient.current) {
          throw new Error('Połączenie z awatarem nie zostało ustanowione. Odśwież stronę i spróbuj ponownie.')
        }
        
        setMicError('')
        setIsRecording(true)
        userTextStream.current = ""
        npcTextStream.current = ""
        
        // Rozpoczynamy pomiar czasu odpowiedzi
        responseStartTime.current = Date.now()
        
        convaiClient.current.startAudioChunk()
      } else {
        setIsRecording(false)
        setTimeout(() => {
          if (convaiClient.current) {
            convaiClient.current.endAudioChunk()
          }
        }, 100) // Zmniejszamy opóźnienie
      }
    } catch (error) {
      handleError(error, 'Microphone Access')
      setIsRecording(false)
      setIsMicPermissionGranted(false)
    }
  }

  // Automatyczne przywitanie po załadowaniu awatara
  useEffect(() => {
    if (!clientReady || !characterId) return

    const sendGreeting = async () => {
      if (convaiClient.current && !autoGreetingDone) {
        setIsTyping(true)
        try {
          await convaiClient.current.sendTextChunk("Przywitaj się krótko i zapytaj w czym możesz pomóc")
          setAutoGreetingDone(true)
        } catch (error) {
          handleError(error, 'Automatic Greeting')
          setIsTyping(false)
        }
      }
    }

    const greetingTimer = setTimeout(sendGreeting, 1000)
    return () => clearTimeout(greetingTimer)
  }, [clientReady, characterId, autoGreetingDone])

  // Funkcja przełączająca tryb szybkiej odpowiedzi
  const toggleFastResponseMode = () => {
    setFastResponseMode(!fastResponseMode)
    
    // Jeśli włączamy tryb szybkiej odpowiedzi, czyścimy kolejkę audio
    if (!fastResponseMode) {
      audioQueue.current = []
      isPlayingAudio.current = false
    }
  }

  return (
    <Draggable 
      nodeRef={nodeRef} 
      bounds="body"
      cancel=".chat-input, .chat-send-button, .refresh-button"
    >
      <div 
        ref={nodeRef} 
        className="chat-interface"
        style={{ height: isExpanded ? '500px' : '40px' }}
      >
        <div className="chat-header">
          <span>Chat</span>
          <div className="header-controls">
            <button 
              className={`fast-response-button ${fastResponseMode ? 'active' : ''}`}
              onClick={toggleFastResponseMode}
              title={fastResponseMode ? "Wyłącz tryb szybkiej odpowiedzi" : "Włącz tryb szybkiej odpowiedzi"}
            >
              <MdSpeed />
            </button>
            <button 
              className="refresh-button" 
              onClick={handleRefresh}
              title="Odśwież czat"
            >
              <MdRefresh />
            </button>
            <div 
              className="expand-icon-container" 
              onClick={toggleExpand}
            >
              {isExpanded ? (
                <MdExpandMore className="expand-icon" />
              ) : (
                <MdExpandLess className="expand-icon" />
              )}
            </div>
            <div className="drag-handle">⋮⋮</div>
          </div>
        </div>
        {isExpanded && (
          <>
            <div ref={chatContainerRef} className="chat-messages">
              {messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`message ${msg.sender} ${msg.sender === 'error' ? 'error-message' : ''}`}
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
              {errorMessage && (
                <div className="message error-message fade-out">
                  {errorMessage}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="chat-controls">
              <form onSubmit={sendTextMessage} className="chat-input-form">
                <button 
                  type="button" 
                  className={`mic-button ${isRecording ? 'recording' : ''} ${errorMessage ? 'error' : ''}`}
                  onClick={handleMicrophoneClick}
                  title={isRecording ? "Zatrzymaj nagrywanie" : "Rozpocznij nagrywanie"}
                  disabled={!!errorMessage}
                >
                  {isRecording ? <MdMicOff /> : <MdMic />}
                </button>
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Napisz wiadomość..."
                  className="chat-input"
                  disabled={!!errorMessage}
                />
                <button 
                  type="submit" 
                  className="chat-send-button" 
                  title="Wyślij"
                  disabled={!!errorMessage}
                >
                  <MdSend />
                </button>
              </form>
            </div>
            {isLoading && (
              <div className="chat-loading">
                Łączenie z awatarem...
              </div>
            )}
          </>
        )}
      </div>
    </Draggable>
  )
} 