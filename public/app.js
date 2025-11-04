// Simplified URL Shortener Frontend JavaScript
// NOTE: Supabase is initialized in components.js - do not initialize here

const translations = {
    ru: {
        enterUrlError: "Введите URL для сокращения",
        invalidUrlError: "Введите корректный URL (начинающийся с http:// или https://)",
        serverError: "Не удалось подключиться к серверу. Проверьте подключение к интернету.",
        genericError: "Произошла ошибка при сокращении URL",
        copied: "✅ Скопировано!",
        invalidUrlValidation: "Введите корректный URL (начинающийся с http:// или https://)"
    },
    en: {
        enterUrlError: "Enter URL to shorten",
        invalidUrlError: "Enter a valid URL (starting with http:// or https://)",
        serverError: "Failed to connect to server. Check your internet connection.",
        genericError: "An error occurred while shortening URL",
        copied: "✅ Copied!",
        invalidUrlValidation: "Enter a valid URL (starting with http:// or https://)"
    }
};

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authModal = null;
        const languageSelect = document.getElementById('languageSelect');
        const documentLang = document.documentElement?.lang;
        this.currentLanguage = languageSelect?.value || documentLang || 'ru';

        // Wait for Supabase to be ready before initializing
        if (window.supabase) {
            this.init();
        } else {
            window.addEventListener('supabaseReady', () => {
                this.init();
            });
        }
    }

    init() {
        this.setupSupabaseAuthListener();
        this.checkAuthStatus();
        this.createAuthModal();
        this.setupEventListeners();
    }

    setupSupabaseAuthListener() {
        // Listen for authentication state changes
        window.supabase?.auth.onAuthStateChange((event, session) => {
            console.log('🔄 Auth state changed:', event, session?.user?.email);

            if (event === 'SIGNED_IN' && session?.user) {
                console.log('✅ User signed in:', session.user.email);
                this.setCurrentUser(session.user);
                window.dispatchEvent(new CustomEvent('auth:login', {
                    detail: { user: session.user }
                }));
            } else if (event === 'SIGNED_OUT') {
                console.log('ℹ️ User signed out');
                this.setCurrentUser(null);
                window.dispatchEvent(new Event('auth:logout'));
            } else if (event === 'TOKEN_REFRESHED') {
                console.log('🔄 Token refreshed');
                if (session?.user) {
                    this.setCurrentUser(session.user);
                }
            }
        });
    }

    async checkAuthStatus() {
        try {
            console.log('🔍 Checking authentication status...');

            // Get current session from Supabase (this handles token refresh automatically)
            const { data: { session }, error } = await window.supabase?.auth.getSession();

            if (error) {
                console.error('❌ Error getting session:', error);
                this.setCurrentUser(null);
            } else if (session?.user) {
                console.log('✅ User authenticated:', session.user.email);
                this.setCurrentUser(session.user);
            } else {
                console.log('ℹ️ No active session');
                this.setCurrentUser(null);
            }

        } catch (error) {
            console.error('❌ Auth check failed:', error);
            this.setCurrentUser(null);
        } finally {
            // Always dispatch auth ready event
            console.log('🔍 Dispatching auth:ready event');
            window.dispatchEvent(new CustomEvent('auth:ready'));
        }
    }

    setCurrentUser(user) {
        this.currentUser = user;
        this.updateUI();
    }

    updateUI() {
        const authBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const userInfo = document.getElementById('userInfo');
        const userDisplayName = document.getElementById('userDisplayName');
        const userEmail = document.getElementById('userEmail');

        if (this.currentUser) {
            // Hide auth buttons for logged in users
            if (authBtn) authBtn.style.display = 'none';
            if (registerBtn) registerBtn.style.display = 'none';
            if (userInfo) userInfo.style.display = 'flex';

            // Show user name and email
            if (userDisplayName) {
                userDisplayName.textContent = this.currentUser.name || this.currentUser.email?.split('@')[0] || 'Пользователь';
            }
            if (userEmail) {
                userEmail.textContent = this.currentUser.email || '';
            }
        } else {
            // Show auth buttons for non-logged users
            if (authBtn) authBtn.style.display = 'inline-block';
            if (registerBtn) registerBtn.style.display = 'inline-block';
            if (userInfo) userInfo.style.display = 'none';
        }
    }

    async createAuthModal() {
        const t = translations[this.currentLanguage || 'ru'];

        if (this.authModal && this.authModal.parentNode) {
            this.authModal.parentNode.removeChild(this.authModal);
        }

        const modal = document.createElement('div');
        modal.id = 'authModal';
        modal.className = 'auth-modal';
        modal.innerHTML = `
            <div class="auth-modal-content">
                <span class="auth-modal-close">&times;</span>
                <div class="auth-tabs">
                    <button class="auth-tab active" data-tab="login">Войти</button>
                    <button class="auth-tab" data-tab="register">Регистрация</button>
                </div>

                <div id="loginForm" class="auth-form active">
                    <h3>Войти</h3>
                    <form id="loginFormElement">
                        <div class="form-group">
                            <label for="loginEmail">Email:</label>
                            <input type="email" id="loginEmail" required>
                        </div>
                        <div class="form-group">
                            <label for="loginPassword">Пароль:</label>
                            <input type="password" id="loginPassword" required>
                        </div>
                        <button type="submit" class="auth-submit-btn">Войти</button>
                    </form>
                </div>
                <div id="registerForm" class="auth-form">
                    <h3>Регистрация</h3>
                    <form id="registerFormElement">
                        <div class="form-group">
                            <label for="registerEmail">Email:</label>
                            <input type="email" id="registerEmail" required>
                        </div>
                        <div class="form-group">
                            <label for="registerPassword">Пароль:</label>
                            <input type="password" id="registerPassword" required>
                        </div>
                        <div class="form-group">
                            <label for="registerName">Имя (опционально):</label>
                            <input type="text" id="registerName">
                        </div>
                        <button type="submit" class="auth-submit-btn">Регистрация</button>
                    </form>
                </div>
                <div id="authMessage" class="auth-message"></div>
            </div>
        `;
        document.body.appendChild(modal);
        this.authModal = modal;
        this.attachModalEventListeners();
    }

    setupEventListeners() {
        if (!this.authModal) {
            this.createAuthModal();
        }

        // Auth buttons - these are outside the modal
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const logoutBtn = document.getElementById('logoutBtn');

        if (loginBtn) {
            loginBtn.onclick = (event) => {
                event.preventDefault();
                this.showModal('login');
            };
        }
        if (registerBtn) {
            registerBtn.onclick = (event) => {
                event.preventDefault();
                this.showModal('register');
            };
        }
        if (logoutBtn) {
            logoutBtn.onclick = (event) => {
                event.preventDefault();
                this.logout();
            };
        }

        // Modal events - only if modal exists
        if (this.authModal) {
            this.attachModalEventListeners();
        }
    }

    attachModalEventListeners() {
        if (!this.authModal) return;

        // Close button
        const closeBtn = this.authModal.querySelector('.auth-modal-close');
        if (closeBtn) {
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                this.hideModal();
            };
        }

        // Click outside to close
        this.authModal.onclick = (event) => {
            if (event.target === this.authModal) {
                this.hideModal();
            }
        };

        // Tab switching
        const tabs = this.authModal.querySelectorAll('.auth-tab');
        tabs.forEach(tab => {
            tab.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const tabName = tab.dataset.tab;
                if (tabName) {
                    this.switchTab(tabName);
                }
            };
        });

        // Form submissions
        const loginForm = document.getElementById('loginFormElement');
        const registerForm = document.getElementById('registerFormElement');

        if (loginForm) {
            loginForm.onsubmit = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleLogin(e);
            };
        }
        if (registerForm) {
            registerForm.onsubmit = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleRegister(e);
            };
        }
    }

    showModal(initialTab = 'login') {
        if (!this.authModal) {
            this.createAuthModal();
        }

        this.authModal.style.display = 'block';
        this.attachModalEventListeners();
        this.switchTab(initialTab);
    }

    hideModal() {
        if (this.authModal) {
            this.authModal.style.display = 'none';
            this.clearForms();
            this.clearMessage();
        }
    }

    switchTab(tabName) {
        const tabs = this.authModal.querySelectorAll('.auth-tab');
        const forms = this.authModal.querySelectorAll('.auth-form');

        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        forms.forEach(form => {
            form.classList.toggle('active', form.id === `${tabName}Form`);
        });

        this.clearMessage();
    }

    async handleLogin(event) {
        event.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            console.log('🔐 Attempting login for:', email);
            
            // Check if Supabase client is initialized
            if (!window.supabase) {
                console.error('❌ Supabase client not initialized');
                this.showMessage('Система аутентификации не загружена. Обновите страницу.', 'error');
                return;
            }

            const { data, error } = await window.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                console.error('❌ Login error:', error);
                this.showMessage(error.message || 'Ошибка входа', 'error');
                return;
            }

            if (data?.user) {
                console.log('✅ Login successful:', data.user.email);
                this.hideModal();
                this.showMessage('Успешный вход!', 'success');
            } else {
                console.warn('⚠️ Login succeeded but no user data');
                this.showMessage('Ошибка входа: нет данных пользователя', 'error');
            }
        } catch (error) {
            console.error('❌ Login exception:', error);
            this.showMessage('Ошибка сети', 'error');
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const name = document.getElementById('registerName').value;

        try {
            console.log('📝 Attempting registration for:', email);
            
            // Check if Supabase client is initialized
            if (!window.supabase) {
                console.error('❌ Supabase client not initialized');
                this.showMessage('Система аутентификации не загружена. Обновите страницу.', 'error');
                return;
            }

            const { data, error } = await window.supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        name: name || email.split('@')[0]
                    }
                }
            });

            if (error) {
                console.error('❌ Registration error:', error);
                this.showMessage(error.message || 'Ошибка регистрации', 'error');
                return;
            }

            if (data?.user) {
                console.log('✅ Registration successful:', data.user.email);
                this.hideModal();
                this.showMessage('Регистрация успешна! Проверьте email для подтверждения.', 'success');
            } else {
                console.warn('⚠️ Registration succeeded but no user data');
                this.showMessage('Регистрация прошла, но данные пользователя не получены', 'error');
            }
        } catch (error) {
            console.error('❌ Registration exception:', error);
            this.showMessage('Ошибка сети', 'error');
        }
    }

    async logout() {
        try {
            console.log('🚪 Attempting logout...');
            
            // Check if Supabase client is initialized
            if (!window.supabase) {
                console.error('❌ Supabase client not initialized');
                this.showMessage('Система аутентификации не загружена. Обновите страницу.', 'error');
                return;
            }

            const { error } = await window.supabase.auth.signOut();

            if (error) {
                console.error('❌ Logout error:', error);
                this.showMessage('Ошибка выхода: ' + error.message, 'error');
                return;
            }

            console.log('✅ Logout successful');
            this.showMessage('Выход выполнен', 'success');
        } catch (error) {
            console.error('❌ Logout exception:', error);
            this.showMessage('Ошибка сети при выходе', 'error');
        }
    }

    clearForms() {
        const forms = ['loginFormElement', 'registerFormElement'];
        forms.forEach(formId => {
            const form = document.getElementById(formId);
            if (form) form.reset();
        });
    }

    showMessage(message, type) {
        const messageDiv = document.getElementById('authMessage');
        if (messageDiv) {
            messageDiv.textContent = message;
            messageDiv.className = `auth-message ${type}`;
            setTimeout(() => this.clearMessage(), 5000);
        }
    }

    clearMessage() {
        const messageDiv = document.getElementById('authMessage');
        if (messageDiv) {
            messageDiv.textContent = '';
            messageDiv.className = 'auth-message';
        }
    }
}

