// Kelola Caption

async function loadCaptions() {
    try {
        const data = await supabaseFetch('captions?select=*&order=id.asc');
        
        if (!data || data.length === 0) {
            document.getElementById('captionsList').innerHTML = '<p>Belum ada caption. Silakan tambah caption di atas.</p>';
            return;
        }
        
        let html = '<table border="1" cellpadding="10" cellspacing="0" style="width:100%; border-collapse: collapse;">';
        html += '<tr style="background-color: #f2f2f2;"><th>ID</th><th>Teks Caption</th><th>Aksi</th></tr>';
        
        for (let i = 0; i < data.length; i++) {
            const cap = data[i];
            let previewText = cap.text;
            if (previewText.length > 100) {
                previewText = previewText.substring(0, 100) + '...';
            }
            const previewHtml = previewText.replace(/\n/g, '<br>');
            
            html += '<tr>';
            html += '<td>' + cap.id + '</td>';
            html += '<td>' + previewHtml + '</td>';
            html += '<td><button class="danger" onclick="deleteCaption(' + cap.id + ')"><i class="fas fa-trash"></i> Hapus</button></td>';
            html += '</tr>';
        }
        html += '</table>';
        
        document.getElementById('captionsList').innerHTML = html;
    } catch (e) {
        document.getElementById('captionsList').innerHTML = '<p>Gagal load caption: ' + e.message + '</p>';
    }
}

async function addCaption() {
    const text = document.getElementById('captionText').value;
    if (!text) { 
        showToast('Masukkan teks caption', 'warning');
        return; 
    }
    
    try {
        await supabaseFetch('captions', { 
            method: 'POST', 
            body: JSON.stringify({ text: text }) 
        });
        document.getElementById('captionText').value = '';
        await loadCaptions();
        showToast('Caption berhasil ditambahkan!', 'success');
    } catch (error) {
        showToast('Gagal menambah caption: ' + error.message, 'error');
    }
}

async function deleteCaption(id) {
    const confirmed = await confirmAction('Yakin hapus caption ini?');
    if (confirmed) {
        try {
            await supabaseFetch('captions?id=eq.' + id, { method: 'DELETE' });
            await loadCaptions();
            showToast('Caption berhasil dihapus', 'success');
        } catch (error) {
            showToast('Gagal hapus caption: ' + error.message, 'error');
        }
    }
}