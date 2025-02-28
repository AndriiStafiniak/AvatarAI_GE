import React, { useState, useEffect } from 'react'

const [visemeData, setVisemeData] = useState([])

useEffect(() => {
  const handleAudioResponse = (response) => {
    if (response?.audioResponse) {
      const audioResponse = response.audioResponse
      
      // Przetwarzanie danych wizemów
      try {
        if (audioResponse.hasVisemesData()) {
          const visemesData = audioResponse.getVisemesData()
          const processedData = visemesData.getVisemesList().map(v => ({
            weights: v.getWeightsList().map(w => Math.min(w, 1)),
            timing: { start: v.getStartTime(), end: v.getEndTime() }
          }))
          setVisemeData(processedData)
          window.visemeData = processedData.flatMap(v => v.weights)
        }
      } catch (error) {
        console.error('Błąd przetwarzania wizemów:', error)
      }

      // Reszta istniejącej logiki...
      const newMessage = {
        sender: "npc",
        content: client?.npcText,
        visemes: processedData // Dodaj dane wizemów do wiadomości
      }
      setMessages((prev) => [...prev, newMessage])
    }
  }

  // Zarejestruj listener odpowiedzi audio
  client.convaiClient?.setResponseCallback(handleAudioResponse)

  return () => {
    client.convaiClient?.setResponseCallback(null)
  }
}, [client?.npcText, client?.isTalking]) 