// RAGEMP Server Integration - Aqua Database
// Bu dosyayı RAGEMP sunucunuzda kullanabilirsiniz

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3010; // RAGEMP server port'u

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MySQL Database bağlantısı (Aqua database'iniz)
const dbConfig = {
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'aqua' // Aqua database adı
};

// Database bağlantısı
let db;

async function connectDB() {
    try {
        db = await mysql.createConnection(dbConfig);
        console.log('Aqua Database bağlantısı başarılı');
    } catch (error) {
        console.error('Database bağlantı hatası:', error);
    }
}

// Website'den gelen kullanıcı verilerini Aqua database'ine kaydet
app.post('/api/ragemp/register', async (req, res) => {
    try {
        const { username, email, password, discord_username, steam_username } = req.body;
        
        // Aqua database'ine kullanıcı ekle
        const [result] = await db.execute(
            `INSERT INTO accounts (login, email, password, socialclub, ip, character1, character2, character3, lastCharacter, lang) 
             VALUES (?, ?, ?, ?, ?, 0, 0, 0, -1, 'tr')`,
            [username, email, password, discord_username || null, req.ip || '127.0.0.1']
        );
        
        res.json({ 
            success: true, 
            message: 'Kullanıcı Aqua database\'ine eklendi',
            user_id: result.insertId 
        });
        
    } catch (error) {
        console.error('Aqua kayıt hatası:', error);
        res.status(500).json({ error: 'Database hatası' });
    }
});

// Aqua'dan kullanıcı bilgilerini getir
app.get('/api/ragemp/user/:username', async (req, res) => {
    try {
        const { username } = req.params;
        
        const [users] = await db.execute(
            `SELECT idkey, login, email, socialclub, redbucks, mcoins, totalplayed, vipdate, lastCharacter, lang
             FROM accounts WHERE login = ?`,
            [username]
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
        console.error('Aqua kullanıcı getirme hatası:', error);
        res.status(500).json({ error: 'Database hatası' });
    }
});

// Aqua sunucu durumu
app.get('/api/ragemp/status', async (req, res) => {
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
        console.error('Aqua durum hatası:', error);
        res.status(500).json({ error: 'Database hatası' });
    }
});

// Kullanıcının karakterlerini getir
app.get('/api/ragemp/user/:username/characters', async (req, res) => {
    try {
        const { username } = req.params;
        
        // Önce kullanıcıyı bul
        const [users] = await db.execute(
            `SELECT idkey FROM accounts WHERE login = ?`,
            [username]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        }
        
        const userId = users[0].idkey;
        
        // Karakterleri getir
        const [characters] = await db.execute(
            `SELECT * FROM characters WHERE account = ?`,
            [userId]
        );
        
        res.json(characters);
        
    } catch (error) {
        console.error('Aqua karakter getirme hatası:', error);
        res.status(500).json({ error: 'Database hatası' });
    }
});

// Server başlat
app.listen(PORT, () => {
    console.log(`Aqua Integration Server ${PORT} portunda çalışıyor`);
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