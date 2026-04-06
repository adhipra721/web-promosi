// Fungsi untuk user (lihat tugas, download gambar, selesai)

async function showUserTasks() {
    const container = document.getElementById('userTasksContainer');
    if (!container) return;
    
    container.innerHTML = 'Loading...';
    const today = new Date().toISOString().slice(0, 10);
    
    try {
        const assignments = await supabaseFetch('assignments?select=*,groups(*),captions(*)&user_id=eq.' + currentUser.id + '&status=eq.pending&assigned_date=eq.' + today);
        
        if (!assignments || assignments.length === 0) {
            container.innerHTML = '<p>✨ Tidak ada tugas untuk hari ini. Silakan cek lagi besok!</p>';
            return;
        }
        
        container.innerHTML = '';
        
        for (let t = 0; t < assignments.length; t++) {
            const task = assignments[t];
            
            let images = [];
            try {
                const mediaData = await supabaseFetch('media?category=eq.' + task.groups.category + '&select=*');
                if (mediaData && mediaData.length > 0) {
                    images = mediaData;
                }
            } catch (e) {
                console.log('Gagal load media:', e);
            }
            
            const taskCard = document.createElement('div');
            taskCard.className = 'task-card';
            taskCard.style.border = '1px solid #ddd';
            taskCard.style.borderRadius = '10px';
            taskCard.style.padding = '15px';
            taskCard.style.marginBottom = '15px';
            taskCard.style.backgroundColor = '#f9f9f9';
            
            const captionText = task.captions.text;
            const captionHtml = captionText.replace(/\n/g, '<br>');
            
            let imagesHtml = '';
            if (images.length > 0) {
                imagesHtml = '<div style="margin-bottom: 10px;"><p><strong>🖼️ Media Promosi (' + images.length + ' gambar):</strong></p><div style="display: flex; flex-wrap: wrap; gap: 10px;">';
                
                for (let i = 0; i < images.length; i++) {
                    const img = images[i];
                    imagesHtml += '<div style="text-align: center; border: 1px solid #ddd; border-radius: 8px; padding: 8px; width: 150px;">';
                    imagesHtml += '<img src="' + img.image_url + '" onerror="this.style.display=\'none\'" style="width: 120px; height: 120px; object-fit: cover; border-radius: 5px;">';
                    imagesHtml += '<br><button class="btn-download" data-url="' + img.image_url + '" style="margin-top: 5px; background-color: #28a745; font-size: 12px;">💾 Download</button>';
                    imagesHtml += '</div>';
                }
                
                imagesHtml += '</div></div>';
            } else {
                imagesHtml = '<p><em>⚠️ Belum ada media untuk kategori ini.</em></p>';
            }
            
            taskCard.innerHTML = imagesHtml + '<hr style="margin: 10px 0;"><p><strong>📢 Grup:</strong> <a href="' + task.groups.link + '" target="_blank" style="color: #007bff;">' + task.groups.link + '</a></p><div style="margin: 10px 0;"><p><strong>📝 Caption:</strong></p><div id="captionText_' + task.id + '" style="background: #f5f5f5; padding: 12px; border-radius: 8px; border-left: 4px solid #007bff; white-space: pre-wrap; font-family: inherit;">' + captionHtml + '</div></div><div style="margin-top: 10px;"><button class="btn-copy" data-taskid="' + task.id + '" style="margin-right: 10px; background-color: #007bff;">📋 Salin Caption</button><a href="' + task.groups.link + '" target="_blank"><button style="background-color: #17a2b8;">🔗 Buka Grup</button></a><button class="btn-complete" data-taskid="' + task.id + '" data-groupid="' + task.group_id + '" style="background-color: #28a745;">✅ Selesai</button></div>';
            
            container.appendChild(taskCard);
        }
        
        attachButtonEvents();
        
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = '<p>❌ Error: ' + error.message + '</p>';
    }
}

function attachButtonEvents() {
    const copyButtons = document.querySelectorAll('.btn-copy');
    for (let i = 0; i < copyButtons.length; i++) {
        const btn = copyButtons[i];
        btn.removeEventListener('click', handleCopyClick);
        btn.addEventListener('click', handleCopyClick);
    }
    
    const completeButtons = document.querySelectorAll('.btn-complete');
    for (let i = 0; i < completeButtons.length; i++) {
        const btn = completeButtons[i];
        btn.removeEventListener('click', handleCompleteClick);
        btn.addEventListener('click', handleCompleteClick);
    }
    
    const downloadButtons = document.querySelectorAll('.btn-download');
    for (let i = 0; i < downloadButtons.length; i++) {
        const btn = downloadButtons[i];
        btn.removeEventListener('click', handleDownloadClick);
        btn.addEventListener('click', handleDownloadClick);
    }
}

