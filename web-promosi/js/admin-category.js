// Kelola Kategori

async function loadCategories() {
    try {
        const data = await supabaseFetch('categories?select=*&order=name.asc');
        
        if (!data || data.length === 0) {
            document.getElementById('categoriesList').innerHTML = '<p>Belum ada kategori. Silakan tambah kategori di atas.</p>';
            return;
        }
        
        let html = '<table border="1" cellpadding="10" cellspacing="0" style="width:100%; border-collapse: collapse;">';
        html += '<tr style="background-color: #f2f2f2;"><th>Nama Kategori</th><th>Aksi</th></tr>';
        
        for (let i = 0; i < data.length; i++) {
            const cat = data[i];
            html += '<tr>';
            html += '<td>' + cat.name + '</td>';
            html += '<td><button class="danger" onclick="deleteCategory(' + cat.id + ')"><i class="fas fa-trash"></i> Hapus</button></td>';
            html += '</tr>';
        }
        html += '</table>';
        
        document.getElementById('categoriesList').innerHTML = html;
        
        // Update dropdown kategori
        const categorySelect = document.getElementById('groupCategory');
        const mediaCategorySelect = document.getElementById('mediaCategory');
        
        if (categorySelect) {
            let options = '<option value="">Pilih Kategori</option>';
            for (let i = 0; i < data.length; i++) {
                options += '<option value="' + data[i].name + '">' + data[i].name + '</option>';
            }
            categorySelect.innerHTML = options;
        }
        
        if (mediaCategorySelect) {
            let options = '<option value="">Pilih Kategori</option>';
            for (let i = 0; i < data.length; i++) {
                options += '<option value="' + data[i].name + '">' + data[i].name + '</option>';
            }
            mediaCategorySelect.innerHTML = options;
        }
        
    } catch (e) {
        document.getElementById('categoriesList').innerHTML = '<p>Gagal load kategori: ' + e.message + '</p>';
    }
}

async function addCategory() {
    const name = document.getElementById('newCategoryName').value;
    if (!name) { 
        showToast('Masukkan nama kategori', 'warning');
        return; 
    }
    
    try {
        await supabaseFetch('categories', { 
            method: 'POST', 
            body: JSON.stringify({ name: name }) 
        });
        document.getElementById('newCategoryName').value = '';
        await loadCategories();
        showToast('Kategori berhasil ditambahkan!', 'success');
    } catch (error) {
        showToast('Gagal menambah kategori: ' + error.message, 'error');
    }
}

async function deleteCategory(id) {
    const confirmed = await confirmAction('Yakin hapus kategori ini?');
    if (confirmed) {
        try {
            await supabaseFetch('categories?id=eq.' + id, { method: 'DELETE' });
            await loadCategories();
            showToast('Kategori berhasil dihapus', 'success');
        } catch (error) {
            showToast('Gagal hapus kategori: ' + error.message, 'error');
        }
    }
}