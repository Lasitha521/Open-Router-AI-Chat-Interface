// Elements
const chatContainer = document.getElementById('chat-container');
const messagesWrapper = document.getElementById('messages-wrapper');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const modelSelect = document.getElementById('model-select');
const welcomeScreen = document.getElementById('welcome-screen');
const apiKeyInput = document.getElementById('api-key-input');
const settingsModal = document.getElementById('settings-modal');
const chatHistoryContainer = document.getElementById('chat-history');
const clearHistoryBtn = document.getElementById('clear-history');
const themeToggle = document.getElementById('theme-toggle');
const imageInput = document.getElementById('image-input');
const uploadBtn = document.getElementById('upload-btn');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');
const removeImageBtn = document.getElementById('remove-image');

// State
let API_KEY = localStorage.getItem('openrouter_key') || '';
let chatHistory = JSON.parse(localStorage.getItem('tecno_chat_history')) || [];
let selectedBase64Image = null;

// --- INITIALIZATION ---
window.onload = () => {
    apiKeyInput.value = API_KEY;
    renderHistory(); 
    if (localStorage.getItem('tecno_dark') === 'enabled') document.documentElement.classList.add('dark');
    const savedAccent = localStorage.getItem('tecno_accent') || 'blue';
    window.setAccent(savedAccent);
};

// --- THEME & ACCENT LOGIC ---
window.setAccent = function(color) {
    
    document.documentElement.classList.remove('theme-blue', 'theme-purple', 'theme-rose', 'theme-emerald');
    document.documentElement.classList.add(`theme-${color}`);
    localStorage.setItem('tecno_accent', color);
};

themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('tecno_dark', isDark ? 'enabled' : 'disabled');
});


function renderHistory() {
    chatHistoryContainer.innerHTML = '';
    chatHistory.forEach((chat, index) => {
        const item = document.createElement('div');
        item.className = 'flex items-center gap-3 p-3 rounded-xl text-sm transition-all cursor-pointer truncate hover:bg-gray-200 dark:hover:bg-white/5 opacity-70 hover:opacity-100 font-medium animate-message';
        item.innerHTML = `<i class="far fa-comment-alt text-xs opacity-50"></i> <span class="truncate">${chat.title}</span>`;
        
        
        item.onclick = () => alert("Chat content loading is not implemented yet. Starting a new chat.");
        
        chatHistoryContainer.appendChild(item);
    });

    if (chatHistory.length > 0) {
        clearHistoryBtn.classList.remove('opacity-0');
        clearHistoryBtn.classList.add('opacity-100');
    } else {
        clearHistoryBtn.classList.add('opacity-0');
    }
}

function saveToHistory(text) {
    const title = text.substring(0, 25) + (text.length > 25 ? "..." : "");
    chatHistory.unshift({ title, id: Date.now() });
    if (chatHistory.length > 10) chatHistory.pop(); 
    localStorage.setItem('tecno_chat_history', JSON.stringify(chatHistory));
    renderHistory();
}

// --- IMAGE HANDLING ---
uploadBtn.addEventListener('click', () => imageInput.click());
imageInput.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            selectedBase64Image = e.target.result;
            imagePreview.src = selectedBase64Image;
            imagePreviewContainer.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
});

removeImageBtn.addEventListener('click', () => {
    selectedBase64Image = null;
    imagePreviewContainer.classList.add('hidden');
    imageInput.value = '';
});

// --- CHAT MESSAGES ---
function appendMessage(role, content, imageUrl = null) {
    welcomeScreen.classList.add('hidden');
    const msgDiv = document.createElement('div');
    msgDiv.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'} animate-message w-full mb-6`;
    
    let formatted = content;
    if (role === 'ai' && typeof marked !== 'undefined') formatted = marked.parse(content);

    const imageHtml = imageUrl ? `<img src="${imageUrl}" class="max-w-xs rounded-xl mb-3 border border-gray-200 dark:border-white/10 shadow-lg">` : '';

    msgDiv.innerHTML = `
        <div class="${role === 'user' ? 'message-user' : 'message-ai'}">
            <div class="flex items-start gap-4">
                ${role === 'ai' ? `<div class="w-10 h-10 rounded-xl theme-accent-bg flex-shrink-0 flex items-center justify-center text-white shadow-lg"><i class="fas fa-robot"></i></div>` : ''}
                <div class="prose-container overflow-hidden w-full">
                    ${imageHtml}
                    <div class="text-[15px]">${formatted}</div>
                </div>
            </div>
        </div>`;
    messagesWrapper.appendChild(msgDiv);
    chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
}

// --- API FETCH ---
async function fetchResponse(text, imageFile) {
    if (!API_KEY) { 
        settingsModal.classList.remove('hidden'); 
        return; 
    }

    appendMessage('ai', '<i class="fas fa-circle-notch animate-spin opacity-50"></i> Thinking...');
    const loader = messagesWrapper.lastChild;

    let contentPayload = [];
    if (text) contentPayload.push({ type: "text", text: text });
    if (imageFile) contentPayload.push({ type: "image_url", image_url: { url: imageFile } });

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: { 
                "Authorization": `Bearer ${API_KEY}`, 
                "Content-Type": "application/json",
                "X-Title": "Tecno AI"
            },
            body: JSON.stringify({
                "model": modelSelect.value,
                "messages": [{ "role": "user", "content": contentPayload }]
            })
        });

        const data = await response.json();
        if (loader) loader.remove();

        if (data.choices && data.choices[0]) {
            appendMessage('ai', data.choices[0].message.content);
        } else {
            appendMessage('ai', "Error: Model issue or key error.");
        }
    } catch (e) {
        if (loader) loader.remove();
        appendMessage('ai', "Connection error.");
    }
}

// --- BUTTON EVENTS ---
sendBtn.addEventListener('click', async () => {
    const text = userInput.value.trim();
    if (text || selectedBase64Image) {
        
        if (messagesWrapper.children.length === 0) {
            saveToHistory(text || "Image Analysis");
        }

        const currentImage = selectedBase64Image;
        appendMessage('user', text, currentImage);
        
        userInput.value = '';
        userInput.style.height = 'auto';
        removeImageBtn.click(); 
        
        await fetchResponse(text, currentImage);
    }
});

// New Chat Button
document.getElementById('new-chat').addEventListener('click', () => {
    messagesWrapper.innerHTML = '';
    welcomeScreen.classList.remove('hidden');
    userInput.value = '';
    userInput.style.height = 'auto';
});

// Clear History Button
clearHistoryBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to delete all recent history?")) {
        chatHistory = [];
        localStorage.removeItem('tecno_chat_history');
        renderHistory();
    }
});

// Settings Events
document.getElementById('open-settings').addEventListener('click', () => settingsModal.classList.remove('hidden'));
document.getElementById('save-settings').addEventListener('click', () => {
    API_KEY = apiKeyInput.value.trim();
    localStorage.setItem('openrouter_key', API_KEY);
    settingsModal.classList.add('hidden');
});

// Input enter key handling
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendBtn.click();
    }
});

userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});