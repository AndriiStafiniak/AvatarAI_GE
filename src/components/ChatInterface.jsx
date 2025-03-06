import React, { useState, useRef, useEffect } from 'react'
import Draggable from 'react-draggable'
import './ChatInterface.css'
import { MdSend, MdRefresh, MdExpandMore, MdExpandLess, MdMic, MdMicOff } from 'react-icons/md'
import { ConvaiClient } from 'convai-web-sdk'

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

  // Clear chat when character changes
  useEffect(() => {
    setMessages([])
    setInputMessage('')
    setIsTyping(false)
    userTextStream.current = ""
    npcTextStream.current = ""
    
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
        console.error("Convai Error:", type, statusMessage)
        setIsTyping(false) // Reset typing indicator on error
      })

      // Response callback
      client.setResponseCallback((response) => {
        // Handle user query
        if (response.hasUserQuery()) {
          const transcript = response.getUserQuery()
          if (transcript?.getIsFinal()) {
            userTextStream.current += " " + transcript.getTextData()
            setMessages(prev => [...prev, {
              text: userTextStream.current.trim(),
              sender: 'user'
            }])
            userTextStream.current = ""
          }
        }

        // Handle audio response
        if (response.hasAudioResponse()) {
          const audioResponse = response.getAudioResponse()
          npcTextStream.current += " " + audioResponse.getTextData()

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
              return updatedMessages
            }
            return [...prev, {
              text: npcTextStream.current.trim(),
              sender: 'bot'
            }]
          })
          
          // Reset typing indicator when we get a response
          setIsTyping(false)
        }
      })

      // Audio callbacks
      client.onAudioPlay(() => {
        window.dispatchEvent(new Event('avatar-talking-start'))
      })

      client.onAudioStop(() => {
        window.dispatchEvent(new Event('avatar-talking-end'))
        npcTextStream.current = ""
        // Reset viseme data when audio stops
        window.visemeData = []
        window.visemeDataActive = false
        window.dispatchEvent(new Event('viseme-data-update'))
        setIsTyping(false) // Ensure typing indicator is removed
      })

      convaiClient.current = client

      return () => {
        // Cleanup event listeners
      }

    } catch (error) {
      console.error('Convai initialization error:', error)
      setIsTyping(false) // Reset typing indicator on error
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
              if (audioData) {
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
          npcTextStream.current = ""
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

  const handleMicrophoneClick = () => {
    if (!convaiClient.current) return
    
    if (!isRecording) {
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