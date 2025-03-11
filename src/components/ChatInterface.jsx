import React, { useState, useRef, useEffect } from 'react'
import Draggable from 'react-draggable'
import './ChatInterface.css'
import { MdSend, MdRefresh, MdExpandMore, MdExpandLess, MdMic, MdMicOff, MdKeyboardVoice, MdVoiceOverOff } from 'react-icons/md'
import { ConvaiClient } from 'convai-web-sdk'
import { AVATAR_IDS } from '../App'

export default function ChatInterface({ characterId, setActiveScene }) {
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
  
  // Dodajemy system kolejkowania audio
  const audioQueue = useRef([])
  const isPlayingAudio = useRef(false)
  const audioCollectionTimeout = useRef(null)
  const pendingAudioSegments = useRef([])

  // Funkcja do odtwarzania kolejnego audio z kolejki
  const playNextAudio = () => {
    console.log('Próba odtworzenia kolejnego audio, kolejka:', audioQueue.current.length)
    
    if (audioQueue.current.length === 0) {
      isPlayingAudio.current = false
      console.log('Kolejka audio pusta, zatrzymuję odtwarzanie')
      return
    }
    
    isPlayingAudio.current = true
    const nextAudio = audioQueue.current.shift()
    
    try {
      console.log('Odtwarzam audio z kolejki')
      if (convaiClient.current && typeof convaiClient.current.playAudio === 'function') {
        convaiClient.current.playAudio(nextAudio)
      } else {
        console.error('Metoda playAudio niedostępna w kliencie Convai')
        playNextAudio()
      }
    } catch (error) {
      console.error('Błąd odtwarzania audio:', error)
      playNextAudio()
    }
  }

  const processAudioSegments = () => {
    if (pendingAudioSegments.current.length > 0) {
      console.log('Przetwarzanie zebranych segmentów audio:', pendingAudioSegments.current.length)
      audioQueue.current.push(...pendingAudioSegments.current)
      pendingAudioSegments.current = []
      
      if (!isPlayingAudio.current) {
        playNextAudio()
      }
    }
  }

  // Clear chat when character changes
  useEffect(() => {
    setMessages([])
    setInputMessage('')
    setIsTyping(false)
    userTextStream.current = ""
    npcTextStream.current = ""
    
    // Czyszczenie kolejki audio
    audioQueue.current = []
    isPlayingAudio.current = false
    
    // Cleanup old client
    if (convaiClient.current) {
      if (typeof convaiClient.current.destroy === 'function') {
        convaiClient.current.destroy()
      } else if (typeof convaiClient.current.close === 'function') {
        convaiClient.current.close()
      }
      convaiClient.current = null
    }

    // Initialize new client for the new character
    initClient()
  }, [characterId])

  // Initialize Convai client
  const initClient = async () => {
    try {
      const client = new ConvaiClient({
        apiKey: '2d12bd421e3af7ce47223bce45944908',
        characterId: characterId,
        enableAudio: true,
        faceModal: 3,
        enableFacialData: true,
      })

      // Error callback
      client.setErrorCallback((type, statusMessage) => {
        console.error("Convai Error:", {
          type,
          statusMessage,
          timestamp: new Date().toISOString()
        })
        setIsTyping(false) // Reset typing indicator on error
      })

      // Response callback
      client.setResponseCallback((response) => {
        // Handle user query
        if (response.hasUserQuery()) {
          const transcript = response.getUserQuery()
          if (transcript) {
            userTextStream.current += " " + transcript.getTextData()
            console.log('User Query:', transcript.getTextData())
            
            if (transcript.getIsFinal()) {
              setMessages(prev => [...prev, {
                text: userTextStream.current.trim(),
                sender: 'user'
              }])
              userTextStream.current = ""
            }
          }
        }

        // Handle audio response
        if (response.hasAudioResponse()) {
          const audioResponse = response.getAudioResponse()
          npcTextStream.current += " " + audioResponse.getTextData()
          console.log('Bot Response:', audioResponse.getTextData())
          console.log('Full Response Object:', audioResponse)

          // Zbieramy segmenty audio
          if (audioResponse.array && audioResponse.array[0]) {
            console.log('Dodaję segment audio do kolekcji')
            pendingAudioSegments.current.push(audioResponse.array[0])
            
            // Resetujemy timer za każdym razem gdy otrzymamy nowy segment
            if (audioCollectionTimeout.current) {
              clearTimeout(audioCollectionTimeout.current)
            }
            
            // Ustawiamy timer na przetworzenie zebranych segmentów
            audioCollectionTimeout.current = setTimeout(() => {
              processAudioSegments()
            }, 500) // Czekamy 500ms na kolejne segmenty
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

          setMessages(prev => {
            const lastMessage = prev[prev.length - 1]
            if (lastMessage?.sender === 'bot') {
              const updatedMessages = [...prev]
              updatedMessages[prev.length - 1] = {
                text: npcTextStream.current.trim(),
                sender: 'bot'
              }
              console.log('Updated Bot Message:', npcTextStream.current.trim())
              return updatedMessages
            }
            return [...prev, {
              text: npcTextStream.current.trim(),
              sender: 'bot'
            }]
          })
          
          setIsTyping(false)
        }
      })

      // Audio callbacks
      client.onAudioPlay(() => {
        window.dispatchEvent(new Event('avatar-talking-start'))
      })

      client.onAudioStop(() => {
        window.dispatchEvent(new Event('avatar-talking-end'))
        
        // Po zakończeniu odtwarzania audio, odtwórz następne z kolejki
        console.log('Audio zakończone, sprawdzam kolejkę')
        setTimeout(() => {
          playNextAudio()
        }, 100) // Małe opóźnienie dla stabilności
        
        // Tylko gdy kolejka jest pusta, resetujemy tekst
        if (audioQueue.current.length === 0) {
          npcTextStream.current = ""
          // Reset viseme data when audio stops
          window.visemeData = []
          window.visemeDataActive = false
          window.dispatchEvent(new Event('viseme-data-update'))
          setIsTyping(false) // Ensure typing indicator is removed
        }
      })

      convaiClient.current = client
      
      // Resetujemy stan czatu przy zmianie awatara
      setMessages([])
      npcTextStream.current = ""
      userTextStream.current = ""
      
      // Resetujemy stan automatycznego przywitania
      setAutoGreetingDone(false)
      
      // Oznaczamy, że klient jest gotowy
      setClientReady(true)

      return () => {
        if (audioCollectionTimeout.current) {
          clearTimeout(audioCollectionTimeout.current)
        }
      }

    } catch (error) {
      console.error('Convai initialization error:', error)
      setIsTyping(false) // Reset typing indicator on error
      setClientReady(false)
    }
  }

  const sendTextMessage = async (e) => {
    e?.preventDefault()
    if (!inputMessage.trim()) return

    setIsTyping(true)
    
    setMessages(prev => [...prev, {
      text: inputMessage,
      sender: 'user'
    }])
    
    try {
      await convaiClient.current.sendTextChunk(inputMessage)
      setInputMessage('')
    } catch (error) {
      console.error('Error sending text:', error)
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
    
    // Czyszczenie kolejki audio
    audioQueue.current = []
    isPlayingAudio.current = false
    
    if (convaiClient.current) {
      if (typeof convaiClient.current.destroy === 'function') {
        convaiClient.current.destroy()
      } else if (typeof convaiClient.current.close === 'function') {
        convaiClient.current.close()
      }
      convaiClient.current = null
    }
    
    const initClient = async () => {
      try {
        const initializedClient = new ConvaiClient({
          apiKey: '2d12bd421e3af7ce47223bce45944908',
          characterId: characterId,
          enableAudio: true,
          enableVisemes: true,
          enableLipSync: true,
          visemeFrameRate: 100,
          visemeMapping: {
            0: 'mouthOpen',
            1: 'mouthSmile'
          },
          sessionId: '-1',
          disableAudioGeneration: false
        })
        
        if (initializedClient.audioContext) {
          await new Promise(resolve => setTimeout(resolve, 10))
          await initializedClient.audioContext.resume()
        }
        
        convaiClient.current = initializedClient

        convaiClient.current.setResponseCallback((response) => {
          if (response.hasUserQuery()) {
            const transcript = response.getUserQuery()
            if (transcript.getIsFinal()) {
              userTextStream.current += " " + transcript.getTextData()
              setMessages(prev => [...prev, {
                text: userTextStream.current.trim(),
                sender: 'user'
              }])
              userTextStream.current = ""
            }
          }
          
          if (response.hasAudioResponse()) {
            const audioResponse = response.getAudioResponse()
            
            try {
              const text = audioResponse.array?.[2]
              const audioData = audioResponse.array?.[0]
              
              if (text) {
                npcTextStream.current += text + " "
              }
              
              // Dodajemy audio do kolejki zamiast natychmiastowego odtwarzania
              if (audioData) {
                console.log('Dodaję audio do kolejki (refresh)')
                audioQueue.current.push(audioData)
                
                // Jeśli nie odtwarzamy obecnie audio, rozpocznij odtwarzanie
                if (!isPlayingAudio.current) {
                  playNextAudio()
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
            } catch (error) {
              console.error('Błąd przetwarzania wiadomości:', error)
            }
          }
        })

        convaiClient.current.onAudioPlay(() => {
          window.dispatchEvent(new Event('avatar-talking-start'))
        })

        convaiClient.current.onAudioStop(() => {
          window.dispatchEvent(new Event('avatar-talking-end'))
          
          // Po zakończeniu odtwarzania audio, odtwórz następne z kolejki
          console.log('Audio zakończone, sprawdzam kolejkę (refresh)')
          setTimeout(() => {
            playNextAudio()
          }, 100) // Małe opóźnienie dla stabilności
          
          // Tylko gdy kolejka jest pusta, resetujemy tekst
          if (audioQueue.current.length === 0) {
            npcTextStream.current = ""
            // Reset viseme data when audio stops
            window.visemeData = []
            window.visemeDataActive = false
            window.dispatchEvent(new Event('viseme-data-update'))
          }
        })
      } catch (error) {
        console.error('Init error:', error)
      }
    }
    
    await initClient()
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
        setMicError('')
        setIsRecording(true)
        userTextStream.current = ""
        npcTextStream.current = ""
        convaiClient.current.startAudioChunk()
      } else {
        setIsRecording(false)
        setTimeout(() => {
          convaiClient.current.endAudioChunk()
        }, 500)
      }
    } catch (error) {
      setMicError('Brak dostępu do mikrofonu! Kliknij ikonę kłódki w pasku przeglądarki i zezwól na dostęp.')
      setIsRecording(false)
      setIsMicPermissionGranted(false)
    }
  }

  // Automatyczne przywitanie po załadowaniu awatara
  useEffect(() => {
    const sendGreeting = async () => {
      if (convaiClient.current && !autoGreetingDone && characterId === AVATAR_IDS[1] && clientReady) {
        setIsTyping(true)
        try {
          // Wysyłamy ukrytą wiadomość, która spowoduje przywitanie awatara
          await convaiClient.current.sendTextChunk("Przywitaj się i przedstaw się kim jesteś")
          setAutoGreetingDone(true)
        } catch (error) {
          console.error('Error sending greeting:', error)
          setIsTyping(false)
        }
      }
    }

    // Opóźniamy przywitanie o 2 sekundy, aby dać czas na załadowanie awatara
    const timer = setTimeout(() => {
      sendGreeting()
    }, 2000)

    return () => clearTimeout(timer)
  }, [autoGreetingDone, characterId, clientReady])

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
                  className={`message ${msg.sender} ${msg.error ? 'error' : ''}`}
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
              {micError && (
                <div className="message error">
                  <div className="mic-error-message">
                    {micError}
                    <div className="mic-error-icon">🎤❌</div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="chat-controls">
              <form onSubmit={sendTextMessage} className="chat-input-form">
                <button 
                  type="button" 
                  className={`mic-button ${isRecording ? 'recording' : ''}`}
                  onClick={handleMicrophoneClick}
                  title={isRecording ? "Zatrzymaj nagrywanie" : "Rozpocznij nagrywanie"}
                >
                  {isRecording ? <MdMicOff /> : <MdMic />}
                </button>
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Napisz wiadomość..."
                  className="chat-input"
                />
                <button type="submit" className="chat-send-button" title="Wyślij">
                  <MdSend />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </Draggable>
  )
} 