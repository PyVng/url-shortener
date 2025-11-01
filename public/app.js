// URL Shortener Frontend JavaScript with Authentication

const translations = {
    ru: {
        title: "URL Shortener",
        subtitle: "Сократите длинные ссылки в короткие и удобные",
        languageLabel: "Язык:",
        login: "Войти",
        register: "Регистрация",
        logout: "Выйти",
        welcome: "Привет",
        authError: "Ошибка аутентификации",
        loginSuccess: "Успешный вход",
        registerSuccess: "Регистрация успешна",
        logoutSuccess: "Выход выполнен",
        enterUrlLabel: "Введите длинный URL:",
        urlPlaceholder: "https://example.com/very/long/url/that/needs/to/be/shortened",
        shortenBtn: "Сократить URL",
        shortening: "Сокращаем...",
        successTitle: "✅ URL успешно сокращен!",
        originalUrlLabel: "Оригинальный URL:",
        shortUrlLabel: "Короткий URL:",
        copyBtn: "Копировать",
        goToBtn: "Перейти",
        createNewBtn: "Создать новый",
        errorTitle: "❌ Ошибка",
        tryAgainBtn: "Попробовать снова",
        footer: "&copy; 2025 URL Shortener. Создано с помощью Node.js и Express.",
        enterUrlError: "Введите URL для сокращения",
        invalidUrlError: "Введите корректный URL (начинающийся с http:// или https://)",
        serverError: "Не удалось подключиться к серверу. Проверьте подключение к интернету.",
        genericError: "Произошла ошибка при сокращении URL",
        copied: "✅ Скопировано!",
        invalidUrlValidation: "Введите корректный URL (начинающийся с http:// или https://)"
    },
    en: {
        title: "URL Shortener",
        subtitle: "Shorten long links into short and convenient ones",
        languageLabel: "Language:",
        login: "Login",
        register: "Register",
        logout: "Logout",
        welcome: "Welcome",
        authError: "Authentication error",
        loginSuccess: "Login successful",
        registerSuccess: "Registration successful",
        logoutSuccess: "Logged out",
        enterUrlLabel: "Enter long URL:",
        urlPlaceholder: "https://example.com/very/long/url/that/needs/to/be/shortened",
        shortenBtn: "Shorten URL",
        shortening: "Shortening...",
        successTitle: "✅ URL successfully shortened!",
        originalUrlLabel: "Original URL:",
        shortUrlLabel: "Short URL:",
        copyBtn: "Copy",
        goToBtn: "Go to",
        createNewBtn: "Create new",
        errorTitle: "❌ Error",
        tryAgainBtn: "Try again",
        footer: "&copy; 2025 URL Shortener. Created with Node.js and Express.",
        enterUrlError: "Enter URL to shorten",
        invalidUrlError: "Enter a valid URL (starting with http:// or https://)",
        serverError: "Failed to connect to server. Check your internet connection.",
        genericError: "An error occurred while shortening the URL",
        copied: "✅ Copied!",
        invalidUrlValidation: "Enter a valid URL (starting with http:// or https://)"
    },
    es: {
        title: "Acortador de URL",
        subtitle: "Acorta enlaces largos en cortos y convenientes",
        languageLabel: "Idioma:",
        login: "Iniciar sesión",
        register: "Registrarse",
        logout: "Cerrar sesión",
        welcome: "Bienvenido",
        authError: "Error de autenticación",
        loginSuccess: "Inicio de sesión exitoso",
        registerSuccess: "Registro exitoso",
        logoutSuccess: "Sesión cerrada",
        enterUrlLabel: "Ingresa URL larga:",
        urlPlaceholder: "https://example.com/muy/largo/url/que/necesita/ser/acortado",
        shortenBtn: "Acortar URL",
        shortening: "Acortando...",
        successTitle: "✅ ¡URL acortada exitosamente!",
        originalUrlLabel: "URL original:",
        shortUrlLabel: "URL corta:",
        copyBtn: "Copiar",
        goToBtn: "Ir a",
        createNewBtn: "Crear nuevo",
        errorTitle: "❌ Error",
        tryAgainBtn: "Intentar de nuevo",
        footer: "&copy; 2025 Acortador de URL. Creado con Node.js y Express.",
        enterUrlError: "Ingresa URL para acortar",
        invalidUrlError: "Ingresa una URL válida (que comience con http:// o https://)",
        serverError: "No se pudo conectar al servidor. Verifica tu conexión a internet.",
        genericError: "Ocurrió un error al acortar la URL",
        copied: "✅ ¡Copiado!",
        invalidUrlValidation: "Ingresa una URL válida (que comience con http:// o https://)"
    },
    fr: {
        title: "Raccourcisseur d'URL",
        subtitle: "Raccourcissez les liens longs en liens courts et pratiques",
        languageLabel: "Langue:",
        login: "Se connecter",
        register: "S'inscrire",
        logout: "Se déconnecter",
        welcome: "Bienvenue",
        authError: "Erreur d'authentification",
        loginSuccess: "Connexion réussie",
        registerSuccess: "Inscription réussie",
        logoutSuccess: "Déconnexion réussie",
        enterUrlLabel: "Entrez l'URL longue:",
        urlPlaceholder: "https://example.com/tres/long/url/qui/doit/etre/raccourci",
        shortenBtn: "Raccourcir l'URL",
        shortening: "Raccourcissement...",
        successTitle: "✅ URL raccourcie avec succès!",
        originalUrlLabel: "URL originale:",
        shortUrlLabel: "URL courte:",
        copyBtn: "Copier",
        goToBtn: "Aller à",
        createNewBtn: "Créer nouveau",
        errorTitle: "❌ Erreur",
        tryAgainBtn: "Réessayer",
        footer: "&copy; 2025 Raccourcisseur d'URL. Créé avec Node.js et Express.",
        enterUrlError: "Entrez l'URL à raccourcir",
        invalidUrlError: "Entrez une URL valide (commençant par http:// ou https://)",
        serverError: "Échec de connexion au serveur. Vérifiez votre connexion internet.",
        genericError: "Une erreur s'est produite lors du raccourcissement de l'URL",
        copied: "✅ Copié!",
        invalidUrlValidation: "Entrez une URL valide (commençant par http:// ou https://)"
    },
    de: {
        title: "URL-Verkürzer",
        subtitle: "Verkürzen Sie lange Links zu kurzen und praktischen",
        languageLabel: "Sprache:",
        login: "Anmelden",
        register: "Registrieren",
        logout: "Abmelden",
        welcome: "Willkommen",
        authError: "Authentifizierungsfehler",
        loginSuccess: "Erfolgreich angemeldet",
        registerSuccess: "Registrierung erfolgreich",
        logoutSuccess: "Abgemeldet",
        enterUrlLabel: "Lange URL eingeben:",
        urlPlaceholder: "https://example.com/sehr/lange/url/die/verkuerzt/werden/muss",
        shortenBtn: "URL verkürzen",
        shortening: "Verkürzung...",
        successTitle: "✅ URL erfolgreich verkürzt!",
        originalUrlLabel: "Original-URL:",
        shortUrlLabel: "Kurze URL:",
        copyBtn: "Kopieren",
        goToBtn: "Gehe zu",
        createNewBtn: "Neu erstellen",
        errorTitle: "❌ Fehler",
        tryAgainBtn: "Erneut versuchen",
        footer: "&copy; 2025 URL-Verkürzer. Erstellt mit Node.js und Express.",
        enterUrlError: "URL zum Verkürzen eingeben",
        invalidUrlError: "Geben Sie eine gültige URL ein (beginnend mit http:// oder https://)",
        serverError: "Verbindung zum Server fehlgeschlagen. Überprüfen Sie Ihre Internetverbindung.",
        genericError: "Beim Verkürzen der URL ist ein Fehler aufgetreten",
        copied: "✅ Kopiert!",
        invalidUrlValidation: "Geben Sie eine gültige URL ein (beginnend mit http:// oder https://)"
    },
    zh: {
        title: "URL 缩短器",
        subtitle: "将长链接缩短为短而方便的链接",
        languageLabel: "语言:",
        login: "登录",
        register: "注册",
        logout: "登出",
        welcome: "欢迎",
        authError: "认证错误",
        loginSuccess: "登录成功",
        registerSuccess: "注册成功",
        logoutSuccess: "已登出",
        enterUrlLabel: "输入长 URL:",
        urlPlaceholder: "https://example.com/very/long/url/that/needs/to/be/shortened",
        shortenBtn: "缩短 URL",
        shortening: "正在缩短...",
        successTitle: "✅ URL 成功缩短!",
        originalUrlLabel: "原始 URL:",
        shortUrlLabel: "短 URL:",
        copyBtn: "复制",
        goToBtn: "前往",
        createNewBtn: "创建新的",
        errorTitle: "❌ 错误",
        tryAgainBtn: "重试",
        footer: "&copy; 2025 URL 缩短器。使用 Node.js 和 Express 创建。",
        enterUrlError: "输入要缩短的 URL",
        invalidUrlError: "输入有效的 URL（以 http:// 或 https:// 开头）",
        serverError: "无法连接到服务器。请检查您的互联网连接。",
        genericError: "缩短 URL 时发生错误",
        copied: "✅ 已复制!",
        invalidUrlValidation: "输入有效的 URL（以 http:// 或 https:// 开头）"
    },
    ja: {
        title: "URL 短縮ツール",
        subtitle: "長いリンクを短く便利なものに短縮",
        languageLabel: "言語:",
        login: "ログイン",
        register: "登録",
        logout: "ログアウト",
        welcome: "ようこそ",
        authError: "認証エラー",
        loginSuccess: "ログイン成功",
        registerSuccess: "登録成功",
        logoutSuccess: "ログアウトしました",
        enterUrlLabel: "長い URL を入力:",
        urlPlaceholder: "https://example.com/very/long/url/that/needs/to/be/shortened",
        shortenBtn: "URL を短縮",
        shortening: "短縮中...",
        successTitle: "✅ URL が正常に短縮されました!",
        originalUrlLabel: "元の URL:",
        shortUrlLabel: "短い URL:",
        copyBtn: "コピー",
        goToBtn: "移動",
        createNewBtn: "新規作成",
        errorTitle: "❌ エラー",
        tryAgainBtn: "再試行",
        footer: "&copy; 2025 URL 短縮ツール。Node.js と Express で作成。",
        enterUrlError: "短縮する URL を入力",
        invalidUrlError: "有効な URL を入力してください（http:// または https:// で始まる）",
        serverError: "サーバーに接続できませんでした。インターネット接続を確認してください。",
        genericError: "URL の短縮中にエラーが発生しました",
        copied: "✅ コピーされました!",
        invalidUrlValidation: "有効な URL を入力してください（http:// または https:// で始まる）"
    },
    ar: {
        title: "مختصر URL",
        subtitle: "اختصر الروابط الطويلة إلى روابط قصيرة ومريحة",
        languageLabel: "اللغة:",
        enterUrlLabel: "أدخل URL طويل:",
        urlPlaceholder: "https://example.com/very/long/url/that/needs/to/be/shortened",
        shortenBtn: "اختصر URL",
        shortening: "جاري الاختصار...",
        successTitle: "✅ تم اختصار URL بنجاح!",
        originalUrlLabel: "URL الأصلي:",
        shortUrlLabel: "URL قصير:",
        copyBtn: "نسخ",
        goToBtn: "اذهب إلى",
        createNewBtn: "إنشاء جديد",
        errorTitle: "❌ خطأ",
        tryAgainBtn: "حاول مرة أخرى",
        footer: "&copy; 2025 مختصر URL. تم إنشاؤه باستخدام Node.js و Express.",
        enterUrlError: "أدخل URL للاختصار",
        invalidUrlError: "أدخل URL صالح (يبدأ بـ http:// أو https://)",
        serverError: "فشل في الاتصال بالخادم. تحقق من اتصال الإنترنت الخاص بك.",
        genericError: "حدث خطأ أثناء اختصار URL",
        copied: "✅ تم النسخ!",
        invalidUrlValidation: "أدخل URL صالح (يبدأ بـ http:// أو https://)"
    },
    pt: {
        title: "Encurtador de URL",
        subtitle: "Encurte links longos em links curtos e convenientes",
        languageLabel: "Idioma:",
        enterUrlLabel: "Digite URL longa:",
        urlPlaceholder: "https://example.com/muito/longo/url/que/precisa/ser/encurtado",
        shortenBtn: "Encurtar URL",
        shortening: "Encurtando...",
        successTitle: "✅ URL encurtada com sucesso!",
        originalUrlLabel: "URL original:",
        shortUrlLabel: "URL curta:",
        copyBtn: "Copiar",
        goToBtn: "Ir para",
        createNewBtn: "Criar novo",
        errorTitle: "❌ Erro",
        tryAgainBtn: "Tentar novamente",
        footer: "&copy; 2025 Encurtador de URL. Criado com Node.js e Express.",
        enterUrlError: "Digite URL para encurtar",
        invalidUrlError: "Digite uma URL válida (começando com http:// ou https://)",
        serverError: "Falha ao conectar ao servidor. Verifique sua conexão com a internet.",
        genericError: "Ocorreu um erro ao encurtar a URL",
        copied: "✅ Copiado!",
        invalidUrlValidation: "Digite uma URL válida (começando com http:// ou https://)"
    },
    it: {
        title: "Accorciatore URL",
        subtitle: "Accorcia link lunghi in link corti e convenienti",
        languageLabel: "Lingua:",
        enterUrlLabel: "Inserisci URL lungo:",
        urlPlaceholder: "https://example.com/molto/lungo/url/che/deve/essere/accorciato",
        shortenBtn: "Accorcia URL",
        shortening: "Accorciamento...",
        successTitle: "✅ URL accorciata con successo!",
        originalUrlLabel: "URL originale:",
        shortUrlLabel: "URL corta:",
        copyBtn: "Copia",
        goToBtn: "Vai a",
        createNewBtn: "Crea nuovo",
        errorTitle: "❌ Errore",
        tryAgainBtn: "Riprova",
        footer: "&copy; 2025 Accorciatore URL. Creato con Node.js e Express.",
        enterUrlError: "Inserisci URL da accorciare",
        invalidUrlError: "Inserisci un URL valido (che inizia con http:// o https://)",
        serverError: "Impossibile connettersi al server. Controlla la tua connessione internet.",
        genericError: "Si è verificato un errore durante l'accorciamento dell'URL",
        copied: "✅ Copiato!",
        invalidUrlValidation: "Inserisci un URL valido (che inizia con http:// o https://)"
    },
    hi: {
        title: "URL संक्षेपक",
        subtitle: "लंबी लिंक्स को छोटी और सुविधाजनक लिंक्स में संक्षिप्त करें",
        languageLabel: "भाषा:",
        enterUrlLabel: "लंबी URL दर्ज करें:",
        urlPlaceholder: "https://example.com/very/long/url/that/needs/to/be/shortened",
        shortenBtn: "URL संक्षिप्त करें",
        shortening: "संक्षिप्त किया जा रहा है...",
        successTitle: "✅ URL सफलतापूर्वक संक्षिप्त किया गया!",
        originalUrlLabel: "मूल URL:",
        shortUrlLabel: "छोटी URL:",
        copyBtn: "कॉपी करें",
        goToBtn: "जाएं",
        createNewBtn: "नया बनाएं",
        errorTitle: "❌ त्रुटि",
        tryAgainBtn: "पुनः प्रयास करें",
        footer: "&copy; 2025 URL संक्षेपक। Node.js और Express के साथ बनाया गया।",
        enterUrlError: "संक्षिप्त करने के लिए URL दर्ज करें",
        invalidUrlError: "एक वैध URL दर्ज करें (http:// या https:// से शुरू)",
        serverError: "सर्वर से कनेक्ट करने में विफल। अपनी इंटरनेट कनेक्शन जांचें।",
        genericError: "URL संक्षिप्त करने में त्रुटि हुई",
        copied: "✅ कॉपी किया गया!",
        invalidUrlValidation: "एक वैध URL दर्ज करें (http:// या https:// से शुरू)"
    },
    ko: {
        title: "URL 단축기",
        subtitle: "긴 링크를 짧고 편리한 링크로 단축",
        languageLabel: "언어:",
        enterUrlLabel: "긴 URL 입력:",
        urlPlaceholder: "https://example.com/very/long/url/that/needs/to/be/shortened",
        shortenBtn: "URL 단축",
        shortening: "단축 중...",
        successTitle: "✅ URL이 성공적으로 단축되었습니다!",
        originalUrlLabel: "원본 URL:",
        shortUrlLabel: "짧은 URL:",
        copyBtn: "복사",
        goToBtn: "이동",
        createNewBtn: "새로 만들기",
        errorTitle: "❌ 오류",
        tryAgainBtn: "다시 시도",
        footer: "&copy; 2025 URL 단축기. Node.js와 Express로 생성됨.",
        enterUrlError: "단축할 URL 입력",
        invalidUrlError: "유효한 URL을 입력하세요 (http:// 또는 https://로 시작)",
        serverError: "서버에 연결할 수 없습니다. 인터넷 연결을 확인하세요.",
        genericError: "URL 단축 중 오류가 발생했습니다",
        copied: "✅ 복사됨!",
        invalidUrlValidation: "유효한 URL을 입력하세요 (http:// 또는 https://로 시작)"
    },
    tr: {
        title: "URL Kısaltıcı",
        subtitle: "Uzun bağlantıları kısa ve kullanışlı bağlantılara kısaltın",
        languageLabel: "Dil:",
        enterUrlLabel: "Uzun URL girin:",
        urlPlaceholder: "https://example.com/cok/uzun/url/ki/kisaltilmali",
        shortenBtn: "URL'yi kısalt",
        shortening: "Kısaltılıyor...",
        successTitle: "✅ URL başarıyla kısaltıldı!",
        originalUrlLabel: "Orijinal URL:",
        shortUrlLabel: "Kısa URL:",
        copyBtn: "Kopyala",
        goToBtn: "Git",
        createNewBtn: "Yeni oluştur",
        errorTitle: "❌ Hata",
        tryAgainBtn: "Tekrar dene",
        footer: "&copy; 2025 URL Kısaltıcı. Node.js ve Express ile oluşturuldu.",
        enterUrlError: "Kısaltılacak URL'yi girin",
        invalidUrlError: "Geçerli bir URL girin (http:// veya https:// ile başlayan)",
        serverError: "Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.",
        genericError: "URL kısaltılırken bir hata oluştu",
        copied: "✅ Kopyalandı!",
        invalidUrlValidation: "Geçerli bir URL girin (http:// veya https:// ile başlayan)"
    },
    pl: {
        title: "Skracacz URL",
        subtitle: "Skróć długie linki do krótkich i wygodnych",
        languageLabel: "Język:",
        enterUrlLabel: "Wprowadź długi URL:",
        urlPlaceholder: "https://example.com/bardzo/dlugi/url/ktory/musi/zostac/skrocony",
        shortenBtn: "Skróć URL",
        shortening: "Skracanie...",
        successTitle: "✅ URL został pomyślnie skrócony!",
        originalUrlLabel: "Oryginalny URL:",
        shortUrlLabel: "Krótki URL:",
        copyBtn: "Kopiuj",
        goToBtn: "Przejdź do",
        createNewBtn: "Utwórz nowy",
        errorTitle: "❌ Błąd",
        tryAgainBtn: "Spróbuj ponownie",
        footer: "&copy; 2025 Skracacz URL. Utworzony z Node.js i Express.",
        enterUrlError: "Wprowadź URL do skrócenia",
        invalidUrlError: "Wprowadź prawidłowy URL (rozpoczynający się od http:// lub https://)",
        serverError: "Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe.",
        genericError: "Wystąpił błąd podczas skracania URL",
        copied: "✅ Skopiowano!",
        invalidUrlValidation: "Wprowadź prawidłowy URL (rozpoczynający się od http:// lub https://)"
    },
    nl: {
        title: "URL Verkorter",
        subtitle: "Verkort lange links naar korte en handige links",
        languageLabel: "Taal:",
        enterUrlLabel: "Voer lange URL in:",
        urlPlaceholder: "https://example.com/zeer/lange/url/die/moet/worden/verkort",
        shortenBtn: "URL verkorten",
        shortening: "Verkorten...",
        successTitle: "✅ URL succesvol verkort!",
        originalUrlLabel: "Originele URL:",
        shortUrlLabel: "Korte URL:",
        copyBtn: "Kopiëren",
        goToBtn: "Ga naar",
        createNewBtn: "Nieuwe maken",
        errorTitle: "❌ Fout",
        tryAgainBtn: "Probeer opnieuw",
        footer: "&copy; 2025 URL Verkorter. Gemaakt met Node.js en Express.",
        enterUrlError: "Voer URL in om te verkorten",
        invalidUrlError: "Voer een geldige URL in (beginnend met http:// of https://)",
        serverError: "Kan geen verbinding maken met server. Controleer uw internetverbinding.",
        genericError: "Er is een fout opgetreden bij het verkorten van de URL",
        copied: "✅ Gekopieerd!",
        invalidUrlValidation: "Voer een geldige URL in (beginnend met http:// of https://)"
    }
};

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authModal = null;
        this.init();
    }

    init() {
        this.checkAuthStatus();
        this.createAuthModal();
        this.setupEventListeners();
    }

    async checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/me');
            if (response.ok) {
                const data = await response.json();
                this.setCurrentUser(data.data.user);
            } else {
                this.setCurrentUser(null);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.setCurrentUser(null);
        }
    }

    setCurrentUser(user) {
        this.currentUser = user;
        this.updateUI();
    }

    updateUI() {
        const authBtn = document.getElementById('authBtn');
        const userInfo = document.getElementById('userInfo');
        const userName = document.getElementById('userName');
        const logoutBtn = document.getElementById('logoutBtn');

        if (this.currentUser) {
            if (authBtn) authBtn.style.display = 'none';
            if (userInfo) userInfo.style.display = 'block';
            if (userName) userName.textContent = this.currentUser.email || this.currentUser.name;
        } else {
            if (authBtn) authBtn.style.display = 'block';
            if (userInfo) userInfo.style.display = 'none';
        }
    }

    createAuthModal() {
        const modal = document.createElement('div');
        modal.id = 'authModal';
        modal.className = 'auth-modal';
        modal.innerHTML = `
            <div class="auth-modal-content">
                <span class="auth-modal-close">&times;</span>
                <div class="auth-tabs">
                    <button class="auth-tab active" data-tab="login">Вход</button>
                    <button class="auth-tab" data-tab="register">Регистрация</button>
                </div>
                <div id="loginForm" class="auth-form active">
                    <h3>Вход в аккаунт</h3>
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
                        <button type="submit" class="auth-submit-btn">Зарегистрироваться</button>
                    </form>
                </div>
                <div id="authMessage" class="auth-message"></div>
            </div>
        `;
        document.body.appendChild(modal);
        this.authModal = modal;
    }

    setupEventListeners() {
        // Auth buttons
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showModal('login'));
        }
        if (registerBtn) {
            registerBtn.addEventListener('click', () => this.showModal('register'));
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Modal events
        if (this.authModal) {
            const closeBtn = this.authModal.querySelector('.auth-modal-close');
            closeBtn.addEventListener('click', () => this.hideModal());

            window.addEventListener('click', (event) => {
                if (event.target === this.authModal) {
                    this.hideModal();
                }
            });

            // Tab switching
            const tabs = this.authModal.querySelectorAll('.auth-tab');
            tabs.forEach(tab => {
                tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
            });

            // Form submissions
            const loginForm = document.getElementById('loginFormElement');
            const registerForm = document.getElementById('registerFormElement');

            if (loginForm) {
                loginForm.addEventListener('submit', (e) => this.handleLogin(e));
            }
            if (registerForm) {
                registerForm.addEventListener('submit', (e) => this.handleRegister(e));
            }
        }
    }

    showModal(initialTab = 'login') {
        if (this.authModal) {
            this.authModal.style.display = 'block';
            this.switchTab(initialTab);
        }
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
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.setCurrentUser(data.data.user);
                this.hideModal();
                this.showMessage('Успешный вход!', 'success');
            } else {
                this.showMessage(data.error || 'Ошибка входа', 'error');
            }
        } catch (error) {
            this.showMessage('Ошибка сети', 'error');
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const name = document.getElementById('registerName').value;

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.setCurrentUser(data.data.user);
                this.hideModal();
                this.showMessage('Регистрация успешна!', 'success');
            } else {
                this.showMessage(data.error || 'Ошибка регистрации', 'error');
            }
        } catch (error) {
            this.showMessage('Ошибка сети', 'error');
        }
    }

    async logout() {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            this.setCurrentUser(null);
            this.showMessage('Выход выполнен', 'success');
        } catch (error) {
            console.error('Logout error:', error);
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
        this.currentLanguage = 'en'; // English as default
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

        this.init();
    }

    init() {
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
        this.copyBtn.addEventListener('click', this.copyToClipboard.bind(this));
        this.goToBtn.addEventListener('click', this.goToUrl.bind(this));
        this.createNewBtn.addEventListener('click', this.resetForm.bind(this));
        this.tryAgainBtn.addEventListener('click', this.resetForm.bind(this));
        this.languageSelect.addEventListener('change', this.changeLanguage.bind(this));

        // Валидация URL в реальном времени
        this.originalUrlInput.addEventListener('input', this.validateUrl.bind(this));

        // Установка начального языка
        this.updateTexts();
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
            const response = await fetch('/api/shorten', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ originalUrl }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.showResult(data.data);
            } else {
                this.showError(data.error || t.genericError);
            }
        } catch (error) {
            console.error('Ошибка:', error);
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

        // Прокрутка к результату
        this.resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorDiv.style.display = 'block';
        this.resultDiv.style.display = 'none';

        // Прокрутка к ошибке
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

            // Визуальная обратная связь
            const originalText = this.copyBtn.textContent;
            this.copyBtn.textContent = t.copied;
            this.copyBtn.style.background = '#28a745';

            setTimeout(() => {
                this.copyBtn.textContent = originalText;
                this.copyBtn.style.background = '';
            }, 2000);

        } catch (error) {
            console.error('Ошибка копирования:', error);
            // Fallback для браузеров без поддержки Clipboard API
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
        this.shortenBtn.disabled = loading;

        if (loading) {
            this.btnText.style.display = 'none';
            this.btnLoading.style.display = 'inline';
        } else {
            this.btnText.style.display = 'inline';
            this.btnLoading.style.display = 'none';
        }
    }

    changeLanguage(event) {
        this.currentLanguage = event.target.value;
        this.updateTexts();
    }

    updateTexts() {
        const t = translations[this.currentLanguage];

        // Обновление заголовка и подзаголовка
        document.querySelector('h1').textContent = t.title;
        document.querySelector('header p').textContent = t.subtitle;

        // Обновление кнопок аутентификации
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        if (loginBtn) loginBtn.textContent = t.login;
        if (registerBtn) registerBtn.textContent = t.register;

        // Обновление формы
        document.querySelector('label[for="languageSelect"]').textContent = t.languageLabel;
        document.querySelector('label[for="originalUrl"]').textContent = t.enterUrlLabel;
        document.getElementById('originalUrl').placeholder = t.urlPlaceholder;
        document.querySelector('.btn-text').textContent = t.shortenBtn;
        document.querySelector('.btn-loading').textContent = t.shortening;

        // Обновление результатов
        const resultTitle = document.querySelector('#result h3');
        if (resultTitle) resultTitle.textContent = t.successTitle;

        const originalLabel = document.querySelector('.original-url strong');
        if (originalLabel) originalLabel.textContent = t.originalUrlLabel;

        const shortLabel = document.querySelector('.short-url strong');
        if (shortLabel) shortLabel.textContent = t.shortUrlLabel;

        document.getElementById('copyBtn').textContent = t.copyBtn;
        document.getElementById('goToBtn').textContent = t.goToBtn;
        document.getElementById('createNewBtn').textContent = t.createNewBtn;

        // Обновление ошибок
        const errorTitle = document.querySelector('#error h3');
        if (errorTitle) errorTitle.textContent = t.errorTitle;

        document.getElementById('tryAgainBtn').textContent = t.tryAgainBtn;

        // Обновление футера
        document.querySelector('footer p').innerHTML = t.footer;

        // Обновление атрибута lang в HTML
        document.documentElement.lang = this.currentLanguage;
    }
}

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
    new UrlShortener();
});

// Service Worker для PWA (опционально, для будущего развития)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // В будущем можно добавить service worker для оффлайн работы
        // navigator.serviceWorker.register('/sw.js');
    });
}
