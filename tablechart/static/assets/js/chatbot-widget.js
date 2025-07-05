/**
 * PoolTracker Chatbot Widget
 * Nowoczesny, responsywny widget chatbota z pełną funkcjonalnością
 */

class ChatbotWidget {
  constructor(options = {}) {
    this.config = {
      apiEndpoint: '/chatbot/api/chat/',
      maxMessageLength: 1000,
      animationDuration: 300,
      typingDelay: 1000,
      persistHistory: true,
      maxHistoryLength: 100,
      ...options
    };
    
    this.state = {
      isOpen: false,
      sessionId: null,
      isTyping: false,
      messageHistory: [],
      unreadCount: 0
    };
    
    this.elements = {};
    this.init();
  }
  
  /**
   * Inicjalizacja widgetu
   */
  init() {
    // Wyczyść historię i localStorage przy każdym ładowaniu strony
    localStorage.removeItem('pooltracker_chatbot_state');
    this.state.messageHistory = [];
    this.bindElements();
    this.bindEvents();
    // Ustaw powitalną wiadomość
    this.elements.messages.innerHTML = `
      <div class="message bot-message">
        <div class="message-avatar">
          <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
          <div class="message-text">
              Cześć, jestem Basenowym Czatbotem! 👋<br>
              Mogę pomóc dla Ciebie z informacjami o basenach i zaplanowaniem wizyty na pływalni 🏊‍♂️<br>
              W czym mogę pomóc?
          </div>
          <div class="message-time">
            <span class="time-text">Teraz</span>
          </div>
        </div>
      </div>
    `;
    this.animateWidgetEntry();
    console.log('PoolTracker Chatbot Widget initialized');
  }
  
  /**
   * Powiązanie elementów DOM
   */
  bindElements() {
    this.elements = {
      widget: document.getElementById('chat-widget'),
      button: document.getElementById('chat-button'),
      window: document.getElementById('chat-window'),
      header: document.getElementById('chat-header'),
      body: document.getElementById('chat-body'),
      messages: document.getElementById('chat-messages'),
      input: document.getElementById('chat-input'),
      sendBtn: document.getElementById('chat-send'),
      closeBtn: document.getElementById('chat-close'),
      typingIndicator: document.getElementById('typing-indicator'),
      notificationDot: document.getElementById('notification-dot'),
      charCounter: document.getElementById('char-counter')
    };
  }
  
