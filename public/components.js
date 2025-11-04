// Simplified components for URL Shortener - only Supabase initialization and basic utilities

// Initialize Supabase client for all pages
(function() {
    // Check if Supabase is already initialized (from any page)
    if (typeof window.supabase !== 'undefined') {
        console.log('Components: Supabase already initialized');
        window.dispatchEvent(new Event('supabaseReady'));
        return;
    }

    // Check if Supabase script is already loaded
    if (typeof supabase !== 'undefined') {
        console.log('Components: Supabase script already loaded, initializing client');
        initSupabaseClient();
        return;
    }

    // Load Supabase script if not already loaded
    console.log('Components: Loading Supabase script');
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
    script.onload = function() {
        console.log('Components: Supabase script loaded, initializing client');
        initSupabaseClient();
    };
    script.onerror = function() {
        console.error('Components: Failed to load Supabase script');
    };
    document.head.appendChild(script);

    function initSupabaseClient() {
        const SUPABASE_URL = window.APP_CONFIG?.SUPABASE_URL || 'https://dkbvavfdjpamsmezfrrt.supabase.co';
        const SUPABASE_ANON_KEY = window.APP_CONFIG?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrYnZhdmZkanBhbXNtZXpmcnJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNDc0MzEsImV4cCI6MjA3NzcyMzQzMX0.4NBBusEGQyfikpidc8QCoqhIjWs_7FoJCCNwjJ8C-cI';

        // Check if the global supabase library is available
        if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') {
            console.error('Components: Supabase library not loaded correctly');
            return;
        }

        try {
            window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: true
                }
            });

            console.log('Components: Supabase client initialized');
            console.log('Components: Supabase client auth object:', window.supabase.auth ? 'exists' : 'missing');
            window.dispatchEvent(new Event('supabaseReady'));
        } catch (error) {
            console.error('Components: Failed to initialize Supabase client:', error);
        }
    }
})();

// Function to load version information
async function loadVersion(currentLang = 'ru') {
    const versionTexts = {
        ru: { version: 'Версия', loading: 'загружается', unknown: 'неизвестна' },
        en: { version: 'Version', loading: 'loading', unknown: 'unknown' }
    };
    
    const t = versionTexts[currentLang] || versionTexts.ru;
    console.log('loadVersion called with lang:', currentLang);

    try {
        console.log('Fetching /api/version...');
        const response = await fetch('/api/version');
        console.log('Version API response status:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('Version API data:', data);

            const versionElement = document.getElementById('version-info');
            console.log('Version element found:', !!versionElement);

            if (versionElement) {
                // Форматируем версию с git информацией
                const commitShort = data.git?.commit?.substring(0, 7) || 'unknown';
                const commitDate = data.git?.timestamp ? new Date(data.git.timestamp).toLocaleDateString(currentLang === 'ru' ? 'ru-RU' : 'en-US') : 'unknown';
                const versionText = `${t.version}: ${data.version} (${commitShort} ${commitDate})`;
                versionElement.textContent = versionText;
                console.log('Version set to:', versionText);
            } else {
                console.error('Version element #version-info not found!');
            }
        } else {
            console.error('Version API failed with status:', response.status);
        }
    } catch (error) {
        console.error('Failed to load version:', error);
        const versionElement = document.getElementById('version-info');
        if (versionElement) {
            versionElement.textContent = `${t.version}: ${t.unknown}`;
        }
    }
}

// Setup navigation handlers for dropdown menu items
function setupNavigationHandlers() {
    console.log('🔍 Setting up navigation handlers...');

    // Dropdown menu items
    const myLinksLink = document.getElementById('myLinksLink');
    const profileLink = document.getElementById('profileLink');

    if (myLinksLink) {
        console.log('🔍 Found myLinksLink, setting up handler');
        myLinksLink.onclick = (event) => {
            console.log('🔍 My links link clicked');
            event.preventDefault();
            window.location.href = '/my-links';
        };
    } else {
        console.log('🔍 myLinksLink not found');
    }

    if (profileLink) {
        console.log('🔍 Found profileLink - using HTML href="/profile"');
        // Remove onclick handler - let HTML href handle navigation
        profileLink.onclick = null;
    } else {
        console.log('🔍 profileLink not found');
    }
}

// Initialize basic functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing basic components...');

    // Determine current page path
    const currentPath = window.location.pathname;
    const currentLang = document.documentElement?.lang || 'ru';

    // Load version with a small delay to ensure DOM is ready
    setTimeout(() => loadVersion(currentLang), 100);

    // Setup navigation handlers
    setupNavigationHandlers();

    // Listen for auth ready event (for pages with AuthManager)
    window.addEventListener('auth:ready', () => {
        console.log('Auth ready, refreshing navigation handlers...');
        setupNavigationHandlers();
    });
});
