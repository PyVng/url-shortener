// Common components for URL Shortener

// Translations for components
const componentTranslations = {
    ru: {
        languageLabel: "Язык:",
        home: "Главная",
        myLinks: "Мои ссылки",
        profile: "Профиль",
        login: "Войти",
        register: "Регистрация",
        logout: "Выйти"
    },
    en: {
        languageLabel: "Language:",
        home: "Home",
        myLinks: "My Links",
        profile: "Profile",
        login: "Login",
        register: "Register",
        logout: "Logout"
    },
    es: {
        languageLabel: "Idioma:",
        home: "Inicio",
        myLinks: "Mis enlaces",
        profile: "Perfil",
        login: "Iniciar sesión",
        register: "Registrarse",
        logout: "Cerrar sesión"
    },
    fr: {
        languageLabel: "Langue:",
        home: "Accueil",
        myLinks: "Mes liens",
        profile: "Profil",
        login: "Se connecter",
        register: "S'inscrire",
        logout: "Se déconnecter"
    },
    de: {
        languageLabel: "Sprache:",
        home: "Startseite",
        myLinks: "Meine Links",
        profile: "Profil",
        login: "Anmelden",
        register: "Registrieren",
        logout: "Abmelden"
    },
    zh: {
        languageLabel: "语言:",
        home: "首页",
        myLinks: "我的链接",
        profile: "个人资料",
        login: "登录",
        register: "注册",
        logout: "登出"
    },
    ja: {
        languageLabel: "言語:",
        home: "ホーム",
        myLinks: "マイリンク",
        profile: "プロフィール",
        login: "ログイン",
        register: "登録",
        logout: "ログアウト"
    },
    ar: {
        languageLabel: "اللغة:",
        home: "الرئيسية",
        myLinks: "روابطي",
        profile: "الملف الشخصي",
        login: "تسجيل الدخول",
        register: "التسجيل",
        logout: "تسجيل الخروج"
    },
    pt: {
        languageLabel: "Idioma:",
        home: "Início",
        myLinks: "Meus links",
        profile: "Perfil",
        login: "Entrar",
        register: "Registrar",
        logout: "Sair"
    },
    it: {
        languageLabel: "Lingua:",
        home: "Home",
        myLinks: "I miei link",
        profile: "Profilo",
        login: "Accedi",
        register: "Registrati",
        logout: "Esci"
    },
    hi: {
        languageLabel: "भाषा:",
        home: "होम",
        myLinks: "मेरी लिंक्स",
        profile: "प्रोफ़ाइल",
        login: "लॉग इन",
        register: "पंजीकरण",
        logout: "लॉग आउट"
    },
    ko: {
        languageLabel: "언어:",
        home: "홈",
        myLinks: "내 링크",
        profile: "프로필",
        login: "로그인",
        register: "등록",
        logout: "로그아웃"
    },
    tr: {
        languageLabel: "Dil:",
        home: "Ana Sayfa",
        myLinks: "Bağlantılarım",
        profile: "Profil",
        login: "Giriş",
        register: "Kayıt",
        logout: "Çıkış"
    },
    pl: {
        languageLabel: "Język:",
        home: "Strona główna",
        myLinks: "Moje linki",
        profile: "Profil",
        login: "Zaloguj się",
        register: "Zarejestruj się",
        logout: "Wyloguj się"
    },
    nl: {
        languageLabel: "Taal:",
        home: "Home",
        myLinks: "Mijn links",
        profile: "Profiel",
        login: "Inloggen",
        register: "Registreren",
        logout: "Uitloggen"
    }
};

class HeaderComponent {
    static render(currentLang = 'ru') {
        const t = componentTranslations[currentLang] || componentTranslations.ru;

        return `
            <!-- Top Navigation Bar -->
            <nav class="top-nav">
                <div class="nav-container">
                    <div class="nav-left">
                        <div class="language-selector">
                            <label for="languageSelect">${t.languageLabel}</label>
                            <select id="languageSelect">
                                <option value="en">English</option>
                                <option value="zh">中文</option>
                                <option value="es">Español</option>
                                <option value="ar">العربية</option>
                                <option value="hi">हिन्दी</option>
                                <option value="ru" ${currentLang === 'ru' ? 'selected' : ''}>Русский</option>
                                <option value="fr">Français</option>
                                <option value="ja">日本語</option>
                                <option value="de">Deutsch</option>
                                <option value="pt">Português</option>
                                <option value="it">Italiano</option>
                                <option value="ko">한국어</option>
                                <option value="tr">Türkçe</option>
                                <option value="pl">Polski</option>
                                <option value="nl">Nederlands</option>
                            </select>
                        </div>
                    </div>
                    <div class="nav-right">
                        <div class="nav-links">
                            <a href="/" class="nav-link">${t.home}</a>
                            <a href="/my-links" class="nav-link">${t.myLinks}</a>
                        </div>
                        <div class="auth-section">
                            <button id="loginBtn" class="btn btn-outline auth-btn">${t.login}</button>
                            <button id="registerBtn" class="btn btn-primary auth-btn">${t.register}</button>
                            <div id="userInfo" class="user-info" style="display: none;">
                                <div class="user-avatar">👤</div>
                                <div class="user-details">
                                    <div class="user-display-name" id="userDisplayName"></div>
                                    <div class="user-email" id="userEmail"></div>
                                </div>
                                <div class="user-menu-toggle">▼</div>
                                <div class="user-dropdown" id="userDropdown">
                                    <a href="#" class="dropdown-item" id="myLinksLink">
                                        <span class="dropdown-icon">🔗</span>
                                        ${t.myLinks}
                                    </a>
                                    <a href="#" class="dropdown-item" id="profileLink">
                                        <span class="dropdown-icon">👤</span>
                                        ${t.profile}
                                    </a>
                                    <div class="dropdown-divider"></div>
                                    <a href="#" class="dropdown-item logout-link" id="logoutBtn">
                                        <span class="dropdown-icon">🚪</span>
                                        ${t.logout}
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        `;
    }

    static setActiveLink(page) {
        const links = document.querySelectorAll('.nav-link');
        links.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === page) {
                link.classList.add('active');
            }
        });
    }
}

class FooterComponent {
    static render() {
        return `
            <footer>
                <p>&copy; 2025 URL Shortener. Создано с помощью Node.js и Express. <span id="version-info">Версия: загружается...</span></p>
            </footer>
        `;
    }
}

// Функция для загрузки и отображения версии (общая для всех страниц)
async function loadVersion() {
    try {
        const response = await fetch('/api/version');
        if (response.ok) {
            const data = await response.json();
            const versionElement = document.getElementById('version-info');
            if (versionElement) {
                versionElement.textContent = `Версия: ${data.version} (${data.lastUpdated})`;
                console.log('Version loaded:', data);
            }
        }
    } catch (error) {
        console.error('Failed to load version:', error);
        const versionElement = document.getElementById('version-info');
        if (versionElement) {
            versionElement.textContent = 'Версия: неизвестна';
        }
    }
}

// Функция для инициализации общих компонентов
function initCommonComponents(currentPage = '/', currentLang = 'ru') {
    // Рендерим header с текущим языком
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        headerContainer.innerHTML = HeaderComponent.render(currentLang);
    }

    // Устанавливаем активную ссылку в навигации
    HeaderComponent.setActiveLink(currentPage);

    // Загружаем версию
    loadVersion();
}