  /**
   * Powiązanie zdarzeń
   */
  bindEvents() {
    // Przycisk otwierania/zamykania
    this.elements.button.addEventListener('click', () => this.toggleChat());
    
    // Kontrolki okna
    this.elements.closeBtn.addEventListener('click', () => this.closeChat());
    
    // Wysyłanie wiadomości
    this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
    this.elements.input.addEventListener('keydown', (e) => this.handleInputKeydown(e));
    this.elements.input.addEventListener('input', () => this.handleInputChange());
    
    // Auto-resize textarea
    this.elements.input.addEventListener('input', () => this.autoResizeTextarea());
    
    // Oznaczanie jako przeczytane przy otwieraniu
    this.elements.window.addEventListener('transitionend', () => {
      if (this.state.isOpen) {
        this.markAsRead();
      }
    });
    
    // Kliknięcie poza widget
    document.addEventListener('click', (e) => this.handleOutsideClick(e));
    
    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.state.isOpen) {
        this.closeChat();
      }
    });
  }
  
  /**
   * Animacja wejścia widgetu
   */
  animateWidgetEntry() {
    this.elements.widget.classList.add('initializing');
    setTimeout(() => {
      this.elements.widget.classList.remove('initializing');
    }, 600);
  }
  
  /**
   * Przełączenie stanu okna czatu
   */
  toggleChat() {
    if (this.state.isOpen) {
      this.closeChat();
    } else {
      this.openChat();
    }
  }
  
  /**
   * Otwarcie okna czatu
   */
  openChat() {
    this.state.isOpen = true;
    this.elements.widget.classList.add('open');
    this.elements.input.focus();
    this.markAsRead();
    this.persistState();
  }
  
  /**
   * Minimalizacja okna czatu
   */
  minimizeChat() {
    this.state.isMinimized = !this.state.isMinimized;
    this.elements.body.classList.toggle('minimized', this.state.isMinimized);
    if (!this.state.isMinimized) {
      this.elements.input.focus();
    }
    this.persistState();
  }
  
  /**
   * Zamknięcie okna czatu
   */
  closeChat() {
    this.state.isOpen = false;
    this.elements.widget.classList.remove('open');
    this.persistState();
  }
  
  /**
   * Obsługa naciśnięcia klawisza w polu input
   */
  handleInputKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
    }
  }
  
  /**
   * Obsługa zmiany tekstu w polu input
   */
  handleInputChange() {
    const length = this.elements.input.value.length;
    this.elements.charCounter.textContent = length;
    
    // Wyłączenie przycisku wysyłania gdy za długo
    if (length > this.config.maxMessageLength) {
      this.elements.sendBtn.disabled = true;
      this.elements.input.style.borderColor = '#ff4757';
    } else {
      this.elements.sendBtn.disabled = false;
      this.elements.input.style.borderColor = '';
    }
  }
  
  /**
   * Automatyczne rozszerzanie textarea
   */
  autoResizeTextarea() {
    const textarea = this.elements.input;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
  }
  
  /**
   * Obsługa kliknięcia poza widget
   */
  handleOutsideClick(e) {
    if (!this.elements.widget.contains(e.target) && this.state.isOpen) {
      // Opcjonalnie: auto-zamykanie po kliknięciu poza widget
      // this.closeChat();
    }
  }
  
  /**
   * Wysłanie wiadomości
   */
  async sendMessage() {
    const message = this.elements.input.value.trim();
    if (!message || this.state.isTyping) return;
    
    // Dodanie wiadomości użytkownika
    this.addMessage(message, 'user');
    this.elements.input.value = '';
    this.elements.charCounter.textContent = '0';
    this.autoResizeTextarea();
    
    // Zablokuj input na czas odpowiedzi bota
    this.elements.input.disabled = true;
    
    // Pokazanie wskaźnika pisania
    this.showTypingIndicator();
    
    try {
      // Wywołanie API
      const response = await this.callChatAPI(message);
      
      // Ukrycie wskaźnika pisania
      this.hideTypingIndicator();
      
      // Dodanie odpowiedzi bota
      this.addMessage(response.response, 'bot');
      
      // Zapisanie session ID
      if (response.session_id) {
        this.state.sessionId = response.session_id;
        this.persistState();
      }
      
    } catch (error) {
      console.error('Chatbot error:', error);
      this.hideTypingIndicator();
      this.addMessage('Przepraszam, wystąpił błąd. Spróbuj ponownie później.', 'bot', true);
    }
  }
  
  /**
   * Wywołanie API chatbota
   */
  async callChatAPI(message) {
    const response = await fetch(this.config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': this.getCSRFToken()
      },
      body: JSON.stringify({
        message: message,
        session_id: this.state.sessionId
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  }
  
  /**
   * Dodanie wiadomości do czatu
   */
  addMessage(content, sender = 'bot', isError = false) {
    const messageData = {
      content,
      sender,
      timestamp: new Date().toISOString(),
      isError
    };
    // Dodanie do historii
    this.state.messageHistory.push(messageData);
    this.trimMessageHistory();
    // Utworzenie elementu wiadomości
    const messageElement = this.createMessageElement(messageData);
    this.elements.messages.appendChild(messageElement);
    // Przewinięcie na dół
    this.scrollToBottom();
    // Upewnij się, że input jest aktywny po każdej wiadomości bota
    if (sender === 'bot') {
      this.elements.input.disabled = false;
      this.elements.input.focus();
    }
    // Powiadomienie jeśli okno zamknięte
    if (!this.state.isOpen && sender === 'bot') {
      this.showNotification();
    }
    // Persist history
    if (this.config.persistHistory) {
      this.persistState();
    }
  }
  
  /**
   * Utworzenie elementu wiadomości
   */
  createMessageElement(messageData) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${messageData.sender}-message`;
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    avatarDiv.innerHTML = messageData.sender === 'user' ? 
      '<i class="fas fa-user"></i>' : 
      '<i class="fas fa-robot"></i>';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    if (messageData.isError) {
      textDiv.style.background = '#ff4757';
      textDiv.style.color = 'white';
    }
    textDiv.textContent = messageData.content;
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.innerHTML = `<span class="time-text">${this.formatTime(messageData.timestamp)}</span>`;
    
    contentDiv.appendChild(textDiv);
    contentDiv.appendChild(timeDiv);
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    
    return messageDiv;
  }
  
  /**
   * Formatowanie czasu
   */
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Teraz';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min temu`;
    if (diff < 86400000) return date.toLocaleTimeString('pl-PL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    return date.toLocaleDateString('pl-PL', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  /**
   * Pokazanie wskaźnika pisania
   */
  showTypingIndicator() {
    this.state.isTyping = true;
    this.elements.typingIndicator.style.display = 'block';
    this.elements.sendBtn.disabled = true;
    this.scrollToBottom();
  }
  
  /**
   * Ukrycie wskaźnika pisania
   */
  hideTypingIndicator() {
    this.state.isTyping = false;
    this.elements.typingIndicator.style.display = 'none';
    this.elements.sendBtn.disabled = false;
    this.elements.input.disabled = false;
    this.elements.input.focus();
    this.scrollToBottom();
  }
  
  /**
   * Przewinięcie na dół
   */
  scrollToBottom() {
    setTimeout(() => {
      this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }, 50);
  }
  
  /**
   * Pokazanie powiadomienia
   */
  showNotification() {
    this.state.unreadCount++;
    this.elements.notificationDot.classList.add('show');
  }
  
  /**
   * Oznaczenie jako przeczytane
   */
  markAsRead() {
    this.state.unreadCount = 0;
    this.elements.notificationDot.classList.remove('show');
  }
  
  /**
   * Przycinanie historii wiadomości
   */
  trimMessageHistory() {
    if (this.state.messageHistory.length > this.config.maxHistoryLength) {
      this.state.messageHistory = this.state.messageHistory.slice(-this.config.maxHistoryLength);
    }
  }
  
  /**
   * Pobieranie CSRF tokenu
   */
  getCSRFToken() {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrftoken') {
        return decodeURIComponent(value);
      }
    }
    
    // Alternatywnie z meta tagu
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    return metaTag ? metaTag.getAttribute('content') : '';
  }
  
  /**
   * Zapisanie stanu do localStorage
   */
  persistState() {
    if (!this.config.persistHistory) return;
    
    const data = {
      sessionId: this.state.sessionId,
      messageHistory: this.state.messageHistory,
      isOpen: this.state.isOpen
    };
    
    localStorage.setItem('pooltracker_chatbot_state', JSON.stringify(data));
  }
  
  /**
   * Wczytanie zapisanego stanu
   */
  loadPersistedData() {
    if (!this.config.persistHistory) return;
    
    try {
      const data = JSON.parse(localStorage.getItem('pooltracker_chatbot_state') || '{}');
      
      if (data.sessionId) {
        this.state.sessionId = data.sessionId;
      }
      
      if (data.messageHistory && Array.isArray(data.messageHistory)) {
        this.state.messageHistory = data.messageHistory;
        this.restoreMessageHistory();
      }
      
      // Nie przywracamy stanu otwarcia okna dla lepszego UX
      
    } catch (error) {
      console.warn('Failed to load persisted chatbot state:', error);
    }
  }
  
  /**
   * Przywrócenie historii wiadomości
   */
  restoreMessageHistory() {
    // Usunięcie wiadomości powitalnej jeśli są inne wiadomości
    if (this.state.messageHistory.length > 0) {
      this.elements.messages.innerHTML = '';
    }
    
    this.state.messageHistory.forEach(messageData => {
      const messageElement = this.createMessageElement(messageData);
      this.elements.messages.appendChild(messageElement);
    });
    
    this.scrollToBottom();
  }
  
  /**
   * Publiczne API
   */
  
  // Programowe otwieranie czatu
  open() {
    this.openChat();
  }
  
  // Programowe zamykanie czatu
  close() {
    this.closeChat();
  }
  
  // Programowe wysyłanie wiadomości
  send(message) {
    if (typeof message === 'string' && message.trim()) {
      this.elements.input.value = message;
      this.sendMessage();
    }
  }
  
  // Czyszczenie historii
  clearHistory() {
    this.state.messageHistory = [];
    this.elements.messages.innerHTML = `
      <div class="message bot-message">
        <div class="message-avatar">
          <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
          <div class="message-text">
              Cześć, jestem Basenowym Czatbotem! 👋<br>
              Mogę pomóc dla Ciebie z informacjami o basenach i zaplanowaniem wizyty na pływalni 🏊‍♂️<br>
              W czym mogę pomóc?
          </div>
          <div class="message-time">
            <span class="time-text">Teraz</span>
          </div>
        </div>
      </div>
    `;
    localStorage.removeItem('pooltracker_chatbot_state');
  }
}

// Inicjalizacja widgetu po załadowaniu DOM
document.addEventListener('DOMContentLoaded', function() {
  // Sprawdzenie czy widget HTML istnieje
  if (document.getElementById('chat-widget')) {
    window.poolTrackerChatbot = new ChatbotWidget();
  }
});

// Export dla użycia w modułach
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChatbotWidget;
}