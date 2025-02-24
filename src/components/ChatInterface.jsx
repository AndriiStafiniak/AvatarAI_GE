import React, { useState, useRef, useEffect } from 'react'
import Draggable from 'react-draggable'
import './ChatInterface.css'
import { MdSend, MdRefresh, MdExpandMore, MdExpandLess } from 'react-icons/md'
import { ConvaiClient } from 'convai-web-sdk'

const DEFAULT_QUESTION = "Cześć! Jak się masz?"

export function ChatInterface({ characterId }) {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showStarterQuestion, setShowStarterQuestion] = useState(true)
  const messagesEndRef = useRef(null)
  const chatContainerRef = useRef(null)
  const nodeRef = useRef(null)
  
  // Convai Client refs
  const convaiClient = useRef(null)
  const finalizedUserText = useRef("")
  const npcTextRef = useRef("")

  // Dodajemy nowy stan i ikony
  const [isExpanded, setIsExpanded] = useState(true)

  // Funkcja do przełączania stanu
  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  useEffect(() => {
    let initializedClient = null
    const initClient = async () => {
      try {
        initializedClient = new ConvaiClient({
          apiKey: '2d12bd421e3af7ce47223bce45944908',
          characterId: characterId,
          enableAudio: true,
          sessionId: '-1',
          disableAudioGeneration: false
        })
        
        if (initializedClient.audioContext) {
          try {
            await new Promise(resolve => setTimeout(resolve, 100))
            await initializedClient.audioContext.resume()
          } catch (audioError) {
            console.error('Audio Context Error:', audioError)
          }
        }
        
        convaiClient.current = initializedClient

        // Setup response callback
        convaiClient.current.setResponseCallback((response) => {
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
            npcTextRef.current = audioResponse.getTextData()
            setIsTyping(false)
            
            setMessages(prev => [...prev, {
              text: npcTextRef.current,
              sender: 'bot',
              audio: audioResponse.getAudioData()
            }])
          }
        })

        // Setup audio handlers
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

    initClient()
    return () => {
      if (initializedClient) {
        if (typeof initializedClient.destroy === 'function') {
          initializedClient.destroy()
        } else if (typeof initializedClient.close === 'function') {
          initializedClient.close()
        } else {
          console.warn('ConvaiClient has no destroy/close method')
        }
      }
    }
  }, [characterId])

  const sendTextMessage = async (e) => {
    e?.preventDefault()
    if (!inputMessage.trim()) return

    setShowStarterQuestion(false)
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
    setShowStarterQuestion(true)
    
    // Reinitialize Convai client
    if (convaiClient.current) {
      if (typeof convaiClient.current.destroy === 'function') {
        convaiClient.current.destroy()
      } else if (typeof convaiClient.current.close === 'function') {
        convaiClient.current.close()
      }
      convaiClient.current = null
    }
    
    // Initialize new client
    const initClient = async () => {
      try {
        const initializedClient = new ConvaiClient({
          apiKey: '2d12bd421e3af7ce47223bce45944908',
          characterId: characterId,
          enableAudio: true,
          sessionId: '-1',
          disableAudioGeneration: false
        })
        
        if (initializedClient.audioContext) {
          try {
            await new Promise(resolve => setTimeout(resolve, 100))
            await initializedClient.audioContext.resume()
          } catch (audioError) {
            console.error('Audio Context Error:', audioError)
          }
        }
        
        convaiClient.current = initializedClient

        // Setup response callback
        convaiClient.current.setResponseCallback((response) => {
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
            npcTextRef.current = audioResponse.getTextData()
            setIsTyping(false)
            
            setMessages(prev => [...prev, {
              text: npcTextRef.current,
              sender: 'bot',
              audio: audioResponse.getAudioData()
            }])
          }
        })

        // Setup audio handlers
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
        <div className="chat-header" onClick={toggleExpand}>
          <span>Chat</span>
          <div className="header-controls">
            <button 
              className="refresh-button" 
              onClick={handleRefresh}
              title="Odśwież czat"
            >
              <MdRefresh />
            </button>
            {isExpanded ? (
              <MdExpandMore className="expand-icon" />
            ) : (
              <MdExpandLess className="expand-icon" />
            )}
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