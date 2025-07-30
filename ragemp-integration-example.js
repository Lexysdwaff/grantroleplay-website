// RAGEMP Server Integration Example
// Bu dosya RAGEMP sunucunuzdan veri çekmek için örnek kodlar içerir

// 1. RAGEMP Sunucu API Endpoint Örneği
// Bu endpoint'i RAGEMP sunucunuzda oluşturabilirsiniz

/*
// RAGEMP Sunucu Tarafı (Lua/JavaScript)
// server-side/webserver.js

const express = require('express');
const app = express();
const cors = require('cors');

app.use(cors());
app.use(express.json());

// Kullanıcı verilerini döndüren endpoint
app.get('/api/user/:username', (req, res) => {
    const username = req.params.username;
    
    // RAGEMP veritabanından kullanıcı bilgilerini çek
    const userData = {
        username: username,
        email: getUserEmailFromDatabase(username),
        characters: getUserCharactersFromDatabase(username),
        lastLogin: getUserLastLoginFromDatabase(username),
        totalPlayTime: getUserPlayTimeFromDatabase(username),
        money: getUserMoneyFromDatabase(username),
        level: getUserLevelFromDatabase(username),
        job: getUserJobFromDatabase(username)
    };
    
    res.json(userData);
});

// Online oyuncu sayısını döndüren endpoint
app.get('/api/server/status', (req, res) => {
    const serverStatus = {
        online: true,
        playerCount: mp.players.length,
        maxPlayers: 100,
        uptime: getServerUptime(),
        serverName: "Grant Roleplay"
    };
    
    res.json(serverStatus);
});

// Kullanıcı giriş yaptığında çağrılacak endpoint
app.post('/api/user/login', (req, res) => {
    const { username, password } = req.body;
    
    // RAGEMP veritabanında kullanıcı doğrulama
    if (validateUser(username, password)) {
        // Giriş başarılı - kullanıcı verilerini güncelle
        updateUserLastLogin(username);
        
        const userData = getUserDataFromDatabase(username);
        res.json({ success: true, user: userData });
    } else {
        res.json({ success: false, message: "Kullanıcı adı veya şifre hatalı" });
    }
});

app.listen(3000, () => {
    console.log('RAGEMP Web API sunucusu çalışıyor: http://localhost:3000');
});
*/

// 2. Website Tarafı - RAGEMP Verilerini Çekme
// Bu kodları dashboard.html veya script.js'e ekleyebilirsiniz

class RAGEMPIntegration {
    constructor() {
        this.apiBaseUrl = 'http://your-ragemp-server.com:3000/api';
    }
    
    // Kullanıcı verilerini RAGEMP sunucusundan çek
    async fetchUserData(username) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/user/${username}`);
            const userData = await response.json();
            return userData;
        } catch (error) {
            console.error('RAGEMP sunucusundan veri çekilemedi:', error);
            return null;
        }
    }
    
    // Sunucu durumunu çek
    async fetchServerStatus() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/server/status`);
            const serverStatus = await response.json();
            return serverStatus;
        } catch (error) {
            console.error('Sunucu durumu çekilemedi:', error);
            return null;
        }
    }
    
    // Kullanıcı girişi yap
    async loginUser(username, password) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/user/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Giriş yapılamadı:', error);
            return { success: false, message: 'Bağlantı hatası' };
        }
    }
    
    // Dashboard'da RAGEMP verilerini güncelle
    async updateDashboardWithRAGEMPData() {
        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
        
        if (user.username) {
            // Kullanıcı verilerini çek
            const ragempUserData = await this.fetchUserData(user.username);
            
            if (ragempUserData) {
                // Dashboard'ı güncelle
                this.updateDashboardUI(ragempUserData);
            }
        }
        
        // Sunucu durumunu çek
        const serverStatus = await this.fetchServerStatus();
        
        if (serverStatus) {
            this.updateServerStatusUI(serverStatus);
        }
    }
    
    // Dashboard UI'ını güncelle
    updateDashboardUI(userData) {
        // Karakter bilgilerini güncelle
        if (userData.characters && userData.characters.length > 0) {
            const character = userData.characters[0];
            
            document.getElementById('characterName').textContent = character.name || '-';
            document.getElementById('characterLevel').textContent = character.level || '-';
            document.getElementById('characterJob').textContent = character.job || '-';
            document.getElementById('characterMoney').textContent = character.money ? `${character.money.toLocaleString()}₺` : '-';
        }
        
        // Kullanıcı profil bilgilerini güncelle
        if (userData.email) {
            document.getElementById('profileEmail').textContent = userData.email;
        }
        
        if (userData.lastLogin) {
            const loginDate = new Date(userData.lastLogin);
            document.getElementById('loginTime').textContent = loginDate.toLocaleString('tr-TR');
        }
    }
    
    // Sunucu durumu UI'ını güncelle
    updateServerStatusUI(serverStatus) {
        if (serverStatus.playerCount !== undefined) {
            document.getElementById('onlinePlayers').textContent = serverStatus.playerCount;
        }
        
        // Sunucu durumu göstergesini güncelle
        const statusIndicator = document.querySelector('.status-indicator');
        if (statusIndicator) {
            if (serverStatus.online) {
                statusIndicator.classList.add('online');
                statusIndicator.classList.remove('offline');
            } else {
                statusIndicator.classList.add('offline');
                statusIndicator.classList.remove('online');
            }
        }
    }
}

