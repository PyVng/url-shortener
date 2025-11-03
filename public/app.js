// URL Shortener Frontend JavaScript with Authentication

// Initialize Supabase client (loaded via script tag)
const SUPABASE_URL = window.APP_CONFIG?.SUPABASE_URL || 'https://dkbvavfdjpamsmezfrrt.supabase.co';
const SUPABASE_ANON_KEY = window.APP_CONFIG?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrYnZhdmZkanBhbXNtZXpmcnJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNDc0MzEsImV4cCI6MjA3NzcyMzQzMX0.4NBBusEGQyfikpidc8QCoqhIjWs_7FoJCCNwjJ8C-cI';

// Wait for Supabase to be loaded
function initSupabase() {
    if (typeof supabase !== 'undefined') {
        window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true
            }
        });
        // Dispatch event to signal Supabase is ready
        window.dispatchEvent(new Event('supabaseReady'));
    }
}

// Listen for Supabase script load
window.addEventListener('supabaseLoaded', initSupabase);

// Also try to initialize immediately in case script is already loaded
initSupabase();

const translations = {
    ru: {
        title: "URL Shortener",
        subtitle: "Сократите длинные ссылки в короткие и удобные",
        languageLabel: "Язык:",
        login: "Войти",
        register: "Регистрация",
        logout: "Выйти",
        welcome: "Привет",
        password: "Пароль",
        name: "Имя",
        optional: "опционально",
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
        password: "Password",
        name: "Name",
        optional: "optional",
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
        password: "Contraseña",
        name: "Nombre",
        optional: "opcional",
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
        password: "Mot de passe",
        name: "Nom",
        optional: "optionnel",
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
        password: "Passwort",
        name: "Name",
        optional: "optional",
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
        password: "密码",
        name: "姓名",
        optional: "可选",
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
        password: "パスワード",
        name: "名前",
        optional: "任意",
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
        login: "تسجيل الدخول",
        register: "التسجيل",
        logout: "تسجيل الخروج",
        welcome: "مرحباً",
        password: "كلمة المرور",
        name: "الاسم",
        optional: "اختياري",
        authError: "خطأ في المصادقة",
        loginSuccess: "تم تسجيل الدخول بنجاح",
        registerSuccess: "تم التسجيل بنجاح",
        logoutSuccess: "تم تسجيل الخروج",
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
        login: "Entrar",
        register: "Registrar",
        logout: "Sair",
        welcome: "Bem-vindo",
        password: "Senha",
        name: "Nome",
        optional: "opcional",
        authError: "Erro de autenticação",
        loginSuccess: "Login realizado com sucesso",
        registerSuccess: "Registro realizado com sucesso",
        logoutSuccess: "Logout realizado",
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
        login: "Accedi",
        register: "Registrati",
        logout: "Esci",
        welcome: "Benvenuto",
        password: "Password",
        name: "Nome",
        optional: "opzionale",
        authError: "Errore di autenticazione",
        loginSuccess: "Accesso effettuato con successo",
        registerSuccess: "Registrazione effettuata con successo",
        logoutSuccess: "Disconnesso",
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
        login: "लॉग इन",
        register: "पंजीकरण",
        logout: "लॉग आउट",
        welcome: "स्वागत है",
        password: "पासवर्ड",
        name: "नाम",
        optional: "वैकल्पिक",
        authError: "प्रमाणीकरण त्रुटि",
        loginSuccess: "सफलतापूर्वक लॉग इन",
        registerSuccess: "पंजीकरण सफल",
        logoutSuccess: "लॉग आउट हो गया",
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
        login: "로그인",
        register: "등록",
        logout: "로그아웃",
        welcome: "환영합니다",
        password: "비밀번호",
        name: "이름",
        optional: "선택사항",
        authError: "인증 오류",
        loginSuccess: "로그인 성공",
        registerSuccess: "등록 성공",
        logoutSuccess: "로그아웃됨",
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
        login: "Giriş",
        register: "Kayıt",
        logout: "Çıkış",
        welcome: "Hoş geldiniz",
        password: "Şifre",
        name: "İsim",
        optional: "isteğe bağlı",
        authError: "Kimlik doğrulama hatası",
        loginSuccess: "Giriş başarılı",
        registerSuccess: "Kayıt başarılı",
        logoutSuccess: "Çıkış yapıldı",
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
        login: "Zaloguj się",
        register: "Zarejestruj się",
        logout: "Wyloguj się",
        welcome: "Witaj",
        password: "Hasło",
        name: "Imię",
        optional: "opcjonalne",
        authError: "Błąd uwierzytelniania",
        loginSuccess: "Zalogowano pomyślnie",
        registerSuccess: "Rejestracja zakończona sukcesem",
        logoutSuccess: "Wylogowano",
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
        login: "Inloggen",
        register: "Registreren",
        logout: "Uitloggen",
        welcome: "Welkom",
        password: "Wachtwoord",
        name: "Naam",
        optional: "optioneel",
        authError: "Authenticatie fout",
        loginSuccess: "Succesvol ingelogd",
        registerSuccess: "Registratie succesvol",
        logoutSuccess: "Uitgelogd",
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
        const languageSelect = document.getElementById('languageSelect');
        const documentLang = document.documentElement?.lang;
        this.currentLanguage = languageSelect?.value || documentLang || 'en';

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
                return;
            }

            if (session?.user) {
                console.log('✅ User authenticated:', session.user.email);
                this.setCurrentUser(session.user);
            } else {
                console.log('ℹ️ No active session');
                this.setCurrentUser(null);
            }

        } catch (error) {
            console.error('❌ Auth check failed:', error);
            this.setCurrentUser(null);
        }
    }

    async refreshSession(refreshToken) {
        // For now, we don't refresh sessions on the client side
        // The server should handle token validation and refresh
        return null;
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
        const t = translations[this.currentLanguage || 'en'];

        // Получаем доступные OAuth провайдеры
        let oauthProviders = [];
        try {
            const response = await fetch('/api/auth/providers');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    oauthProviders = data.data.providers;
                }
            }
        } catch (error) {
            console.error('Failed to load OAuth providers:', error);
        }

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
                    <button class="auth-tab active" data-tab="login">${t.login}</button>
                    <button class="auth-tab" data-tab="register">${t.register}</button>
                </div>

                ${false ? ` <!-- OAuth providers temporarily disabled -->
                <div class="oauth-section">
                    <div class="oauth-buttons">
                        ${oauthProviders.map(provider => `
                            <button class="oauth-btn oauth-${provider.name}" data-provider="${provider.name}">
                                <span class="oauth-icon">${provider.icon}</span>
                                ${provider.displayName}
                            </button>
                        `).join('')}
                    </div>
                    <div class="oauth-divider">
                        <span>or</span>
                    </div>
                </div>
                ` : ''}

                <div id="loginForm" class="auth-form active">
                    <h3>${t.login}</h3>
                    <form id="loginFormElement">
                        <div class="form-group">
                            <label for="loginEmail">Email:</label>
                            <input type="email" id="loginEmail" required>
                        </div>
                        <div class="form-group">
                            <label for="loginPassword">${t.password || 'Пароль'}:</label>
                            <input type="password" id="loginPassword" required>
                        </div>
                        <button type="submit" class="auth-submit-btn">${t.login}</button>
                    </form>
                </div>
                <div id="registerForm" class="auth-form">
                    <h3>${t.register}</h3>
                    <form id="registerFormElement">
                        <div class="form-group">
                            <label for="registerEmail">Email:</label>
                            <input type="email" id="registerEmail" required>
                        </div>
                        <div class="form-group">
                            <label for="registerPassword">${t.password || 'Пароль'}:</label>
                            <input type="password" id="registerPassword" required>
                        </div>
                        <div class="form-group">
                            <label for="registerName">${t.name || 'Имя'} (${t.optional || 'опционально'}):</label>
                            <input type="text" id="registerName">
                        </div>
                        <button type="submit" class="auth-submit-btn">${t.register}</button>
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

        // Dropdown menu items
        const myLinksLink = document.getElementById('myLinksLink');
        const profileLink = document.getElementById('profileLink');

        if (myLinksLink) {
            myLinksLink.onclick = (event) => {
                event.preventDefault();
                this.showMyLinks();
            };
        }
        if (profileLink) {
            profileLink.onclick = (event) => {
                event.preventDefault();
                this.showProfile();
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

        // OAuth buttons
        const oauthButtons = this.authModal.querySelectorAll('.oauth-btn');
        oauthButtons.forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleOAuthLogin(e);
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
                // Supabase automatically handles session storage
                // The auth state change listener will handle UI updates
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
                // Don't set current user yet - wait for email confirmation
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
            const { error } = await window.supabase.auth.signOut();

            if (error) {
                console.error('❌ Logout error:', error);
                this.showMessage('Ошибка выхода: ' + error.message, 'error');
                return;
            }

            console.log('✅ Logout successful');
            // Supabase automatically clears the session
            // The auth state change listener will handle UI updates
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

    async handleOAuthLogin(event) {
        const provider = event.target.dataset.provider || event.target.closest('.oauth-btn').dataset.provider;

        try {
            const response = await fetch(`/api/auth/oauth/${provider}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Перенаправляем на OAuth провайдера
                window.location.href = data.data.url;
            } else {
                this.showMessage(data.error || 'OAuth login failed', 'error');
            }
        } catch (error) {
            console.error('OAuth login error:', error);
            this.showMessage('Network error during OAuth login', 'error');
        }
    }

    showMyLinks() {
        // Navigate to user's links page
        window.location.href = '/my-links';
    }

    showProfile() {
        // Navigate to user profile page
        window.location.href = '/profile';
    }

    updateLanguage(language) {
        this.currentLanguage = language;
        if (this.authModal) {
            // Remove existing modal
            const modal = document.getElementById('authModal');
            if (modal) {
                modal.remove();
            }
            // Recreate modal with new language
            this.createAuthModal();
            // Re-setup event listeners for the new modal
            this.setupEventListeners();
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
        this.currentLanguage = this.languageSelect?.value || document.documentElement?.lang || 'en';

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
        if (this.languageSelect) {
            this.languageSelect.addEventListener('change', this.changeLanguage.bind(this));
        }

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

    changeLanguage(event) {
        this.currentLanguage = event.target.value;
        this.updateTexts();

        // Update language in AuthManager
        if (window.authManager) {
            window.authManager.updateLanguage(this.currentLanguage);
        }
    }

    updateTexts() {
        const t = translations[this.currentLanguage];

        // Обновление заголовка и подзаголовка (только если существуют)
        const titleElement = document.querySelector('h1');
        if (titleElement) titleElement.textContent = t.title;

        const subtitleElement = document.querySelector('header p');
        if (subtitleElement) subtitleElement.textContent = t.subtitle;

        // Обновление кнопок аутентификации
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        if (loginBtn) loginBtn.textContent = t.login;
        if (registerBtn) registerBtn.textContent = t.register;

        // Обновление формы (только если существуют)
        const languageLabel = document.querySelector('label[for="languageSelect"]');
        if (languageLabel) languageLabel.textContent = t.languageLabel;

        const originalUrlLabel = document.querySelector('label[for="originalUrl"]');
        if (originalUrlLabel) originalUrlLabel.textContent = t.enterUrlLabel;

        const originalUrlInput = document.getElementById('originalUrl');
        if (originalUrlInput) originalUrlInput.placeholder = t.urlPlaceholder;

        const btnText = document.querySelector('.btn-text');
        if (btnText) btnText.textContent = t.shortenBtn;

        const btnLoading = document.querySelector('.btn-loading');
        if (btnLoading) btnLoading.textContent = t.shortening;

        // Обновление результатов
        const resultTitle = document.querySelector('#result h3');
        if (resultTitle) resultTitle.textContent = t.successTitle;

        const originalLabel = document.querySelector('.original-url strong');
        if (originalLabel) originalLabel.textContent = t.originalUrlLabel;

        const shortLabel = document.querySelector('.short-url strong');
        if (shortLabel) shortLabel.textContent = t.shortUrlLabel;

        const copyBtn = document.getElementById('copyBtn');
        if (copyBtn) copyBtn.textContent = t.copyBtn;

        const goToBtn = document.getElementById('goToBtn');
        if (goToBtn) goToBtn.textContent = t.goToBtn;

        const createNewBtn = document.getElementById('createNewBtn');
        if (createNewBtn) createNewBtn.textContent = t.createNewBtn;

        // Обновление ошибок
        const errorTitle = document.querySelector('#error h3');
        if (errorTitle) errorTitle.textContent = t.errorTitle;

        const tryAgainBtn = document.getElementById('tryAgainBtn');
        if (tryAgainBtn) tryAgainBtn.textContent = t.tryAgainBtn;

        // Футер теперь управляется через components.js, не обновляем его здесь

        // Обновление атрибута lang в HTML
        document.documentElement.lang = this.currentLanguage;
    }
}

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    initCommonComponents('/', 'ru');

    // Инициализируем менеджеры
    window.authManager = new AuthManager();
    new UrlShortener();
});

// Service Worker для PWA (опционально, для будущего развития)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // В будущем можно добавить service worker для оффлайн работы
        // navigator.serviceWorker.register('/sw.js');
    });
}
