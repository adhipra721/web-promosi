// Kelola Media & Upload Gambar (Multiple Foto per Kategori)

async function loadMedia() {
    try {
        const data = await supabaseFetch('media?select=*');
        
        // Kelompokkan berdasarkan kategori dan urutkan
        const grouped = {};
        for (let i = 0; i < data.length; i++) {
            const med = data[i];
            if (!grouped[med.category]) grouped[med.category] = [];
            grouped[med.category].push(med);
        }
        
        // Urutkan kategori berdasarkan alfabet
        const sortedCategories = Object.keys(grouped).sort((a, b) => a.localeCompare(b));
        
        let html = '';
        for (let c = 0; c < sortedCategories.length; c++) {
            const category = sortedCategories[c];
            const items = grouped[category];
            
            html += '<div class="card" style="margin-bottom: 20px;">';
            html += '<h4><i class="fas fa-folder"></i> Kategori: ' + category + '</h4>';
            html += '<div style="display: flex; flex-wrap: wrap; gap: 15px;">';
            
            for (let i = 0; i < items.length; i++) {
                const med = items[i];
                html += '<div style="border: 1px solid #ddd; border-radius: 10px; padding: 10px; text-align: center; width: 150px;">';
                html += '<img src="' + med.image_url + '" width="120" height="120" style="object-fit: cover; border-radius: 5px;" onerror="this.style.display=\'none\'">';
                html += '<br><button class="danger" onclick="deleteMedia(' + med.id + ')" style="margin-top: 5px; background-color: #dc3545; font-size: 12px;"><i class="fas fa-trash"></i> Hapus</button>';
                html += '</div>';
            }
            
            html += '</div></div>';
        }
        
        if (data.length === 0) {
            html = '<p>Belum ada media. Silakan upload gambar di atas.</p>';
        }
        
        document.getElementById('mediaList').innerHTML = html;
        
        // Update dropdown kategori untuk upload (urutkan alfabet)
        const categories = await supabaseFetch('categories?select=name&order=name.asc');
        const mediaCategorySelect = document.getElementById('mediaCategory');
        if (mediaCategorySelect && categories) {
            let options = '<option value="">Pilih Kategori</option>';
            for (let i = 0; i < categories.length; i++) {
                options += '<option value="' + categories[i].name + '">' + categories[i].name + '</option>';
            }
            mediaCategorySelect.innerHTML = options;
        }
    } catch (e) {
        document.getElementById('mediaList').innerHTML = '<p>Gagal load media: ' + e.message + '</p>';
    }
}

async function uploadFile(file, fileName) {
    const url = SUPABASE_URL + '/storage/v1/object/media/' + fileName;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
        },
        body: file
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error('HTTP ' + response.status + ': ' + errorText);
    }
    return SUPABASE_URL + '/storage/v1/object/public/media/' + fileName;
}

function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('imagePreview');
            if (preview) {
                preview.src = e.target.result;
                preview.style.display = 'block';
                preview.style.maxWidth = '200px';
                preview.style.marginTop = '10px';
                preview.style.border = '1px solid #ddd';
                preview.style.borderRadius = '5px';
            }
        };
        reader.readAsDataURL(file);
    }
}

async function uploadMedia() {
    const category = document.getElementById('mediaCategory').value;
    const file = document.getElementById('mediaFile').files[0];
    const statusDiv = document.getElementById('uploadStatus');
    
    if (!category) { 
        showToast('Pilih kategori dulu', 'warning');
        return; 
    }
    if (!file) { 
        showToast('Pilih file gambar dulu', 'warning');
        return; 
    }
    if (file.size > 5 * 1024 * 1024) { 
        showToast('Ukuran file maksimal 5MB', 'warning');
        return; 
    }
    
    statusDiv.innerHTML = 'Mengupload...';
    statusDiv.style.color = 'blue';
    
    try {
        const fileName = Date.now() + '_' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const imageUrl = await uploadFile(file, fileName);
        
        await supabaseFetch('media', {
            method: 'POST',
            body: JSON.stringify({ category: category, image_url: imageUrl })
        });
        
        statusDiv.innerHTML = '✅ Gambar berhasil diupload!';
        statusDiv.style.color = 'green';
        document.getElementById('mediaFile').value = '';
        document.getElementById('imagePreview').style.display = 'none';
        await loadMedia();
        
        setTimeout(function() { 
            if (statusDiv) statusDiv.innerHTML = ''; 
        }, 3000);
    } catch (error) {
        console.error('Upload error:', error);
        statusDiv.innerHTML = '❌ Upload gagal: ' + error.message;
        statusDiv.style.color = 'red';
    }
}

async function deleteMedia(id) {
    const confirmed = await confirmAction('Yakin hapus media ini?');
    if (confirmed) {
        try {
            await supabaseFetch('media?id=eq.' + id, { method: 'DELETE' });
            await loadMedia();
            showToast('✅ Media berhasil dihapus', 'success');
        } catch (error) {
            showToast('❌ Gagal hapus media: ' + error.message, 'error');
        }
    }
}