class UrlShortener {
    constructor() {
        this.form = document.getElementById('urlForm');
        this.originalUrlInput = document.getElementById('originalUrl');
        this.shortenBtn = document.getElementById('shortenBtn');
        this.btnText = document.querySelector('.btn-text');
        this.btnLoading = document.querySelector('.btn-loading');
        this.resultDiv = document.getElementById('result');
        this.errorDiv = document.getElementById('error');
        this.errorMessage = document.getElementById('errorMessage');
        this.originalUrlDisplay = document.getElementById('originalUrlDisplay');
        this.shortUrlInput = document.getElementById('shortUrlInput');
        this.copyBtn = document.getElementById('copyBtn');
        this.goToBtn = document.getElementById('goToBtn');
        this.createNewBtn = document.getElementById('createNewBtn');
        this.tryAgainBtn = document.getElementById('tryAgainBtn');
        this.languageSelect = document.getElementById('languageSelect');
        this.currentLanguage = this.languageSelect?.value || document.documentElement?.lang || 'ru';

        this.init();
    }

    init() {
        if (!this.form || !this.originalUrlInput || !this.shortenBtn) {
            console.warn('UrlShortener: required elements not found, skipping initialization');
            return;
        }

        this.form.addEventListener('submit', this.handleSubmit.bind(this));

        if (this.copyBtn) {
            this.copyBtn.addEventListener('click', this.copyToClipboard.bind(this));
        }
        if (this.goToBtn) {
            this.goToBtn.addEventListener('click', this.goToUrl.bind(this));
        }
        if (this.createNewBtn) {
            this.createNewBtn.addEventListener('click', this.resetForm.bind(this));
        }
        if (this.tryAgainBtn) {
            this.tryAgainBtn.addEventListener('click', this.resetForm.bind(this));
        }

        // Real-time URL validation
        this.originalUrlInput.addEventListener('input', this.validateUrl.bind(this));
    }

