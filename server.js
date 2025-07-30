const express = require('express');
const mysql = require('mysql2/promise');
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

// Aqua Database bağlantısı
const dbConfig = {
    host: '192.168.1.20',
    user: 'root',
    password: '',
    database: 'aqua',
    port: 3306
};

let db;

async function connectDB() {
    try {
        db = await mysql.createConnection(dbConfig);
        console.log('Aqua Database bağlantısı başarılı');
    } catch (error) {
        console.error('Database bağlantı hatası:', error);
    }
}

// JWT Token oluştur
function generateToken(user) {
    return jwt.sign(
        { id: user.idkey, username: user.login },
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

// Kayıt ol - Aqua database'e kaydet
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password, discord_username, steam_username } = req.body;

        // Gerekli alanları kontrol et
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Kullanıcı adı, email ve şifre gerekli' });
        }

        // Kullanıcı adı ve email benzersiz mi kontrol et
        const [existingUsers] = await db.execute(
            'SELECT idkey FROM accounts WHERE login = ? OR email = ?',
            [username, email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Bu kullanıcı adı veya email zaten kullanılıyor' });
        }

        // Şifreyi hash'le
        const hashedPassword = await bcrypt.hash(password, 10);

        // Aqua database'e kullanıcı ekle
        const [result] = await db.execute(
            `INSERT INTO accounts (login, email, password, socialclub, ip, character1, character2, character3, lastCharacter, lang) 
             VALUES (?, ?, ?, ?, ?, 0, 0, 0, -1, 'tr')`,
            [username, email, hashedPassword, discord_username || null, req.ip || '127.0.0.1']
        );

        // Token oluştur
        const token = generateToken({ idkey: result.insertId, login: username });

        res.json({
            success: true,
            message: 'Hesap başarıyla oluşturuldu!',
            token,
            user: {
                id: result.insertId,
                username: username,
                email: email,
                discord_username: discord_username,
                steam_username: steam_username
            }
        });

    } catch (error) {
        console.error('Kayıt hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Giriş yap - Aqua database'den kontrol et
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
        }

        // Kullanıcıyı Aqua database'den bul
        const [users] = await db.execute(
            'SELECT idkey, login, email, password, socialclub FROM accounts WHERE login = ?',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
        }

        const user = users[0];

        // Şifreyi kontrol et
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Geçersiz şifre' });
        }

        // Token oluştur
        const token = generateToken({ idkey: user.idkey, login: user.login });

        res.json({
            success: true,
            message: 'Giriş başarılı!',
            token,
            user: {
                id: user.idkey,
                username: user.login,
                email: user.email,
                discord_username: user.socialclub,
                steam_username: null
            }
        });

    } catch (error) {
        console.error('Giriş hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Kullanıcı bilgilerini getir
app.get('/api/user/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.params.id;

        const [users] = await db.execute(
            `SELECT idkey, login, email, socialclub, redbucks, mcoins, totalplayed, vipdate, lastCharacter, lang
             FROM accounts WHERE idkey = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        }

        const user = users[0];

        // Karakter bilgilerini de getir (eğer varsa)
        let character = null;
        if (user.lastCharacter > 0) {
            const [characters] = await db.execute(
                `SELECT * FROM characters WHERE id = ? AND account = ?`,
                [user.lastCharacter, user.idkey]
            );
            if (characters.length > 0) {
                character = characters[0];
            }
        }

        res.json({
            ...user,
            character_name: character ? character.name : user.login,
            level: character ? character.level : 1,
            job: character ? character.job : 'İşsiz',
            money: user.redbucks || 0
        });

    } catch (error) {
        console.error('Kullanıcı getirme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Kullanıcının karakterlerini getir
app.get('/api/user/:id/characters', authenticateToken, async (req, res) => {
    try {
        const userId = req.params.id;

        const [characters] = await db.execute(
            `SELECT * FROM characters WHERE account = ?`,
            [userId]
        );

        res.json(characters);

    } catch (error) {
        console.error('Karakter getirme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Sunucu durumu - Aqua database'den
app.get('/api/server/status', async (req, res) => {
    try {
        // Toplam kayıtlı kullanıcı sayısı
        const [totalUsers] = await db.execute('SELECT COUNT(*) as count FROM accounts');
        
        // Son 1 saatte giriş yapan kullanıcı sayısı (eğer last_login sütunu varsa)
        let onlineUsers = 0;
        try {
            const [onlineResult] = await db.execute('SELECT COUNT(*) as count FROM accounts WHERE last_login > DATE_SUB(NOW(), INTERVAL 1 HOUR)');
            onlineUsers = onlineResult[0].count;
        } catch (e) {
            // last_login sütunu yoksa total_users'ın %20'sini al
            onlineUsers = Math.floor(totalUsers[0].count * 0.2);
        }

        res.json({
            status: 'online',
            online_players: onlineUsers,
            total_players: totalUsers[0].count,
            max_players: 100,
            uptime: '24/7'
        });

    } catch (error) {
        console.error('Sunucu durumu hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Server başlat
app.listen(PORT, () => {
    console.log(`Server ${PORT} portunda çalışıyor`);
    console.log(`http://localhost:${PORT} adresinden erişebilirsiniz`);
    connectDB();
});

// Graceful shutdown
process.on('SIGINT', () => {
    if (db) {
        db.end();
        console.log('Database bağlantısı kapatıldı');
    }
    process.exit(0);
}); 