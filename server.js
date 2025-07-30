const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'grantroleplay-secret-key-2024';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname)));

// Database setup
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Veritabanı bağlantı hatası:', err);
    } else {
        console.log('SQLite veritabanına başarıyla bağlandı');
        createTables();
    }
});

// Tabloları oluştur
function createTables() {
    db.serialize(() => {
        // Kullanıcılar tablosu
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            discord_username TEXT,
            steam_username TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME
        )`);

        // Karakterler tablosu
        db.run(`CREATE TABLE IF NOT EXISTS characters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            name TEXT NOT NULL,
            level INTEGER DEFAULT 1,
            job TEXT DEFAULT 'İşsiz',
            money INTEGER DEFAULT 1000,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`);

        console.log('Veritabanı tabloları oluşturuldu');
    });
}

// JWT Token oluştur
function generateToken(user) {
    return jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
}

// Token doğrula
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token gerekli' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Geçersiz token' });
        }
        req.user = user;
        next();
    });
}

// Routes

// Ana sayfa
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Kayıt ol
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password, discord_username, steam_username } = req.body;

        // Validasyon
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Kullanıcı adı, email ve şifre gerekli' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Şifre en az 6 karakter olmalı' });
        }

        // Şifreyi hashle
        const hashedPassword = await bcrypt.hash(password, 10);

        // Kullanıcıyı veritabanına ekle
        db.run(
            `INSERT INTO users (username, email, password, discord_username, steam_username) 
             VALUES (?, ?, ?, ?, ?)`,
            [username, email, hashedPassword, discord_username || null, steam_username || null],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        if (err.message.includes('username')) {
                            return res.status(400).json({ error: 'Bu kullanıcı adı zaten kullanılıyor' });
                        } else if (err.message.includes('email')) {
                            return res.status(400).json({ error: 'Bu email adresi zaten kullanılıyor' });
                        }
                    }
                    return res.status(500).json({ error: 'Kayıt hatası: ' + err.message });
                }

                const userId = this.lastID;

                // Varsayılan karakter oluştur
                db.run(
                    `INSERT INTO characters (user_id, name, level, job, money) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [userId, username, 1, 'İşsiz', 1000],
                    function(err) {
                        if (err) {
                            console.error('Karakter oluşturma hatası:', err);
                        }
                    }
                );

                // Token oluştur
                const token = generateToken({ id: userId, username });

                res.json({
                    success: true,
                    message: 'Kayıt başarılı!',
                    token,
                    user: {
                        id: userId,
                        username,
                        email,
                        discord_username,
                        steam_username
                    }
                });
            }
        );
    } catch (error) {
        console.error('Kayıt hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Giriş yap
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
    }

    // Kullanıcıyı bul
    db.get(
        `SELECT * FROM users WHERE username = ? OR email = ?`,
        [username, username],
        async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Veritabanı hatası' });
            }

            if (!user) {
                return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
            }

            // Şifreyi kontrol et
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ error: 'Geçersiz şifre' });
            }

            // Son giriş zamanını güncelle
            db.run(
                `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?`,
                [user.id]
            );

            // Token oluştur
            const token = generateToken({ id: user.id, username: user.username });

            res.json({
                success: true,
                message: 'Giriş başarılı!',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    discord_username: user.discord_username,
                    steam_username: user.steam_username
                }
            });
        }
    );
});

// Kullanıcı bilgilerini getir
app.get('/api/user/:id', authenticateToken, (req, res) => {
    const userId = req.params.id;

    db.get(
        `SELECT id, username, email, discord_username, steam_username, created_at, last_login 
         FROM users WHERE id = ?`,
        [userId],
        (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Veritabanı hatası' });
            }

            if (!user) {
                return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
            }

            res.json(user);
        }
    );
});

// Kullanıcının karakterlerini getir
app.get('/api/user/:id/characters', authenticateToken, (req, res) => {
    const userId = req.params.id;

    db.all(
        `SELECT * FROM characters WHERE user_id = ?`,
        [userId],
        (err, characters) => {
            if (err) {
                return res.status(500).json({ error: 'Veritabanı hatası' });
            }

            res.json(characters);
        }
    );
});

// Sunucu durumu
app.get('/api/server/status', (req, res) => {
    // Demo sunucu durumu
    res.json({
        status: 'online',
        online_players: Math.floor(Math.random() * 50) + 10,
        max_players: 100,
        uptime: '24/7'
    });
});

// Server başlat
app.listen(PORT, () => {
    console.log(`Server ${PORT} portunda çalışıyor`);
    console.log(`http://localhost:${PORT} adresinden erişebilirsiniz`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Veritabanı kapatma hatası:', err);
        } else {
            console.log('Veritabanı bağlantısı kapatıldı');
        }
        process.exit(0);
    });
}); 