import React, { useState, useRef, useEffect } from 'react'
import Draggable from 'react-draggable'
import './ChatInterface.css'
import { MdSend, MdRefresh, MdExpandMore, MdExpandLess } from 'react-icons/md'
import { ConvaiClient } from 'convai-web-sdk'

export default function ChatInterface({ characterId }) {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const chatContainerRef = useRef(null)
  const nodeRef = useRef(null)
  
  const convaiClient = useRef(null)
  const finalizedUserText = useRef("")
  const npcTextRef = useRef("")
  const botResponseText = useRef("")
  const botAudioData = useRef([])

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
          if (response.hasUserQuery()) {
            const transcript = response.getUserQuery()
            if (transcript.getIsFinal()) {
              finalizedUserText.current += " " + transcript.getTextData()
              setMessages(prev => [...prev, {
                text: finalizedUserText.current.trim(),
                sender: 'user'
              }])
              finalizedUserText.current = ""
              botResponseText.current = ""
              botAudioData.current = []
            }
          }
          
          if (response.hasAudioResponse()) {
            const audioResponse = response.getAudioResponse()
            
            try {
              const text = audioResponse.array?.[2]
              const audioData = audioResponse.array?.[0]
              
              if (text) {
                botResponseText.current += text + " "
              }
              if (audioData) {
                botAudioData.current.push(audioData)
              }
              
              if (text && audioData) {
                window.visemeData = []
                window.visemeDataActive = false
                
                const totalAudioLength = botAudioData.current.reduce((acc, curr) => acc + curr.length, 0)
                const audioLengthSeconds = totalAudioLength / 22050
                
                const framesPerSecond = 60
                const totalFrames = Math.ceil(audioLengthSeconds * framesPerSecond)
                const cycleLength = 0.8
                const pauseLength = 0.3 // 0.1s pauzy między cyklami
                const fullCycleLength = cycleLength + pauseLength
                const framesPerFullCycle = Math.ceil(fullCycleLength * framesPerSecond)
                const framesPerCycle = Math.ceil(cycleLength * framesPerSecond)
                const framesPerPause = Math.ceil(pauseLength * framesPerSecond)
                
                const frames = []
                
                for (let i = 0; i < totalFrames; i++) {
                  const cyclePosition = (i % framesPerFullCycle)
                  
                  if (cyclePosition < framesPerCycle) {
                    // Podczas aktywnej części cyklu - usta się ruszają
                    const activePosition = cyclePosition / framesPerCycle
                    const openAmount = Math.sin(activePosition * Math.PI) * 0.7
                    frames.push([Math.max(0, openAmount), 0])
                  } else {
                    // Podczas pauzy - usta zamknięte
                    frames.push([0, 0])
                  }
                }
                
                window.visemeData = frames
                window.visemeDataActive = true
                window.dispatchEvent(new Event('viseme-data-update'))
              }

              npcTextRef.current = botResponseText.current.trim()
              setIsTyping(false)
              
              if (!response.hasUserQuery()) {
                setMessages(prev => {
                  const lastMessage = prev[prev.length - 1]
                  if (lastMessage && lastMessage.sender === 'bot') {
                    const updatedMessages = [...prev]
                    updatedMessages[prev.length - 1] = {
                      text: botResponseText.current.trim(),
                      sender: 'bot',
                      audio: botAudioData.current
                    }
                    return updatedMessages
                  } else {
                    return [...prev, {
                      text: botResponseText.current.trim(),
                      sender: 'bot',
                      audio: botAudioData.current
                    }]
                  }
                })
              }
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
          await new Promise(resolve => setTimeout(resolve, 10))
          await initializedClient.audioContext.resume()
        }
        
        convaiClient.current = initializedClient

        convaiClient.current.setResponseCallback((response) => {
          if (response.hasUserQuery()) {
            const transcript = response.getUserQuery()
            if (transcript.getIsFinal()) {
              finalizedUserText.current += " " + transcript.getTextData()
              setMessages(prev => [...prev, {
                text: finalizedUserText.current.trim(),
                sender: 'user'
              }])
              finalizedUserText.current = ""
              botResponseText.current = ""
              botAudioData.current = []
            }
          }
          
          if (response.hasAudioResponse()) {
            const audioResponse = response.getAudioResponse()
            
            try {
              const text = audioResponse.array?.[2]
              const audioData = audioResponse.array?.[0]
              
              if (text) {
                botResponseText.current += text + " "
              }
              if (audioData) {
                botAudioData.current.push(audioData)
              }
              
              if (text && audioData) {
                window.visemeData = []
                window.visemeDataActive = false
                
                const totalAudioLength = botAudioData.current.reduce((acc, curr) => acc + curr.length, 0)
                const audioLengthSeconds = totalAudioLength / 22050
                
                const framesPerSecond = 60
                const totalFrames = Math.ceil(audioLengthSeconds * framesPerSecond)
                const cycleLength = 0.9
                const pauseLength = 0.3 // 0.1s pauzy między cyklami
                const fullCycleLength = cycleLength + pauseLength
                const framesPerFullCycle = Math.ceil(fullCycleLength * framesPerSecond)
                const framesPerCycle = Math.ceil(cycleLength * framesPerSecond)
                const framesPerPause = Math.ceil(pauseLength * framesPerSecond)
                
                const frames = []
                
                for (let i = 0; i < totalFrames; i++) {
                  const cyclePosition = (i % framesPerFullCycle)
                  
                  if (cyclePosition < framesPerCycle) {
                    // Podczas aktywnej części cyklu - usta się ruszają
                    const activePosition = cyclePosition / framesPerCycle
                    const openAmount = Math.sin(activePosition * Math.PI) * 0.7
                    frames.push([Math.max(0, openAmount), 0])
                  } else {
                    // Podczas pauzy - usta zamknięte
                    frames.push([0, 0])
                  }
                }
                
                window.visemeData = frames
                window.visemeDataActive = true
                window.dispatchEvent(new Event('viseme-data-update'))
              }

              npcTextRef.current = botResponseText.current.trim()
              setIsTyping(false)
              
              if (!response.hasUserQuery()) {
                setMessages(prev => {
                  const lastMessage = prev[prev.length - 1]
                  if (lastMessage && lastMessage.sender === 'bot') {
                    const updatedMessages = [...prev]
                    updatedMessages[prev.length - 1] = {
                      text: botResponseText.current.trim(),
                      sender: 'bot',
                      audio: botAudioData.current
                    }
                    return updatedMessages
                  } else {
                    return [...prev, {
                      text: botResponseText.current.trim(),
                      sender: 'bot',
                      audio: botAudioData.current
                    }]
                  }
                })
              }
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