function handleCopyClick(event) {
    const btn = event.currentTarget;
    const taskId = btn.getAttribute('data-taskid');
    
    const captionDiv = document.getElementById('captionText_' + taskId);
    if (!captionDiv) {
        showToast('❌ Gagal menemukan caption', 'error');
        return;
    }
    
    let captionText = captionDiv.innerText;
    
    const textarea = document.createElement('textarea');
    textarea.value = captionText;
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    
    textarea.select();
    textarea.setSelectionRange(0, 99999);
    
    try {
        const success = document.execCommand('copy');
        if (success) {
            const lines = captionText.split('\n').length;
            const chars = captionText.length;
            let preview = captionText.substring(0, 80);
            if (captionText.length > 80) preview = preview + '...';
            
            showToast('✅ Caption berhasil disalin!\n\n📝 ' + preview + '\n\n📊 ' + lines + ' baris, ' + chars + ' karakter', 'success', 4000);
        } else {
            showToast('❌ Gagal menyalin caption', 'error');
        }
    } catch (err) {
        console.error('Copy error:', err);
        showToast('❌ Gagal menyalin caption: ' + err.message, 'error');
    }
    
    document.body.removeChild(textarea);
}

async function handleCompleteClick(event) {
    const btn = event.currentTarget;
    const taskId = btn.getAttribute('data-taskid');
    const groupId = btn.getAttribute('data-groupid');
    
    btn.disabled = true;
    btn.textContent = '⏳ Memproses...';
    btn.style.opacity = '0.5';
    
    try {
        await supabaseFetch('assignments?id=eq.' + taskId, {
            method: 'PATCH',
            body: JSON.stringify({ 
                status: 'done', 
                completed_at: new Date().toISOString() 
            })
        });
        
        await supabaseFetch('user_progress', {
            method: 'POST',
            body: JSON.stringify({
                user_id: currentUser.id,
                group_id: parseInt(groupId),
                completed_at: new Date().toISOString()
            })
        });
        
        showToast('✅ Tugas selesai! Terima kasih.', 'success');
        
        setTimeout(() => {
            showUserTasks();
        }, 1000);
        
    } catch (error) {
        console.error('Complete task error:', error);
        showToast('❌ Gagal menyelesaikan tugas: ' + error.message, 'error');
        btn.disabled = false;
        btn.textContent = '✅ Selesai';
        btn.style.opacity = '1';
    }
}

function handleDownloadClick(event) {
    const btn = event.currentTarget;
    const imageUrl = btn.getAttribute('data-url');
    
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'gambar_promosi_' + Date.now() + '.jpg';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('💾 Download gambar dimulai! Cek folder Downloads Anda.', 'success');
}

// Fungsi fallback untuk onclick di HTML
function copyTextWithFormat(taskId) {
    const captionDiv = document.getElementById('captionText_' + taskId);
    if (!captionDiv) {
        showToast('❌ Gagal menemukan caption', 'error');
        return;
    }
    
    let captionText = captionDiv.innerText;
    
    const textarea = document.createElement('textarea');
    textarea.value = captionText;
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    
    textarea.select();
    textarea.setSelectionRange(0, 99999);
    
    try {
        const success = document.execCommand('copy');
        if (success) {
            const lines = captionText.split('\n').length;
            const chars = captionText.length;
            let preview = captionText.substring(0, 80);
            if (captionText.length > 80) preview = preview + '...';
            
            showToast('✅ Caption berhasil disalin!\n\n📝 ' + preview + '\n\n📊 ' + lines + ' baris, ' + chars + ' karakter', 'success', 4000);
        } else {
            showToast('❌ Gagal menyalin caption', 'error');
        }
    } catch (err) {
        showToast('❌ Gagal menyalin caption: ' + err.message, 'error');
    }
    
    document.body.removeChild(textarea);
}

async function completeTask(taskId, groupId) {
    try {
        await supabaseFetch('assignments?id=eq.' + taskId, {
            method: 'PATCH',
            body: JSON.stringify({ 
                status: 'done', 
                completed_at: new Date().toISOString() 
            })
        });
        
        await supabaseFetch('user_progress', {
            method: 'POST',
            body: JSON.stringify({
                user_id: currentUser.id,
                group_id: parseInt(groupId),
                completed_at: new Date().toISOString()
            })
        });
        
        showToast('✅ Tugas selesai! Terima kasih.', 'success');
        showUserTasks();
    } catch (error) {
        showToast('❌ Gagal menyelesaikan tugas: ' + error.message, 'error');
    }
}

function downloadImage(imageUrl) {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'gambar_promosi_' + Date.now() + '.jpg';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('💾 Download gambar dimulai! Cek folder Downloads Anda.', 'success');
}