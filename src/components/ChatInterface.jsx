import React, { useState, useRef, useEffect } from 'react'
import Draggable from 'react-draggable'
import './ChatInterface.css'
import { MdSend, MdRefresh, MdExpandMore, MdExpandLess } from 'react-icons/md'
import { ConvaiClient } from 'convai-web-sdk'

export function ChatInterface({ characterId }) {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const chatContainerRef = useRef(null)
  const nodeRef = useRef(null)
  
  const convaiClient = useRef(null)
  const finalizedUserText = useRef("")
  const npcTextRef = useRef("")

  const [isExpanded, setIsExpanded] = useState(true)

  useEffect(() => {
    let initializedClient = null
    
    const initClient = async () => {
      try {
        initializedClient = new ConvaiClient({
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
          await initializedClient.audioContext.resume()
        }
        
        convaiClient.current = initializedClient

        convaiClient.current.setResponseCallback((response) => {
          console.log('Otrzymano odpowiedź:', response)
          if (response.hasUserQuery()) {
            const transcript = response.getUserQuery()
            if (transcript.getIsFinal()) {
              finalizedUserText.current += " " + transcript.getTextData()
              setMessages(prev => [...prev, {
                text: finalizedUserText.current,
                sender: 'user'
              }])
            }
          }
          
          if (response.hasAudioResponse()) {
            const audioResponse = response.getAudioResponse()
            console.log('Pełna odpowiedź audio:', audioResponse)
            
            try {
              // Generuj prostą animację otwierania/zamykania ust
              const text = audioResponse.array?.[2]
              if (text) {
                console.log('Generuję animację mówienia dla:', text)
                
                // Generuj około 2 klatki na znak tekstu
                const frameCount = text.length * 2
                const frames = []
                
                // Generuj naprzemiennie otwarte i zamknięte usta
                for (let i = 0; i < frameCount; i++) {
                  if (i % 2 === 0) {
                    frames.push([0.7, 0]) // Usta otwarte
                  } else {
                    frames.push([0, 0]) // Usta zamknięte
                  }
                }
                
                console.log('Wygenerowano klatki animacji:', frames.length)
                window.visemeData = frames
                window.visemeDataActive = true
                window.dispatchEvent(new Event('viseme-data-update'))
              }

              npcTextRef.current = text || ''
              setIsTyping(false)
              
              setMessages(prev => [...prev, {
                text: npcTextRef.current,
                sender: 'bot',
                audio: audioResponse.array?.[0]
              }])
            } catch (error) {
              console.error('Błąd przetwarzania audio response:', error)
              console.error('Stack:', error.stack)
            }
          }
        })

        convaiClient.current.onAudioPlay(() => {
          window.dispatchEvent(new Event('avatar-talking-start'))
        })

        convaiClient.current.onAudioStop(() => {
          window.dispatchEvent(new Event('avatar-talking-end'))
        })
      } catch (error) {
        console.error('[Chat] Init error:', error)
      }
    }

    initClient()
    return () => {
      if (initializedClient) {
        if (typeof initializedClient.destroy === 'function') {
          initializedClient.destroy()
        } else if (typeof initializedClient.close === 'function') {
          initializedClient.close()
        }
      }
    }
  }, [characterId])

  useEffect(() => {
    const clearVisemeData = () => {
      window.visemeData = []
      window.visemeDataActive = false
    }
    
    window.addEventListener('avatar-talking-end', clearVisemeData)
    return () => window.removeEventListener('avatar-talking-end', clearVisemeData)
  }, [])

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
          await new Promise(resolve => setTimeout(resolve, 100))
          await initializedClient.audioContext.resume()
        }
        
        convaiClient.current = initializedClient

        convaiClient.current.setResponseCallback((response) => {
          console.log('Otrzymano odpowiedź:', response)
          if (response.hasUserQuery()) {
            const transcript = response.getUserQuery()
            if (transcript.getIsFinal()) {
              finalizedUserText.current += " " + transcript.getTextData()
              setMessages(prev => [...prev, {
                text: finalizedUserText.current,
                sender: 'user'
              }])
            }
          }
          
          if (response.hasAudioResponse()) {
            const audioResponse = response.getAudioResponse()
            console.log('Pełna odpowiedź audio:', audioResponse)
            
            try {
              // Generuj prostą animację otwierania/zamykania ust
              const text = audioResponse.array?.[2]
              if (text) {
                console.log('Generuję animację mówienia dla:', text)
                
                // Generuj około 2 klatki na znak tekstu
                const frameCount = text.length * 2
                const frames = []
                
                // Generuj naprzemiennie otwarte i zamknięte usta
                for (let i = 0; i < frameCount; i++) {
                  if (i % 2 === 0) {
                    frames.push([0.7, 0]) // Usta otwarte
                  } else {
                    frames.push([0, 0]) // Usta zamknięte
                  }
                }
                
                console.log('Wygenerowano klatki animacji:', frames.length)
                window.visemeData = frames
                window.visemeDataActive = true
                window.dispatchEvent(new Event('viseme-data-update'))
              }

              npcTextRef.current = text || ''
              setIsTyping(false)
              
              setMessages(prev => [...prev, {
                text: npcTextRef.current,
                sender: 'bot',
                audio: audioResponse.array?.[0]
              }])
            } catch (error) {
              console.error('Błąd przetwarzania audio response:', error)
              console.error('Stack:', error.stack)
            }
          }
        })

        convaiClient.current.onAudioPlay(() => {
          window.dispatchEvent(new Event('avatar-talking-start'))
        })

        convaiClient.current.onAudioStop(() => {
          window.dispatchEvent(new Event('avatar-talking-end'))
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