    validateUrl() {
        const url = this.originalUrlInput.value.trim();
        const t = translations[this.currentLanguage];
        if (url && !this.isValidUrl(url)) {
            this.originalUrlInput.setCustomValidity(t.invalidUrlValidation);
        } else {
            this.originalUrlInput.setCustomValidity('');
        }
    }

    isValidUrl(url) {
        try {
            const urlObj = new URL(url);
            return ['http:', 'https:'].includes(urlObj.protocol);
        } catch {
            return false;
        }
    }

    async handleSubmit(event) {
        event.preventDefault();

        const originalUrl = this.originalUrlInput.value.trim();
        const t = translations[this.currentLanguage];

        if (!originalUrl) {
            this.showError(t.enterUrlError);
            return;
        }

        if (!this.isValidUrl(originalUrl)) {
            this.showError(t.invalidUrlError);
            return;
        }

        this.setLoading(true);
        this.hideMessages();

        try {
            // Get current Supabase session (optional for authenticated users)
            const { data: { session } } = await window.supabase?.auth.getSession() || { data: { session: null } };

            const headers = {
                'Content-Type': 'application/json'
            };

            // Add auth token only if user is logged in
            if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
            }

            const response = await fetch('/api/shorten', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ originalUrl }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.showResult(data.data);
            } else {
                this.showError(data.error || t.genericError);
            }
        } catch (error) {
            console.error('Error:', error);
            this.showError(t.serverError);
        } finally {
            this.setLoading(false);
        }
    }

    showResult(data) {
        this.originalUrlDisplay.textContent = data.originalUrl;
        this.shortUrlInput.value = data.shortUrl;

        this.resultDiv.style.display = 'block';
        this.errorDiv.style.display = 'none';

        // Scroll to result
        this.resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorDiv.style.display = 'block';
        this.resultDiv.style.display = 'none';

        // Scroll to error
        this.errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    hideMessages() {
        this.resultDiv.style.display = 'none';
        this.errorDiv.style.display = 'none';
    }

    async copyToClipboard() {
        const t = translations[this.currentLanguage];
        try {
            await navigator.clipboard.writeText(this.shortUrlInput.value);

            // Visual feedback
            const originalText = this.copyBtn.textContent;
            this.copyBtn.textContent = t.copied;
            this.copyBtn.style.background = '#28a745';

            setTimeout(() => {
                this.copyBtn.textContent = originalText;
                this.copyBtn.style.background = '';
            }, 2000);

        } catch (error) {
            console.error('Copy error:', error);
            // Fallback for browsers without Clipboard API support
            this.shortUrlInput.select();
            document.execCommand('copy');

            const originalText = this.copyBtn.textContent;
            this.copyBtn.textContent = t.copied;
            this.copyBtn.style.background = '#28a745';

            setTimeout(() => {
                this.copyBtn.textContent = originalText;
                this.copyBtn.style.background = '';
            }, 2000);
        }
    }

    goToUrl() {
        const shortUrl = this.shortUrlInput.value;
        if (shortUrl) {
            window.open(shortUrl, '_blank');
        }
    }

    resetForm() {
        this.form.reset();
        this.hideMessages();
        this.originalUrlInput.focus();
    }

    setLoading(loading) {
        if (this.shortenBtn) {
            this.shortenBtn.disabled = loading;
        }

        if (this.btnText && this.btnLoading) {
            if (loading) {
                this.btnText.style.display = 'none';
                this.btnLoading.style.display = 'inline';
            } else {
                this.btnText.style.display = 'inline';
                this.btnLoading.style.display = 'none';
            }
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize AuthManager first to check authentication status
    window.authManager = new AuthManager();
    
    // Wait for auth check to complete
    await new Promise(resolve => {
        const checkComplete = () => {
            if (window.authManager.currentUser !== undefined) {
                resolve();
            } else {
                setTimeout(checkComplete, 100);
            }
        };
        checkComplete();
    });

    // Initialize URL shortener
    new UrlShortener();
});
