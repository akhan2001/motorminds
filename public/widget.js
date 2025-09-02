(function() {
    'use strict';
    
    // Widget configuration
    let config = {
        shopId: null,
        position: 'bottom-right',
        primaryColor: '#3B82F6',
        headerText: 'Chat with us',
        welcomeMessage: 'Hello! How can we help you today?',
        zIndex: 9999
    };
    
    // Widget state
    let isOpen = false;
    let isMinimized = false;
    let messages = [];
    let conversationId = null;
    
    // Create widget HTML
    function createWidget() {
        const widgetHTML = `
            <div id="motorminds-widget" style="
                position: fixed;
                ${config.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
                ${config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
                z-index: ${config.zIndex};
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                line-height: 1.4;
            ">
                <!-- Chat Button -->
                <div id="widget-button" style="
                    width: 60px;
                    height: 60px;
                    background: ${config.primaryColor};
                    border-radius: 50%;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                " onclick="toggleWidget()">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                </div>
                
                <!-- Chat Window -->
                <div id="widget-chat" style="
                    position: absolute;
                    ${config.position.includes('bottom') ? 'bottom: 80px;' : 'top: 80px;'}
                    ${config.position.includes('right') ? 'right: 0;' : 'left: 0;'}
                    width: 350px;
                    height: 500px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
                    display: none;
                    flex-direction: column;
                    overflow: hidden;
                ">
                    <!-- Header -->
                    <div style="
                        background: ${config.primaryColor};
                        color: white;
                        padding: 16px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                    ">
                        <div>
                            <div style="font-weight: 600; font-size: 16px;">${config.headerText}</div>
                            <div style="font-size: 12px; opacity: 0.9;">Online now</div>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button onclick="minimizeWidget()" style="
                                background: none;
                                border: none;
                                color: white;
                                cursor: pointer;
                                padding: 4px;
                                border-radius: 4px;
                                opacity: 0.8;
                            ">−</button>
                            <button onclick="closeWidget()" style="
                                background: none;
                                border: none;
                                color: white;
                                cursor: pointer;
                                padding: 4px;
                                border-radius: 4px;
                                opacity: 0.8;
                            ">×</button>
                        </div>
                    </div>
                    
                    <!-- Messages -->
                    <div id="widget-messages" style="
                        flex: 1;
                        padding: 16px;
                        overflow-y: auto;
                        background: #f8fafc;
                    "></div>
                    
                    <!-- Input -->
                    <div style="
                        padding: 16px;
                        border-top: 1px solid #e2e8f0;
                        background: white;
                    ">
                        <div style="display: flex; gap: 8px;">
                            <input id="widget-input" type="text" placeholder="Type your message..." style="
                                flex: 1;
                                padding: 12px;
                                border: 1px solid #d1d5db;
                                border-radius: 8px;
                                outline: none;
                                font-size: 14px;
                            " onkeypress="handleKeyPress(event)">
                            <button onclick="sendMessage()" style="
                                background: ${config.primaryColor};
                                color: white;
                                border: none;
                                padding: 12px 16px;
                                border-radius: 8px;
                                cursor: pointer;
                                font-size: 14px;
                                font-weight: 500;
                            ">Send</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', widgetHTML);
        
        // Add welcome message
        addMessage('assistant', config.welcomeMessage);
    }
    
    // Toggle widget open/close
    function toggleWidget() {
        const chat = document.getElementById('widget-chat');
        const button = document.getElementById('widget-button');
        
        if (isOpen) {
            chat.style.display = 'none';
            button.style.transform = 'scale(1)';
            isOpen = false;
        } else {
            chat.style.display = 'flex';
            button.style.transform = 'scale(1.1)';
            isOpen = true;
            document.getElementById('widget-input').focus();
        }
    }
    
    // Close widget
    function closeWidget() {
        const chat = document.getElementById('widget-chat');
        const button = document.getElementById('widget-button');
        chat.style.display = 'none';
        button.style.transform = 'scale(1)';
        isOpen = false;
    }
    
    // Minimize widget
    function minimizeWidget() {
        const chat = document.getElementById('widget-chat');
        const button = document.getElementById('widget-button');
        chat.style.display = 'none';
        button.style.transform = 'scale(1)';
        isOpen = false;
        isMinimized = true;
    }
    
    // Add message to chat
    function addMessage(role, content) {
        messages.push({ role, content, timestamp: new Date() });
        
        const messagesContainer = document.getElementById('widget-messages');
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            margin-bottom: 12px;
            display: flex;
            ${role === 'user' ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
        `;
        
        const messageBubble = document.createElement('div');
        messageBubble.style.cssText = `
            max-width: 280px;
            padding: 12px 16px;
            border-radius: 18px;
            font-size: 14px;
            word-wrap: break-word;
            ${role === 'user' 
                ? `background: ${config.primaryColor}; color: white;` 
                : 'background: white; color: #1f2937; border: 1px solid #e5e7eb;'
            }
        `;
        messageBubble.textContent = content;
        
        messageDiv.appendChild(messageBubble);
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Handle Enter key press
    function handleKeyPress(event) {
        if (event.key === 'Enter') {
            sendMessage();
        }
    }
    
    // Send message
    async function sendMessage() {
        const input = document.getElementById('widget-input');
        const message = input.value.trim();
        
        if (!message || !config.shopId) return;
        
        // Add user message
        addMessage('user', message);
        input.value = '';
        
        // Show typing indicator
        const typingId = addTypingIndicator();
        
        try {
            const response = await fetch('/api/widget/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: [...messages],
                    conversation_id: conversationId,
                    shopId: config.shopId,
                    isBookingMode: false
                })
            });
            
            if (response.ok && response.body) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let assistantResponse = '';
                
                // Remove typing indicator
                removeTypingIndicator(typingId);
                
                // Add assistant message placeholder
                const assistantMessageId = addMessage('assistant', '');
                
                // Stream the response
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    const chunk = decoder.decode(value);
                    assistantResponse += chunk;
                    
                    // Update the assistant message with streaming content
                    updateMessage(assistantMessageId, assistantResponse);
                }
                
                // Update conversation ID if provided
                const conversationHeader = response.headers.get('X-Conversation-Id');
                if (conversationHeader) {
                    conversationId = conversationHeader;
                }
            } else {
                removeTypingIndicator(typingId);
                addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
            }
        } catch (error) {
            console.error('Chat error:', error);
            removeTypingIndicator(typingId);
            addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
        }
    }
    
    // Add typing indicator
    function addTypingIndicator() {
        const messagesContainer = document.getElementById('widget-messages');
        const typingDiv = document.createElement('div');
        const typingId = 'typing-' + Date.now();
        typingDiv.id = typingId;
        typingDiv.style.cssText = `
            margin-bottom: 12px;
            display: flex;
            justify-content: flex-start;
        `;
        
        const typingBubble = document.createElement('div');
        typingBubble.style.cssText = `
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 18px;
            padding: 12px 16px;
            display: flex;
            align-items: center;
            gap: 4px;
        `;
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.style.cssText = `
                width: 8px;
                height: 8px;
                background: #9ca3af;
                border-radius: 50%;
                animation: typing 1.4s infinite ease-in-out;
                animation-delay: ${i * 0.16}s;
            `;
            typingBubble.appendChild(dot);
        }
        
        typingDiv.appendChild(typingBubble);
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        return typingId;
    }
    
    // Remove typing indicator
    function removeTypingIndicator(typingId) {
        const typingElement = document.getElementById(typingId);
        if (typingElement) {
            typingElement.remove();
        }
    }
    
    // Update message content
    function updateMessage(messageId, content) {
        const messageElement = document.getElementById(messageId);
        if (messageElement) {
            const bubble = messageElement.querySelector('div');
            if (bubble) {
                bubble.textContent = content;
            }
        }
    }
    
    // Initialize widget
    function init(shopId, options = {}) {
        config.shopId = shopId;
        config = { ...config, ...options };
        
        // Add CSS animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes typing {
                0%, 60%, 100% { transform: translateY(0); }
                30% { transform: translateY(-10px); }
            }
        `;
        document.head.appendChild(style);
        
        // Create widget when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createWidget);
        } else {
            createWidget();
        }
    }
    
    // Expose functions globally
    window.MotorMindsWidget = {
        init,
        toggle: toggleWidget,
        close: closeWidget,
        minimize: minimizeWidget,
        send: sendMessage
    };
    
    // Make functions globally accessible for onclick handlers
    window.toggleWidget = toggleWidget;
    window.closeWidget = closeWidget;
    window.minimizeWidget = minimizeWidget;
    window.sendMessage = sendMessage;
    window.handleKeyPress = handleKeyPress;
    
    // Auto-initialize if config is provided
    if (window.MotorMindsWidgetConfig) {
        init(
            window.MotorMindsWidgetConfig.shopId,
            window.MotorMindsWidgetConfig
        );
    }
    
})();
