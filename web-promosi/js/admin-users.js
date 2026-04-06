// Admin Users Management

async function loadAllUsers() {
    try {
        const users = await supabaseFetch('users?select=id,username,role,created_at&order=id.asc');
        const container = document.getElementById('usersList');
        
        if (!container) return;
        
        if (!users || users.length === 0) {
            container.innerHTML = '<p>Belum ada user.</p>';
            return;
        }
        
        let html = '<table border="1" cellpadding="10" cellspacing="0" style="width:100%; border-collapse: collapse;">';
        html += '<tr style="background-color: #f2f2f2;"><th>ID</th><th>Username</th><th>Role</th><th>Dibuat Pada</th><th>Aksi</th></tr>';
        
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const roleBadge = user.role === 'admin' 
                ? '<span style="background-color: #dc3545; color: white; padding: 3px 8px; border-radius: 5px;"><i class="fas fa-crown"></i> Admin</span>'
                : '<span style="background-color: #28a745; color: white; padding: 3px 8px; border-radius: 5px;"><i class="fas fa-user"></i> Pekerja</span>';
            
            const createdDate = user.created_at 
                ? new Date(user.created_at).toLocaleDateString('id-ID')
                : '-';
            
            html += '<tr>';
            html += '<td>' + user.id + '</td>';
            html += '<td>' + escapeHtml(user.username) + '</td>';
            html += '<td>' + roleBadge + '</td>';
            html += '<td>' + createdDate + '</td>';
            html += '<td>';
            
            if (user.role === 'user') {
                html += '<button class="danger" onclick="deleteUser(' + user.id + ', \'' + escapeHtml(user.username) + '\')" style="background-color: #dc3545; margin-right: 5px;"><i class="fas fa-trash"></i> Hapus</button>';
                html += '<button onclick="resetUserPassword(' + user.id + ', \'' + escapeHtml(user.username) + '\')" style="background-color: #ffc107; color: #333;"><i class="fas fa-key"></i> Reset Password</button>';
            } else {
                html += '<span style="color: #999;"><i class="fas fa-shield-alt"></i> Tidak bisa dihapus</span>';
            }
            
            html += '</td>';
            html += '</tr>';
        }
        
        html += '</table>';
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Load users error:', error);
        const container = document.getElementById('usersList');
        if (container) container.innerHTML = '<p>Gagal load user: ' + error.message + '</p>';
        showToast('Gagal load user: ' + error.message, 'error');
    }
}

// Escape HTML untuk mencegah XSS
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

async function addUser() {
    const username = document.getElementById('newUsername').value;
    const password = document.getElementById('newPassword').value;
    const role = document.getElementById('newRole').value;
    
    if (!username) {
        showToast('Masukkan username', 'warning');
        return;
    }
    if (!password) {
        showToast('Masukkan password', 'warning');
        return;
    }
    if (password.length < 4) {
        showToast('Password minimal 4 karakter', 'warning');
        return;
    }
    if (username.length < 3) {
        showToast('Username minimal 3 karakter', 'warning');
        return;
    }
    
    // Validasi karakter khusus
    const validUsername = /^[a-zA-Z0-9_]+$/.test(username);
    if (!validUsername) {
        showToast('Username hanya boleh huruf, angka, dan underscore', 'warning');
        return;
    }
    
    try {
        // Cek apakah username sudah ada
        const existing = await supabaseFetch('users?select=id&username=eq.' + username);
        if (existing && existing.length > 0) {
            showToast('Username sudah digunakan!', 'error');
            return;
        }
        
        // Simpan user
        await supabaseFetch('users', {
            method: 'POST',
            body: JSON.stringify({
                username: username,
                password: password,
                role: role,
                created_at: new Date().toISOString()
            })
        });
        
        document.getElementById('newUsername').value = '';
        document.getElementById('newPassword').value = '';
        
        await loadAllUsers();
        showToast('✅ User ' + username + ' berhasil ditambahkan!', 'success');
        
    } catch (error) {
        console.error('Add user error:', error);
        showToast('❌ Gagal menambah user: ' + error.message, 'error');
    }
}

async function deleteUser(userId, username) {
    const confirmed = await confirmAction('Yakin hapus user "' + username + '"? Semua tugas dan progres user ini akan dihapus.');
    
    if (confirmed) {
        try {
            // Hapus assignments user
            await supabaseFetch('assignments?user_id=eq.' + userId, { method: 'DELETE' });
            
            // Hapus user_progress
            await supabaseFetch('user_progress?user_id=eq.' + userId, { method: 'DELETE' });
            
            // Hapus user
            await supabaseFetch('users?id=eq.' + userId, { method: 'DELETE' });
            
            await loadAllUsers();
            showToast('✅ User ' + username + ' berhasil dihapus!', 'success');
            
        } catch (error) {
            console.error('Delete user error:', error);
            showToast('❌ Gagal hapus user: ' + error.message, 'error');
        }
    }
}

async function resetUserPassword(userId, username) {
    const newPassword = prompt('Masukkan password baru untuk user "' + username + '":\n\nMinimal 4 karakter');
    
    if (!newPassword) {
        showToast('Reset password dibatalkan', 'info');
        return;
    }
    
    if (newPassword.length < 4) {
        showToast('Password minimal 4 karakter', 'warning');
        return;
    }
    
    try {
        await supabaseFetch('users?id=eq.' + userId, {
            method: 'PATCH',
            body: JSON.stringify({ password: newPassword })
        });
        
        showToast('✅ Password user ' + username + ' berhasil direset!', 'success');
        
    } catch (error) {
        console.error('Reset password error:', error);
        showToast('❌ Gagal reset password: ' + error.message, 'error');
    }
}