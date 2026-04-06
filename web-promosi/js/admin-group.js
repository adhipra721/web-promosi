// Kelola Grup

async function loadGroups() {
    try {
        const data = await supabaseFetch('groups?select=*&order=category.asc,id.asc');
        
        if (!data || data.length === 0) {
            document.getElementById('groupsList').innerHTML = '<p>Belum ada grup. Silakan tambah grup di atas.</p>';
            return;
        }
        
        let html = '<table border="1" cellpadding="10" cellspacing="0" style="width:100%; border-collapse: collapse;">';
        html += '<tr style="background-color: #f2f2f2;"><th>ID</th><th>Link Grup</th><th>Kategori</th><th>Aksi</th></tr>';
        
        for (let i = 0; i < data.length; i++) {
            const group = data[i];
            html += '<tr>';
            html += '<td>' + group.id + '</td>';
            html += '<td><a href="' + group.link + '" target="_blank" style="color: #007bff;">' + group.link.substring(0, 50) + '...</a></td>';
            html += '<td>' + group.category + '</td>';
            html += '<td><button class="danger" onclick="deleteGroup(' + group.id + ')"><i class="fas fa-trash"></i> Hapus</button></td>';
            html += '</tr>';
        }
        html += '</table>';
        
        document.getElementById('groupsList').innerHTML = html;
    } catch (e) {
        document.getElementById('groupsList').innerHTML = '<p>Gagal load grup: ' + e.message + '</p>';
    }
}

async function addGroup() {
    const link = document.getElementById('groupLink').value;
    const category = document.getElementById('groupCategory').value;
    
    if (!link) { 
        showToast('Masukkan link grup', 'warning');
        return; 
    }
    if (!category) { 
        showToast('Pilih kategori', 'warning');
        return; 
    }
    
    try {
        await supabaseFetch('groups', { 
            method: 'POST', 
            body: JSON.stringify({ link: link, category: category }) 
        });
        
        document.getElementById('groupLink').value = '';
        await loadGroups();
        showToast('Grup berhasil ditambahkan!', 'success');
    } catch (error) {
        console.error('Add group error:', error);
        showToast('Gagal menambah grup: ' + error.message, 'error');
    }
}

async function deleteGroup(id) {
    const confirmed = await confirmAction('Yakin hapus grup ini? Semua tugas yang terkait dengan grup ini juga akan terhapus.');
    
    if (confirmed) {
        try {
            const assignments = await supabaseFetch('assignments?group_id=eq.' + id + '&select=id');
            if (assignments && assignments.length > 0) {
                for (let i = 0; i < assignments.length; i++) {
                    await supabaseFetch('assignments?id=eq.' + assignments[i].id, { method: 'DELETE' });
                }
            }
            
            await supabaseFetch('groups?id=eq.' + id, { method: 'DELETE' });
            await loadGroups();
            showToast('Grup berhasil dihapus!', 'success');
        } catch (error) {
            console.error('Delete group error:', error);
            showToast('Gagal hapus grup: ' + error.message, 'error');
        }
    }
}