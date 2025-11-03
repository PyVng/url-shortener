// My Links Dashboard JavaScript

class MyLinksManager {
    constructor() {
        this.currentUser = null;
        this.links = [];
        this.filteredLinks = [];
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.searchQuery = '';
        this.sortBy = 'created_desc';

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuth(); // This will load links if user is authenticated
    }

    async checkAuth() {
        try {
            console.log('MyLinks: Starting auth check...');

            // Wait for Supabase to be ready
            if (!window.supabase) {
                console.log('MyLinks: Supabase not ready, waiting...');
                if (window.supabaseReadyPromise) {
                    await window.supabaseReadyPromise;
                } else {
                    // Wait for supabaseReady event
                    await new Promise(resolve => {
                        window.addEventListener('supabaseReady', resolve, { once: true });
                    });
                }
            }

            if (!window.supabase) {
                console.error('MyLinks: Supabase still not available');
                this.showAuthRequiredMessage();
                return;
            }

            console.log('MyLinks: Supabase is ready, attempting to recover session...');

            // Debug: Check all localStorage keys
            console.log('MyLinks: Checking ALL localStorage keys...');
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                console.log(`MyLinks: localStorage[${key}] =`, value ? value.substring(0, 100) + '...' : 'null');
            }

            // Debug: Check all localStorage keys related to Supabase
            console.log('MyLinks: Checking Supabase-related keys...');
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.includes('supabase') || key.includes('sb-'))) {
                    console.log('MyLinks: Found Supabase-related key:', key, '=', localStorage.getItem(key));
                }
            }

            // Try to recover session from localStorage first
            // Use the correct key that we found in logs: sb-dkbvavfdjpamsmezfrrt-auth-token
            const sessionKey = 'sb-dkbvavfdjpamsmezfrrt-auth-token';
            const storedSession = localStorage.getItem(sessionKey);

            if (storedSession) {
                try {
                    const sessionData = JSON.parse(storedSession);
                    console.log('MyLinks: Found session data:', {
                        hasAccessToken: !!sessionData.access_token,
                        hasRefreshToken: !!sessionData.refresh_token,
                        hasUser: !!sessionData.user
                    });

                    // Try to set the session using Supabase
                    const { data, error } = await window.supabase.auth.setSession({
                        access_token: sessionData.access_token,
                        refresh_token: sessionData.refresh_token
                    });

                    if (error) {
                        console.log('MyLinks: Failed to set stored session:', error);
                    } else {
                        console.log('MyLinks: Successfully recovered session from storage');
                    }
                } catch (parseError) {
                    console.warn('MyLinks: Failed to parse stored session:', parseError);
                }
            } else {
                console.log('MyLinks: No session found in localStorage');
            }

            // Now check for active session
            const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
            console.log('MyLinks: Session check result:', { session: !!session, sessionError });

            if (sessionError) {
                console.error('MyLinks: Session error:', sessionError);
                this.showAuthRequiredMessage();
                return;
            }

            if (!session?.access_token) {
                console.log('MyLinks: No active session found');
                this.showAuthRequiredMessage();
                return;
            }

            console.log('MyLinks: Session found, access_token exists:', !!session.access_token);
            console.log('MyLinks: Token preview:', session.access_token.substring(0, 20) + '...');

            // Validate token with server
            const response = await fetch('/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            console.log('MyLinks: Auth validation response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('MyLinks: Auth validation successful, user:', data.data.user.email);
                this.currentUser = data.data.user;
                this.updateAuthUI();
                this.hideAuthRequiredMessage();
                // Load user links only after successful authentication
                this.loadUserLinks();
                console.log('MyLinks: Authentication successful');
            } else {
                const errorText = await response.text();
                console.log('MyLinks: Token validation failed:', response.status, errorText);
                this.showAuthRequiredMessage();
            }

        } catch (error) {
            console.error('MyLinks: Auth check failed:', error);
            this.showAuthRequiredMessage();
        }
    }

    async handleTokenRefresh() {
        try {
            const sessionStr = localStorage.getItem('supabase_auth_session');
            if (!sessionStr) {
                console.log('No session found, redirecting to login');
                window.location.href = '/';
                return;
            }

            const session = JSON.parse(sessionStr);
            if (!session?.refresh_token) {
                console.log('No refresh token found, redirecting to login');
                window.location.href = '/';
                return;
            }

            console.log('Attempting to refresh token...');
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
                    console.log('Token refreshed successfully, retrying request');

                    // Retry the original request
                    await this.loadUserLinks();
                    return;
                }
            }

            console.log('Token refresh failed, redirecting to login');
            // Clear invalid session
            localStorage.removeItem('supabase_auth_session');
            localStorage.removeItem('supabase_auth_token');
            localStorage.removeItem('supabase.auth.token');
            window.location.href = '/';
        } catch (error) {
            console.error('Token refresh error:', error);
            // Clear invalid session and redirect
            localStorage.removeItem('supabase_auth_session');
            localStorage.removeItem('supabase_auth_token');
            localStorage.removeItem('supabase.auth.token');
            window.location.href = '/';
        }
    }

    async refreshSession(refreshToken) {
        // For now, we don't refresh sessions on the client side
        // The server should handle token validation and refresh
        return null;
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
        // Create new link buttons
        const createNewBtn = document.getElementById('createNewBtn');
        const createFirstBtn = document.getElementById('createFirstBtn');

        if (createNewBtn) {
            createNewBtn.addEventListener('click', () => this.redirectToHome());
        }
        if (createFirstBtn) {
            createFirstBtn.addEventListener('click', () => this.redirectToHome());
        }

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.trim();
                this.filterAndSortLinks();
                this.renderLinks();
            });
        }
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.searchQuery = searchInput?.value.trim() || '';
                this.filterAndSortLinks();
                this.renderLinks();
            });
        }

        // Sort functionality
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.filterAndSortLinks();
                this.renderLinks();
            });
        }

        // Pagination
        const prevPage = document.getElementById('prevPage');
        const nextPage = document.getElementById('nextPage');

        if (prevPage) {
            prevPage.addEventListener('click', () => this.changePage(this.currentPage - 1));
        }
        if (nextPage) {
            nextPage.addEventListener('click', () => this.changePage(this.currentPage + 1));
        }

        // Auth event listeners
        this.setupAuthEventListeners();

        // Modal event listeners
        this.setupModalEventListeners();
    }

    setupAuthEventListeners() {
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const myLinksLink = document.getElementById('myLinksLink');
        const profileLink = document.getElementById('profileLink');

        if (!window.authManager) {
            if (loginBtn) {
                loginBtn.addEventListener('click', () => this.showAuthModal('login'));
            }
            if (registerBtn) {
                registerBtn.addEventListener('click', () => this.showAuthModal('register'));
            }
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => this.logout());
            }
        }
        if (myLinksLink) {
            myLinksLink.addEventListener('click', (e) => {
                e.preventDefault();
                // Already on my-links page
            });
        }
        if (profileLink) {
            profileLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showProfile();
            });
        }

        window.addEventListener('auth:login', () => {
            this.checkAuth();
        });

        window.addEventListener('auth:logout', () => {
            this.currentUser = null;
            this.showAuthRequiredMessage();
        });
    }

    setupModalEventListeners() {
        // Edit modal
        const editModal = document.getElementById('editModal');
        const editForm = document.getElementById('editForm');
        const cancelEdit = document.getElementById('cancelEdit');
        const saveEdit = document.getElementById('saveEdit');

        if (cancelEdit) {
            cancelEdit.addEventListener('click', () => this.hideEditModal());
        }
        if (saveEdit) {
            saveEdit.addEventListener('click', () => this.saveLinkEdit());
        }
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveLinkEdit();
            });
        }

        // Delete modal
        const deleteModal = document.getElementById('deleteModal');
        const cancelDelete = document.getElementById('cancelDelete');
        const confirmDelete = document.getElementById('confirmDelete');

        if (cancelDelete) {
            cancelDelete.addEventListener('click', () => this.hideDeleteModal());
        }
        if (confirmDelete) {
            confirmDelete.addEventListener('click', () => this.confirmDelete());
        }

        // Close modals on outside click
        [editModal, deleteModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.hideEditModal();
                        this.hideDeleteModal();
                    }
                });
            }
        });

        // Close modal buttons
        const modalCloses = document.querySelectorAll('.modal-close');
        modalCloses.forEach(btn => {
            btn.addEventListener('click', () => {
                this.hideEditModal();
                this.hideDeleteModal();
            });
        });
    }

    async loadUserLinks() {
        this.showLoading();

        try {
            console.log('MyLinks: Starting to load user links...');

            // Get current session from Supabase
            const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();

            console.log('MyLinks: Session for links:', { session: !!session, sessionError });

            if (sessionError || !session?.access_token) {
                console.error('MyLinks: No valid session for loading links');
                this.showError('Необходима авторизация');
                return;
            }

            console.log('MyLinks: Loading user links with valid session, user ID should be available from auth context');

            const response = await fetch('/api/links', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            console.log('MyLinks: Links API response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('MyLinks: Links API response data:', data);

                if (data.success) {
                    this.links = data.data.links || [];
                    console.log('MyLinks: Loaded links count:', this.links.length);
                    console.log('MyLinks: Links data:', this.links);
                    this.filterAndSortLinks();
                    this.renderLinks();
                } else {
                    console.error('MyLinks: API returned success=false:', data.error);
                    this.showError(data.error || 'Не удалось загрузить ссылки');
                }
            } else {
                const errorText = await response.text();
                console.error('MyLinks: Links API error response:', response.status, errorText);
                this.showError(`Ошибка сервера: ${response.status}`);
            }
        } catch (error) {
            console.error('MyLinks: Load links error:', error);
            this.showError('Ошибка сети при загрузке ссылок');
        } finally {
            this.hideLoading();
        }
    }

    filterAndSortLinks() {
        // Filter by search query
        this.filteredLinks = this.links.filter(link => {
            if (!this.searchQuery) return true;

            const query = this.searchQuery.toLowerCase();
            return (
                link.title?.toLowerCase().includes(query) ||
                link.original_url?.toLowerCase().includes(query) ||
                link.short_code?.toLowerCase().includes(query)
            );
        });

        // Sort links
        this.filteredLinks.sort((a, b) => {
            switch (this.sortBy) {
                case 'created_desc':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'created_asc':
                    return new Date(a.created_at) - new Date(b.created_at);
                case 'clicks_desc':
                    return (b.click_count || 0) - (a.click_count || 0);
                case 'title_asc':
                    return (a.title || '').localeCompare(b.title || '');
                default:
                    return 0;
            }
        });
    }

    renderLinks() {
        const linksGrid = document.getElementById('linksGrid');
        const emptyState = document.getElementById('emptyState');

        if (!linksGrid) return;

        // Calculate pagination
        const totalPages = Math.ceil(this.filteredLinks.length / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageLinks = this.filteredLinks.slice(startIndex, endIndex);

        if (this.filteredLinks.length === 0) {
            linksGrid.innerHTML = '';
            if (emptyState) emptyState.style.display = 'flex';
            this.hidePagination();
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        linksGrid.innerHTML = pageLinks.map(link => this.createLinkCard(link)).join('');
        this.updatePagination(totalPages);
    }

    createLinkCard(link) {
        const createdDate = new Date(link.created_at).toLocaleDateString('ru-RU');
        const shortUrl = `${window.location.origin}/s/${link.short_code}`;

        return `
            <div class="link-card" data-id="${link.id}">
                <div class="link-header">
                    <div class="link-title">${link.title || 'Без названия'}</div>
                    <div class="link-actions">
                        <button class="edit-btn" onclick="myLinksManager.showEditModal('${link.id}')" title="Редактировать">
                            ✏️
                        </button>
                        <button class="copy-btn" onclick="myLinksManager.copyToClipboard('${shortUrl}')" title="Копировать">
                            📋
                        </button>
                        <button class="delete-btn" onclick="myLinksManager.showDeleteModal('${link.id}', '${shortUrl}')" title="Удалить">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="link-content">
                    <div class="original-url">${link.original_url}</div>
                    <div class="short-url">${shortUrl}</div>
                </div>
                <div class="link-stats">
                    <div class="stat-item">
                        <span>🔗</span>
                        <span>${link.click_count || 0} кликов</span>
                    </div>
                    <div class="stat-item">
                        <span>📅</span>
                        <span>${createdDate}</span>
                    </div>
                </div>
            </div>
        `;
    }

    updatePagination(totalPages) {
        const pagination = document.getElementById('pagination');
        const pageInfo = document.getElementById('pageInfo');
        const prevPage = document.getElementById('prevPage');
        const nextPage = document.getElementById('nextPage');

        if (totalPages <= 1) {
            if (pagination) pagination.style.display = 'none';
            return;
        }

        if (pagination) pagination.style.display = 'flex';
        if (pageInfo) pageInfo.textContent = `Страница ${this.currentPage} из ${totalPages}`;
        if (prevPage) prevPage.disabled = this.currentPage <= 1;
        if (nextPage) nextPage.disabled = this.currentPage >= totalPages;
    }

    hidePagination() {
        const pagination = document.getElementById('pagination');
        if (pagination) pagination.style.display = 'none';
    }

    changePage(page) {
        const totalPages = Math.ceil(this.filteredLinks.length / this.itemsPerPage);
        if (page < 1 || page > totalPages) return;

        this.currentPage = page;
        this.renderLinks();

        // Scroll to top of links grid
        const linksGrid = document.getElementById('linksGrid');
        if (linksGrid) {
            linksGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    showEditModal(linkId) {
        const link = this.links.find(l => l.id === linkId);
        if (!link) return;

        const editModal = document.getElementById('editModal');
        const editTitle = document.getElementById('editTitle');
        const editOriginalUrl = document.getElementById('editOriginalUrl');
        const editCustomSlug = document.getElementById('editCustomSlug');

        if (editTitle) editTitle.value = link.title || '';
        if (editOriginalUrl) editOriginalUrl.value = link.original_url;
        if (editCustomSlug) editCustomSlug.value = link.short_code;

        this.editingLinkId = linkId;
        if (editModal) editModal.style.display = 'flex';
    }

    hideEditModal() {
        const editModal = document.getElementById('editModal');
        if (editModal) editModal.style.display = 'none';
        this.editingLinkId = null;
    }

    async saveLinkEdit() {
        const editTitle = document.getElementById('editTitle');
        const editOriginalUrl = document.getElementById('editOriginalUrl');
        const editCustomSlug = document.getElementById('editCustomSlug');

        const title = editTitle?.value.trim() || '';
        const originalUrl = editOriginalUrl?.value.trim();
        const customSlug = editCustomSlug?.value.trim();

        if (!originalUrl) {
            alert('Введите URL');
            return;
        }

        try {
            // Get current session from Supabase
            const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();

            if (sessionError || !session?.access_token) {
                this.showToast('Необходима авторизация', 'error');
                return;
            }

            const response = await fetch(`/api/links/${this.editingLinkId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    title,
                    original_url: originalUrl,
                    short_code: customSlug || null
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.hideEditModal();
                    this.loadUserLinks(); // Reload links
                    this.showToast('Ссылка обновлена!', 'success');
                } else {
                    this.showToast(data.error || 'Ошибка обновления', 'error');
                }
            } else {
                this.showToast('Ошибка обновления ссылки', 'error');
            }
        } catch (error) {
            console.error('Save edit error:', error);
            this.showToast('Ошибка сети', 'error');
        }
    }

    showDeleteModal(linkId, shortUrl) {
        const deleteModal = document.getElementById('deleteModal');
        const deleteUrl = document.getElementById('deleteUrl');

        if (deleteUrl) deleteUrl.textContent = shortUrl;

        this.deletingLinkId = linkId;
        if (deleteModal) deleteModal.style.display = 'flex';
    }

    hideDeleteModal() {
        const deleteModal = document.getElementById('deleteModal');
        if (deleteModal) deleteModal.style.display = 'none';
        this.deletingLinkId = null;
    }

    async confirmDelete() {
        if (!this.deletingLinkId) return;

        try {
            // Get current session from Supabase
            const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();

            if (sessionError || !session?.access_token) {
                this.showToast('Необходима авторизация', 'error');
                return;
            }

            const response = await fetch(`/api/links/${this.deletingLinkId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (response.ok) {
                this.hideDeleteModal();
                this.loadUserLinks(); // Reload links
                this.showToast('Ссылка удалена!', 'success');
            } else {
                this.showToast('Ошибка удаления ссылки', 'error');
            }
        } catch (error) {
            console.error('Delete error:', error);
            this.showToast('Ошибка сети', 'error');
        }
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Ссылка скопирована!', 'success');
        } catch (error) {
            console.error('Copy error:', error);
            // Fallback
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('Ссылка скопирована!', 'success');
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

    showLoading() {
        const loadingState = document.getElementById('loadingState');
        const linksGrid = document.getElementById('linksGrid');
        const emptyState = document.getElementById('emptyState');

        if (loadingState) loadingState.style.display = 'flex';
        if (linksGrid) linksGrid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'none';
    }

    hideLoading() {
        const loadingState = document.getElementById('loadingState');
        const linksGrid = document.getElementById('linksGrid');

        if (loadingState) loadingState.style.display = 'none';
        if (linksGrid) linksGrid.style.display = 'grid';
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    redirectToHome() {
        window.location.href = '/';
    }

    async logout() {
        if (window.authManager) {
            await window.authManager.logout();
            return;
        }

        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            localStorage.removeItem('supabase_auth_session');
            localStorage.removeItem('supabase_auth_token');
            localStorage.removeItem('supabase.auth.token');
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = '/';
        }
    }

    showProfile() {
        // Navigate to profile page
        window.location.href = '/profile';
    }

    showAuthRequiredMessage() {
        if (document.getElementById('auth-required')) {
            return;
        }

        const loadingState = document.getElementById('loadingState');
        if (loadingState) loadingState.style.display = 'none';
        const linksGrid = document.getElementById('linksGrid');
        if (linksGrid) linksGrid.style.display = 'none';

        // Hide the main content and show auth required message
        const mainContent = document.querySelector('main');
        if (mainContent) mainContent.style.display = 'none';

        const authRequired = document.createElement('div');
        authRequired.id = 'auth-required';
        authRequired.innerHTML = `
            <div class="auth-required-container">
                <div class="auth-required-icon">🔒</div>
                <h2>Требуется авторизация</h2>
                <p>Чтобы просмотреть свои ссылки, необходимо войти в систему.</p>
                <div class="auth-required-actions">
                    <button id="goToLogin" class="btn btn-primary">Войти</button>
                    <button id="goToRegister" class="btn btn-outline">Зарегистрироваться</button>
                </div>
                <p class="auth-required-note">У вас нет аккаунта? <a href="#" id="registerLink">Создайте его бесплатно</a></p>
            </div>
        `;

        // Hide main content
        const container = document.querySelector('.container');
        if (container) {
            container.appendChild(authRequired);
        }

        const openAuthModal = (tab) => {
            if (window.authManager) {
                window.authManager.showModal(tab);
            } else {
                window.location.href = '/';
            }
        };

        const loginBtn = document.getElementById('goToLogin');
        const registerBtn = document.getElementById('goToRegister');
        const registerLink = document.getElementById('registerLink');

        if (loginBtn) {
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                openAuthModal('login');
            });
        }
        if (registerBtn) {
            registerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                openAuthModal('register');
            });
        }
        if (registerLink) {
            registerLink.addEventListener('click', (e) => {
                e.preventDefault();
                openAuthModal('register');
            });
        }
    }

    showAuthModal(tab = 'login') {
        // Since we don't have AuthManager on this page, redirect to home
        window.location.href = '/';
    }

    hideAuthRequiredMessage() {
        const authRequired = document.getElementById('auth-required');
        if (authRequired && authRequired.parentNode) {
            authRequired.parentNode.removeChild(authRequired);
        }

        const mainContent = document.querySelector('main');
        if (mainContent) {
            mainContent.style.display = '';
        }
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

// Функция для загрузки и отображения версии (используется из components.js)

// Initialize the manager when DOM is loaded
let myLinksManager;
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize common components with auth state
    initCommonComponents('/my-links', 'ru');

    myLinksManager = new MyLinksManager();
});
