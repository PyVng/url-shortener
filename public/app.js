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
            const response = await fetch('/api/shorten', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
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
document.addEventListener('DOMContentLoaded', () => {
    // Initialize URL shortener
    new UrlShortener();
});
