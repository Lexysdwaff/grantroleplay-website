// API iletişim sınıfı
class API {
    constructor() {
        // Backend URL'ini dinamik olarak belirle
        const currentDomain = window.location.origin;
        const isLocalhost = currentDomain.includes('localhost') || currentDomain.includes('127.0.0.1');
        
        if (isLocalhost) {
            // Local development için
            this.baseURL = 'http://localhost:3000/api';
        } else {
            // Hosting için - Railway backend URL'i
            this.baseURL = 'https://grantroleplay-website-production.up.railway.app/api';
        }
        
        this.token = localStorage.getItem('token');
    }

    // Token'ı güncelle
    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    // Token'ı temizle
    clearToken() {
        this.token = null;
        localStorage.removeItem('token');
    }

    // API isteği gönder
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Token varsa ekle
        if (this.token) {
            config.headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Bir hata oluştu');
            }

            return data;
        } catch (error) {
            console.error('API Hatası:', error);
            throw error;
        }
    }

    // Kayıt ol
    async register(userData) {
        return await this.request('/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    // Giriş yap
    async login(credentials) {
        const data = await this.request('/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
        
        if (data.token) {
            this.setToken(data.token);
        }
        
        return data;
    }

    // Kullanıcı bilgilerini getir
    async getUserInfo(userId) {
        return await this.request(`/user/${userId}`);
    }

    // Kullanıcının karakterlerini getir
    async getUserCharacters(userId) {
        return await this.request(`/user/${userId}/characters`);
    }

    // Sunucu durumunu getir
    async getServerStatus() {
        return await this.request('/server/status');
    }

    // Çıkış yap
    logout() {
        this.clearToken();
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('characters');
    }

    // RAGEMP sunucu durumunu getir
    async getRagempStatus() {
        return await this.request('/ragemp/status');
    }

    // RAGEMP'den kullanıcı bilgilerini getir
    async getRagempUser(username) {
        return await this.request(`/ragemp/user/${username}`);
    }

    // RAGEMP'e kullanıcı kaydet
    async registerToRagemp(userData) {
        return await this.request('/ragemp/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    // RAGEMP server'a direkt bağlan
    async ragempRequest(endpoint, options = {}) {
        const ragempURL = 'http://127.0.0.1:3010/api';
        const url = `${ragempURL}${endpoint}`;
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'RAGEMP server hatası');
            }

            return data;
        } catch (error) {
            console.error('RAGEMP API Hatası:', error);
            throw error;
        }
    }

    // RAGEMP server durumunu getir (direkt bağlantı)
    async getRagempStatusDirect() {
        return await this.ragempRequest('/ragemp/status');
    }

    // RAGEMP'den kullanıcı bilgilerini getir (direkt bağlantı)
    async getRagempUserDirect(username) {
        return await this.ragempRequest(`/ragemp/user/${username}`);
    }

    // RAGEMP'e kullanıcı kaydet (direkt bağlantı)
    async registerToRagempDirect(userData) {
        return await this.ragempRequest('/ragemp/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    // Aqua'dan kullanıcının karakterlerini getir (direkt bağlantı)
    async getRagempCharactersDirect(username) {
        return await this.ragempRequest(`/ragemp/user/${username}/characters`);
    }

    // Token geçerli mi kontrol et
    isAuthenticated() {
        return !!this.token;
    }
}

// Global API instance
const api = new API(); 