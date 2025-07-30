// Sunucu durumu kontrolü kaldırıldı

// Kayıtlı oyuncu sayısı fonksiyonu kaldırıldı

// Sayfa yüklendiğinde çalışacak kodlar
document.addEventListener('DOMContentLoaded', function() {
    // Kullanıcı ve karakter bilgilerini kontrol et
    const userData = sessionStorage.getItem('user');
    const charactersData = sessionStorage.getItem('characters');
    
    if (userData && charactersData) {
        const user = JSON.parse(userData);
        const characters = JSON.parse(charactersData);
        
        console.log('Kullanıcı bilgileri yüklendi:', user);
        console.log('Karakter bilgileri yüklendi:', characters);
        
        // Giriş butonunu güncelle
        updateAuthButtons(user);
        
        // Karakter bilgilerini göster
        showCharacterInfo(user, characters);
    } else {
        console.log('Kullanıcı veya karakter bilgileri bulunamadı');
        // Auth butonlarını güncelle (kullanıcı giriş yapmamış)
        updateAuthButtons(null);
    }
    
    // Hamburger menü işlevselliği
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('nav');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            menuToggle.classList.toggle('active');
            nav.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });
        
        // Menü açıkken sayfa kaydırmasını engelle
        document.body.addEventListener('click', function(e) {
            if (nav.classList.contains('active') && !e.target.closest('nav') && !e.target.closest('.menu-toggle')) {
                menuToggle.classList.remove('active');
                nav.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
        });
    }
    
    // Bağış formu gönderildiğinde
    const donationForm = document.getElementById('donationForm');
    if (donationForm) {
        donationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const amount = document.getElementById('amount').value;
            
            if (username && amount) {
                alert(`Teşekkürler ${username}! $${amount} tutarındaki bağışınız işleme alındı.`);
                donationForm.reset();
            }
        });
    }
    
    // Sayfa geçişlerinde animasyon
    const links = document.querySelectorAll('a:not([target="_blank"])');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href').startsWith('#')) return;
            
            e.preventDefault();
            const href = this.getAttribute('href');
            
            // Menü açıksa kapat
            if (nav.classList.contains('active')) {
                menuToggle.classList.remove('active');
                nav.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
            
            document.body.style.opacity = 0;
            
            setTimeout(function() {
                window.location.href = href;
            }, 300);
        });
    });
    
    // Sayfa yüklendiğinde fade-in animasyonu
    document.body.style.opacity = 0;
    setTimeout(function() {
        document.body.style.opacity = 1;
        document.body.style.transition = 'opacity 0.5s ease';
    }, 100);
});

// Scroll olayı için header stilini değiştirme
window.addEventListener('scroll', function() {
    const header = document.querySelector('header');
    
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Auth butonlarını güncelleme fonksiyonu
function updateAuthButtons(user) {
    const authButtons = document.querySelector('.auth-buttons');
    const nav = document.querySelector('nav ul');
    
    if (user) {
        // Kullanıcı giriş yapmış
        authButtons.innerHTML = `
            <div class="user-info">
                <span>Hoş geldin, ${user.username}</span>
                <button onclick="logout()" class="login-btn" style="background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%);">
                    <i class="fas fa-sign-out-alt"></i>
                    <span>Çıkış Yap</span>
                </button>
            </div>
        `;
        
        // Dashboard linkini navigation'a ekle
        if (nav && !nav.querySelector('li a[href="dashboard.html"]')) {
            const dashboardLi = document.createElement('li');
            dashboardLi.innerHTML = '<a href="dashboard.html"><i class="fas fa-tachometer-alt"></i> Dashboard</a>';
            nav.appendChild(dashboardLi);
        }
    } else {
        // Kullanıcı giriş yapmamış
        authButtons.innerHTML = `
            <a href="login.html" class="login-btn">
                <i class="fas fa-sign-in-alt"></i>
                <span>Giriş Yap</span>
            </a>
            <a href="register.html" class="login-btn" style="background: linear-gradient(135deg, #6b00cf 0%, #8a2be2 100%);">
                <i class="fas fa-user-plus"></i>
                <span>Kayıt Ol</span>
            </a>
        `;
        
        // Dashboard linkini navigation'dan kaldır
        if (nav) {
            const dashboardLink = nav.querySelector('li a[href="dashboard.html"]');
            if (dashboardLink) {
                dashboardLink.parentElement.remove();
            }
        }
    }
}

// Karakter bilgilerini gösterme fonksiyonu
function showCharacterInfo(user, characters) {
    // Bu fonksiyon gelecekte karakter bilgilerini göstermek için kullanılabilir
    console.log('Karakter bilgileri:', characters);
}

// Çıkış yapma fonksiyonu
function logout() {
    // API'den çıkış yap
    if (typeof api !== 'undefined') {
        api.logout();
    }
    
    // Session storage'ı temizle
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('characters');
    
    // Auth butonlarını güncelle
    updateAuthButtons(null);
    
    // Ana sayfaya yönlendir
    window.location.href = 'index.html';
}