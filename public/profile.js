console.log('🔍 Profile: profile.js loaded successfully');

class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.currentLanguage = 'ru'; // Default to Russian
        this.init();
    }

    init() {
        this.setupEventListeners();
        window.addEventListener('auth:logout', () => {
            window.location.href = '/';
        });
        window.addEventListener('auth:login', () => {
            this.checkAuth();
        });
        this.checkAuth();
    }

    async checkAuth() {
        console.log('🔍 Profile: checkAuth called - PAGE LOADED SUCCESSFULLY!');

        try {
            console.log('🔍 Profile: Checking all localStorage keys...');
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.includes('auth') || key.includes('supabase'))) {
                    console.log('🔍 Profile: Found key:', key, '=', localStorage.getItem(key)?.substring(0, 50) + '...');
                }
            }

            // Wait for Supabase to be ready
            if (typeof supabase === 'undefined') {
                console.log('🔍 Profile: Supabase not loaded yet, waiting...');
                setTimeout(() => this.checkAuth(), 100);
                return;
            }

            // Initialize Supabase client if not already done
            if (!window.supabase) {
                console.log('🔍 Profile: Initializing Supabase client...');
                window.supabase = supabase.createClient(
                    window.APP_CONFIG?.SUPABASE_URL || 'https://dkbvavfdjpamsmezfrrt.supabase.co',
                    window.APP_CONFIG?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrYnZhdmZkanBhbXNtZXpmcnJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNDc0MzEsImV4cCI6MjA3NzcyMzQzMX0.4NBBusEGQyfikpidc8QCoqhIjWs_7FoJCCNwjJ8C-cI',
                    {
                        auth: {
                            autoRefreshToken: true,
                            persistSession: true,
                            detectSessionInUrl: true
                        }
                    }
                );
            }

            // Get current session from Supabase
            console.log('🔍 Profile: Getting session from Supabase...');
            const { data: { session }, error } = await window.supabase.auth.getSession();

            if (error) {
                console.error('🔍 Profile: Error getting session:', error);
                console.log('🔍 Profile: No valid session found, redirecting to home');
                window.location.href = '/';
                return;
            }

            if (!session?.access_token) {
                console.log('🔍 Profile: No access token in session, redirecting to home');
                window.location.href = '/';
                return;
            }

            console.log('🔍 Profile: Found valid session with access token, length:', session.access_token.length);

            console.log('🔍 Profile: Found access token, length:', session.access_token.length);
            localStorage.setItem('supabase_auth_session', JSON.stringify(session));
            localStorage.removeItem('supabase_auth_token');
            localStorage.removeItem('supabase.auth.token');

            // First try with current token
            console.log('🔍 Profile: Making request to /api/auth/me');
            console.log('🔍 Profile: Token preview:', session.access_token.substring(0, 20) + '...');

            let response;
            try {
                response = await fetch('/api/auth/me', {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                });

                console.log('🔍 Profile: Response status:', response.status);
                console.log('🔍 Profile: Response headers:', Object.fromEntries(response.headers.entries()));

                if (response.ok) {
                    const data = await response.json();
                    console.log('🔍 Profile: Auth successful, user data:', data);
                    this.currentUser = data.data.user;
                    this.loadProfileData();
                    this.updateAuthUI();
                    return;
                } else {
                    const errorText = await response.text().catch(() => 'Unable to read error');
                    console.log('🔍 Profile: Auth failed, status:', response.status, 'response:', errorText);
                    // Don't redirect immediately, show the error
                    alert('Authentication failed: ' + errorText);
                    return;
                }
            } catch (fetchError) {
                console.error('🔍 Profile: Fetch error:', fetchError);
                // Don't redirect immediately, show the error
                alert('Network error: ' + fetchError.message);
                return;
            }

            // If token is invalid, try to refresh it
            if (session.refresh_token) {
                console.log('Token expired, trying to refresh...');
                try {
                    const refreshResponse = await fetch('/api/auth/refresh', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            refresh_token: session.refresh_token
                        })
                    });

                    if (refreshResponse.ok) {
                        const refreshData = await refreshResponse.json();
                        if (refreshData.success && refreshData.data?.session) {
                            // Save new session
                            localStorage.setItem('supabase_auth_session', JSON.stringify(refreshData.data.session));
                            console.log('Session refreshed successfully');

                            // Retry with new token
                            const retryResponse = await fetch('/api/auth/me', {
                                headers: {
                                    'Authorization': `Bearer ${refreshData.data.session.access_token}`
                                }
                            });

                            if (retryResponse.ok) {
                                const retryData = await retryResponse.json();
                                this.currentUser = retryData.data.user;
                                this.loadProfileData();
                                this.updateAuthUI();
                                return;
                            }
                        }
                    }
                } catch (refreshError) {
                    console.error('Failed to refresh token:', refreshError);
                }
            }

            // If we get here, authentication failed
            console.log('Authentication failed, showing error instead of redirect');
            alert('Authentication failed completely');

        } catch (error) {
            console.error('Auth check failed:', error);
            alert('Auth check failed: ' + error.message);
        }
    }

    updateAuthUI() {
        const authBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const userInfo = document.getElementById('userInfo');
        const userDisplayName = document.getElementById('userDisplayName');
        const userEmail = document.getElementById('userEmail');

        if (this.currentUser) {
            if (authBtn) authBtn.style.display = 'none';
            if (registerBtn) registerBtn.style.display = 'none';
            if (userInfo) userInfo.style.display = 'flex';

            if (userDisplayName) {
                userDisplayName.textContent = this.currentUser.name || this.currentUser.email?.split('@')[0] || 'Пользователь';
            }
            if (userEmail) {
                userEmail.textContent = this.currentUser.email || '';
            }
        }
    }

    setupEventListeners() {
        // Profile form
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProfile();
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        const logoutBtnMain = document.getElementById('logoutBtnMain');

        if (logoutBtn && !window.authManager) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
        if (logoutBtnMain) {
            logoutBtnMain.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.authManager) {
                    window.authManager.logout();
                } else {
                    this.logout();
                }
            });
        }

        // Navigation links
        const myLinksLink = document.getElementById('myLinksLink');
        const profileLink = document.getElementById('profileLink');

        if (myLinksLink) {
            myLinksLink.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = '/my-links';
            });
        }
        if (profileLink) {
            profileLink.addEventListener('click', (e) => {
                e.preventDefault();
                // Already on profile page
            });
        }

        // Language selector
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                this.currentLanguage = e.target.value;
                // Could implement language switching here
            });
        }
    }

    async loadProfileData() {
        if (!this.currentUser) return;

        try {
            // Load user profile info
            this.displayUserInfo();

            // Load user statistics - temporarily disabled to stop infinite requests
            // await this.loadUserStats();

        } catch (error) {
            console.error('Failed to load profile data:', error);
            this.showToast('Ошибка загрузки данных профиля', 'error');
        }
    }

    displayUserInfo() {
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const userNameInput = document.getElementById('userName');
        const userEmailInput = document.getElementById('userEmailInput');

        if (profileName) {
            profileName.textContent = this.currentUser.name || 'Без имени';
        }

        if (profileEmail) {
            profileEmail.textContent = this.currentUser.email;
        }

        if (userNameInput) {
            userNameInput.value = this.currentUser.name || '';
        }

        if (userEmailInput) {
            userEmailInput.value = this.currentUser.email;
        }

        // Set avatar based on name or email
        const profileAvatar = document.getElementById('profileAvatar');
        if (profileAvatar) {
            const name = this.currentUser.name || this.currentUser.email?.split('@')[0] || 'U';
            profileAvatar.textContent = name.charAt(0).toUpperCase();
        }
    }

    async loadUserStats() {
        try {
            // Try to get stored session first (new format)
            let sessionStr = localStorage.getItem('supabase_auth_session');
            let token = null;

            if (sessionStr) {
                try {
                    const session = JSON.parse(sessionStr);
                    token = session?.access_token;
                } catch (e) {
                    console.warn('Failed to parse session, removing:', e);
                    localStorage.removeItem('supabase_auth_session');
                }
            }

            // Fallback to old token format for backward compatibility
            if (!token) {
                token = localStorage.getItem('supabase_auth_token');
            }

            if (!token) {
                console.error('No auth token found for stats');
                return;
            }

            const response = await fetch('/api/links', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    const links = data.data.links || [];
                    this.displayUserStats(links);
                }
            }
        } catch (error) {
            console.error('Failed to load user stats:', error);
        }
    }

    displayUserStats(links) {
        const totalLinks = document.getElementById('totalLinks');
        const totalClicks = document.getElementById('totalClicks');
        const accountAge = document.getElementById('accountAge');

        // Calculate total links
        if (totalLinks) {
            totalLinks.textContent = links.length;
        }

        // Calculate total clicks
        const clicks = links.reduce((sum, link) => sum + (link.click_count || 0), 0);
        if (totalClicks) {
            totalClicks.textContent = clicks;
        }

        // Calculate account age in days
        if (accountAge && this.currentUser.created_at) {
            const createdDate = new Date(this.currentUser.created_at);
            const now = new Date();
            const diffTime = Math.abs(now - createdDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            accountAge.textContent = diffDays;
        }
    }

    async saveProfile() {
        const userNameInput = document.getElementById('userName');
        const saveBtn = document.getElementById('saveProfileBtn');
        const btnText = saveBtn.querySelector('.btn-text');
        const btnLoading = saveBtn.querySelector('.btn-loading');

        const newName = userNameInput?.value.trim() || '';

        if (!newName) {
            this.showToast('Введите имя', 'error');
            return;
        }

        // Show loading state
        saveBtn.disabled = true;
        if (btnText) btnText.style.display = 'none';
        if (btnLoading) btnLoading.style.display = 'inline';

        try {
            // Try to get stored session first (new format)
            let sessionStr = localStorage.getItem('supabase_auth_session');
            let token = null;

            if (sessionStr) {
                try {
                    const session = JSON.parse(sessionStr);
                    token = session?.access_token;
                } catch (e) {
                    console.warn('Failed to parse session, removing:', e);
                    localStorage.removeItem('supabase_auth_session');
                }
            }

            // Fallback to old token format for backward compatibility
            if (!token) {
                token = localStorage.getItem('supabase_auth_token');
            }

            if (!token) {
                this.showToast('Необходима авторизация', 'error');
                return;
            }

            const response = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: newName })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // Update local user data
                    this.currentUser.name = newName;
                    this.displayUserInfo();
                    this.updateAuthUI();
                    this.showToast('Профиль обновлен!', 'success');
                } else {
                    this.showToast(data.error || 'Ошибка обновления профиля', 'error');
                }
            } else {
                this.showToast('Ошибка обновления профиля', 'error');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            this.showToast('Ошибка сети', 'error');
        } finally {
            // Hide loading state
            saveBtn.disabled = false;
            if (btnText) btnText.style.display = 'inline';
            if (btnLoading) btnLoading.style.display = 'none';
        }
    }

    async logout() {
        if (window.authManager) {
            await window.authManager.logout();
            return;
        }

        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            // Remove session from localStorage
            localStorage.removeItem('supabase_auth_session');
            localStorage.removeItem('supabase_auth_token'); // Also remove old format
            localStorage.removeItem('supabase.auth.token');
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = '/';
        }
    }

    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        // Add to page
        document.body.appendChild(toast);

        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Hide and remove toast
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }
}

// Toast styles (add to CSS if needed)
const toastStyles = `
.toast {
    position: fixed;
    top: 100px;
    right: 20px;
    background: #333;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    transform: translateX(400px);
    transition: transform 0.3s ease;
    font-weight: 500;
}

.toast.show {
    transform: translateX(0);
}

.toast-success {
    background: #28a745;
}

.toast-error {
    background: #dc3545;
}

.toast-info {
    background: #17a2b8;
}
`;

// Add toast styles to page
const style = document.createElement('style');
style.textContent = toastStyles;
document.head.appendChild(style);

// Initialize the profile manager when DOM is loaded
let profileManager;
document.addEventListener('DOMContentLoaded', () => {
    initCommonComponents('/profile', 'ru');

    // Initialize AuthManager for authentication on internal pages
    if (typeof AuthManager !== 'undefined') {
        window.authManager = new AuthManager();
    }

    profileManager = new ProfileManager();
});
