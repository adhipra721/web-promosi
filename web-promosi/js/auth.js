// Login, Logout, Session - Dengan Keamanan Dasar

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showToast('Masukkan username dan password', 'warning');
        return;
    }
    
    try {
        // Ambil user berdasarkan username
        const users = await supabaseFetch('users?select=id,username,password,role&username=eq.' + username);
        
        if (!users || users.length === 0) {
            showToast('Username atau password salah', 'error');
            return;
        }
        
        const user = users[0];
        
        // Bandingkan password
        if (user.password !== password) {
            showToast('Username atau password salah', 'error');
            return;
        }
        
        // Simpan session dengan token sederhana
        const sessionToken = btoa(user.id + ':' + Date.now() + ':' + user.username);
        
        currentUser = {
            id: user.id,
            username: user.username,
            role: user.role,
            token: sessionToken
        };
        
        localStorage.setItem('user', JSON.stringify(currentUser));
        localStorage.setItem('sessionToken', sessionToken);
        
        showToast('✅ Login berhasil! Selamat datang, ' + username, 'success');
        
        setTimeout(() => {
            if (currentUser.role === 'admin') {
                window.location.href = 'pages/admin-dashboard.html';
            } else {
                window.location.href = 'pages/user-dashboard.html';
            }
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('sessionToken');
    showToast('✅ Anda telah logout', 'success');
    setTimeout(() => {
        window.location.href = '../index.html';
    }, 500);
}

function checkSession() {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('sessionToken');
    
    if (!savedUser || !savedToken) {
        if (window.location.pathname.includes('dashboard') || window.location.pathname.includes('admin')) {
            window.location.href = '../index.html';
        }
        return null;
    }
    
    try {
        currentUser = JSON.parse(savedUser);
        
        // Validasi token sederhana
        if (currentUser.token !== savedToken) {
            localStorage.removeItem('user');
            localStorage.removeItem('sessionToken');
            if (window.location.pathname.includes('dashboard')) {
                window.location.href = '../index.html';
            }
            return null;
        }
        
        return currentUser;
    } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('sessionToken');
        return null;
    }
}

// Proteksi halaman admin
function protectAdminPage() {
    const user = checkSession();
    if (!user || user.role !== 'admin') {
        window.location.href = '../index.html';
        return false;
    }
    return true;
}

// Proteksi halaman user
function protectUserPage() {
    const user = checkSession();
    if (!user || user.role !== 'user') {
        window.location.href = '../index.html';
        return false;
    }
    return true;
}