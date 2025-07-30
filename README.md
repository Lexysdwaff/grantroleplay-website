# Grant Roleplay Website

Bu proje, Grant Roleplay RAGEMP sunucusu için geliştirilmiş bir web sitesidir. Kullanıcı kayıt/giriş sistemi, dashboard ve SQL veritabanı entegrasyonu içerir.

## Özellikler

- ✅ Kullanıcı kayıt ve giriş sistemi
- ✅ SQLite veritabanı entegrasyonu
- ✅ JWT token tabanlı kimlik doğrulama
- ✅ Şifre hashleme (bcrypt)
- ✅ Kullanıcı dashboard'u
- ✅ Karakter sistemi
- ✅ Responsive tasarım
- ✅ Modern UI/UX

## Kurulum

### Gereksinimler

- Node.js (v14 veya üzeri)
- npm veya yarn

### Adımlar

1. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

2. **Sunucuyu başlatın:**
   ```bash
   npm start
   ```

3. **Geliştirme modunda çalıştırın:**
   ```bash
   npm run dev
   ```

4. **Tarayıcıda açın:**
   ```
   http://localhost:3000
   ```

## API Endpoints

### Kullanıcı İşlemleri

- `POST /api/register` - Kullanıcı kaydı
- `POST /api/login` - Kullanıcı girişi
- `GET /api/user/:id` - Kullanıcı bilgileri
- `GET /api/user/:id/characters` - Kullanıcı karakterleri

### Sunucu İşlemleri

- `GET /api/server/status` - Sunucu durumu

## Veritabanı Yapısı

### Users Tablosu
- `id` - Kullanıcı ID
- `username` - Kullanıcı adı (unique)
- `email` - E-posta (unique)
- `password` - Hashlenmiş şifre
- `discord_username` - Discord kullanıcı adı
- `steam_username` - Steam kullanıcı adı
- `created_at` - Kayıt tarihi
- `last_login` - Son giriş tarihi

### Characters Tablosu
- `id` - Karakter ID
- `user_id` - Kullanıcı ID (foreign key)
- `name` - Karakter adı
- `level` - Seviye
- `job` - Meslek
- `money` - Para
- `created_at` - Oluşturulma tarihi

## Güvenlik

- Şifreler bcrypt ile hashlenir
- JWT token kullanılır
- CORS koruması
- Input validasyonu
- SQL injection koruması

## Dosya Yapısı

```
grantroleplay.com/
├── server.js              # Backend server
├── package.json           # Node.js bağımlılıkları
├── api.js                 # Frontend API sınıfı
├── script.js              # Ana JavaScript dosyası
├── styles.css             # CSS stilleri
├── index.html             # Ana sayfa
├── login.html             # Giriş sayfası
├── register.html          # Kayıt sayfası
├── dashboard.html         # Kullanıcı dashboard'u
├── bagis.html            # Bağış sayfası
├── nasil-oynanir.html    # Nasıl oynanır sayfası
├── images/               # Resim dosyaları
└── database.sqlite       # SQLite veritabanı (otomatik oluşur)
```

## Kullanım

1. **Kayıt Ol:** Yeni kullanıcılar register.html sayfasından kayıt olabilir
2. **Giriş Yap:** Kayıtlı kullanıcılar login.html sayfasından giriş yapabilir
3. **Dashboard:** Giriş yapan kullanıcılar dashboard.html sayfasında bilgilerini görebilir
4. **Çıkış Yap:** Dashboard'dan veya header'dan çıkış yapılabilir

## Geliştirme

### Yeni özellik eklemek için:

1. Backend'de yeni endpoint'ler ekleyin (`server.js`)
2. Frontend'de API çağrıları ekleyin (`api.js`)
3. UI güncellemeleri yapın (HTML/CSS)

### Veritabanı değişiklikleri:

1. `server.js` dosyasında `createTables()` fonksiyonunu güncelleyin
2. Veritabanını yeniden oluşturmak için `database.sqlite` dosyasını silin

## Lisans

MIT License

## İletişim

Grant Roleplay - En iyi RAGEMP deneyimi 