// 3. Dashboard'da RAGEMP Entegrasyonunu Kullanma
// Bu kodu dashboard.html'deki script bölümüne ekleyebilirsiniz

/*
// RAGEMP entegrasyonunu başlat
const ragempIntegration = new RAGEMPIntegration();

// Dashboard yüklendiğinde RAGEMP verilerini çek
document.addEventListener('DOMContentLoaded', async function() {
    // Mevcut dashboard yükleme kodları...
    loadDashboardData();
    updateAuthButtons();
    
    // RAGEMP verilerini çek ve güncelle
    await ragempIntegration.updateDashboardWithRAGEMPData();
    
    // Her 30 saniyede bir verileri güncelle
    setInterval(async () => {
        await ragempIntegration.updateDashboardWithRAGEMPData();
    }, 30000);
});

// Verileri yenile butonuna RAGEMP entegrasyonu ekle
function refreshData() {
    loadDashboardData();
    ragempIntegration.updateDashboardWithRAGEMPData();
    alert('Veriler yenilendi!');
}
*/

// 4. RAGEMP Sunucu Tarafı Veritabanı Örnekleri
// Bu kodları RAGEMP sunucunuzda kullanabilirsiniz

/*
// MySQL veritabanı bağlantısı
const mysql = require('mysql');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'your_username',
    password: 'your_password',
    database: 'ragemp_database'
});

// Kullanıcı e-postasını veritabanından çek
function getUserEmailFromDatabase(username) {
    return new Promise((resolve, reject) => {
        connection.query(
            'SELECT email FROM users WHERE username = ?',
            [username],
            (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results[0]?.email || null);
                }
            }
        );
    });
}

// Kullanıcı karakterlerini veritabanından çek
function getUserCharactersFromDatabase(username) {
    return new Promise((resolve, reject) => {
        connection.query(
            'SELECT * FROM characters WHERE owner = ?',
            [username],
            (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            }
        );
    });
}

// Kullanıcı para miktarını veritabanından çek
function getUserMoneyFromDatabase(username) {
    return new Promise((resolve, reject) => {
        connection.query(
            'SELECT money FROM characters WHERE owner = ? LIMIT 1',
            [username],
            (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results[0]?.money || 0);
                }
            }
        );
    });
}
*/

// 5. Güvenlik Önerileri

/*
1. API Güvenliği:
   - JWT token kullanın
   - Rate limiting uygulayın
   - CORS ayarlarını doğru yapılandırın

2. Veritabanı Güvenliği:
   - SQL injection'a karşı prepared statements kullanın
   - Veritabanı bağlantısını şifreleyin
   - Düzenli yedekleme yapın

3. Sunucu Güvenliği:
   - HTTPS kullanın
   - Firewall ayarlarını yapılandırın
   - Düzenli güvenlik güncellemeleri yapın
*/

// 6. Kullanım Örneği

/*
// Dashboard'da RAGEMP verilerini kullanma
async function loadRAGEMPData() {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    
    if (user.username) {
        const ragempData = await ragempIntegration.fetchUserData(user.username);
        
        if (ragempData) {
            // Gerçek RAGEMP verilerini kullan
            document.getElementById('characterMoney').textContent = 
                `${ragempData.money.toLocaleString()}₺`;
            document.getElementById('characterLevel').textContent = 
                ragempData.level;
            document.getElementById('characterJob').textContent = 
                ragempData.job;
        }
    }
}
*/ 