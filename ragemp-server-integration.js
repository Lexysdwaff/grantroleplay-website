// RAGEMP Server Integration
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

// MySQL Database bağlantısı (RAGEMP database'iniz)
const dbConfig = {
    host: 'localhost',
    user: 'ragemp_user',
    password: 'your_password',
    database: 'ragemp_database'
};

// Database bağlantısı
let db;

async function connectDB() {
    try {
        db = await mysql.createConnection(dbConfig);
        console.log('RAGEMP Database bağlantısı başarılı');
    } catch (error) {
        console.error('Database bağlantı hatası:', error);
    }
}

// Website'den gelen kullanıcı verilerini RAGEMP database'ine kaydet
app.post('/api/ragemp/register', async (req, res) => {
    try {
        const { username, email, discord_username, steam_username } = req.body;
        
        // RAGEMP database'ine kullanıcı ekle
        const [result] = await db.execute(
            `INSERT INTO users (username, email, discord_username, steam_username, created_at) 
             VALUES (?, ?, ?, ?, NOW())`,
            [username, email, discord_username, steam_username]
        );
        
        // Karakter oluştur
        await db.execute(
            `INSERT INTO characters (user_id, name, level, job, money) 
             VALUES (?, ?, 1, 'İşsiz', 1000)`,
            [result.insertId, username]
        );
        
        res.json({ 
            success: true, 
            message: 'Kullanıcı RAGEMP database\'ine eklendi',
            user_id: result.insertId 
        });
        
    } catch (error) {
        console.error('RAGEMP kayıt hatası:', error);
        res.status(500).json({ error: 'Database hatası' });
    }
});

// RAGEMP'den kullanıcı verilerini getir
app.get('/api/ragemp/user/:username', async (req, res) => {
    try {
        const { username } = req.params;
        
        const [users] = await db.execute(
            `SELECT u.*, c.name as character_name, c.level, c.job, c.money 
             FROM users u 
             LEFT JOIN characters c ON u.id = c.user_id 
             WHERE u.username = ?`,
            [username]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        }
        
        res.json(users[0]);
        
    } catch (error) {
        console.error('RAGEMP kullanıcı getirme hatası:', error);
        res.status(500).json({ error: 'Database hatası' });
    }
});

// RAGEMP sunucu durumu
app.get('/api/ragemp/status', async (req, res) => {
    try {
        // RAGEMP sunucu durumunu al
        const [players] = await db.execute('SELECT COUNT(*) as count FROM users WHERE last_login > DATE_SUB(NOW(), INTERVAL 1 HOUR)');
        
        res.json({
            status: 'online',
            online_players: players[0].count,
            max_players: 100,
            uptime: '24/7'
        });
        
    } catch (error) {
        console.error('RAGEMP durum hatası:', error);
        res.status(500).json({ error: 'Database hatası' });
    }
});

// Server başlat
app.listen(PORT, () => {
    console.log(`RAGEMP Integration Server ${PORT} portunda çalışıyor`);
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