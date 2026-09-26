import { useState, useRef, useEffect } from 'react'
import { sendChatMessage } from '../services/api.js'

export default function ChatbotWidget({ sessionId }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  async function handleSend() {
    const text = inputText.trim()
    if (!text || text.length > 500 || isTyping) return

    const userMsg = { id: Date.now(), role: 'user', text }
    setMessages((prev) => [...prev, userMsg])
    setInputText('')
    setIsTyping(true)

    try {
      const result = await sendChatMessage(text)
      const botMsg = { id: Date.now() + 1, role: 'assistant', text: result.response }
      setMessages((prev) => [...prev, botMsg])
    } catch {
      const errMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        text: 'Przepraszam, wystąpił błąd. Spróbuj ponownie.',
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setIsTyping(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {isOpen && (
        <div className="chatbot-panel" role="dialog" aria-label="Chatbot PoolTracker">
          <div className="chatbot-panel__header">
            💬 Chatbot PoolTracker
          </div>

          <div className="chatbot-panel__messages" aria-live="polite">
            {messages.length === 0 && (
              <p style={{ color: '#6c757d', fontSize: '0.85rem', textAlign: 'center' }}>
                Witaj! Zapytaj mnie o baseny w Białymstoku.
              </p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-message chat-message--${msg.role}`}
              >
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {isTyping && (
            <div className="typing-indicator" aria-live="polite">
              Bot pisze...
            </div>
          )}

          <div className="chatbot-panel__input">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Napisz wiadomość..."
              maxLength={500}
              aria-label="Wiadomość do chatbota"
              disabled={isTyping}
            />
            <button
              onClick={handleSend}
              disabled={isTyping || !inputText.trim()}
              aria-label="Wyślij"
            >
              Wyślij
            </button>
          </div>
        </div>
      )}

      <button
        className="chatbot-fab"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Zamknij chatbot' : 'Otwórz chatbot'}
      >
        {isOpen ? '✕' : '💬'}
      </button>
    </>
  )
}
