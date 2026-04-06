// Admin History Tugas

let allAssignments = [];

// Load filter user dropdown
async function loadUserFilter() {
    try {
        const users = await supabaseFetch('users?select=id,username,role');
        const select = document.getElementById('filterUser');
        if (!select) return;
        
        select.innerHTML = '<option value="all">Semua User</option>';
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            if (user.role === 'user') {
                select.innerHTML += '<option value="' + user.id + '">' + user.username + '</option>';
            }
        }
        
        // Set default tanggal (7 hari terakhir)
        const today = new Date();
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);
        
        const startInput = document.getElementById('filterDateStart');
        const endInput = document.getElementById('filterDateEnd');
        if (startInput) startInput.value = weekAgo.toISOString().slice(0, 10);
        if (endInput) endInput.value = today.toISOString().slice(0, 10);
        
        await loadHistory();
    } catch (error) {
        console.error('Load user filter error:', error);
        if (typeof showToast === 'function') showToast('Gagal load user: ' + error.message, 'error');
    }
}

// Load history dengan filter
async function loadHistory() {
    const userId = document.getElementById('filterUser') ? document.getElementById('filterUser').value : 'all';
    const status = document.getElementById('filterStatus') ? document.getElementById('filterStatus').value : 'all';
    const dateStart = document.getElementById('filterDateStart') ? document.getElementById('filterDateStart').value : '';
    const dateEnd = document.getElementById('filterDateEnd') ? document.getElementById('filterDateEnd').value : '';
    
    const container = document.getElementById('historyTableBody');
    if (container) container.innerHTML = '<tr><td colspan="7">Loading...</td></tr>';
    
    try {
        let query = 'assignments?select=*,groups(*),captions(*)';
        let filters = [];
        
        if (userId !== 'all') {
            filters.push('user_id=eq.' + userId);
        }
        if (status !== 'all') {
            filters.push('status=eq.' + status);
        }
        if (dateStart) {
            filters.push('assigned_date=gte.' + dateStart);
        }
        if (dateEnd) {
            filters.push('assigned_date=lte.' + dateEnd);
        }
        
        if (filters.length > 0) {
            query += '&' + filters.join('&');
        }
        
        query += '&order=assigned_date.desc';
        
        const assignments = await supabaseFetch(query);
        
        if (!assignments || assignments.length === 0) {
            if (container) container.innerHTML = '<tr><td colspan="7">Tidak ada data tugas.</td></tr>';
            if (document.getElementById('historySummary')) {
                document.getElementById('historySummary').innerHTML = '📊 Total: 0 tugas | ✅ Selesai: 0 | ⏳ Belum: 0';
            }
            return;
        }
        
        // Ambil data users
        const userIds = [];
        for (let i = 0; i < assignments.length; i++) {
            if (!userIds.includes(assignments[i].user_id)) {
                userIds.push(assignments[i].user_id);
            }
        }
        
        let usersMap = {};
        if (userIds.length > 0) {
            const usersQuery = 'users?select=id,username&id=in.(' + userIds.join(',') + ')';
            const users = await supabaseFetch(usersQuery);
            for (let i = 0; i < users.length; i++) {
                usersMap[users[i].id] = users[i].username;
            }
        }
        
        // Hitung statistik
        const total = assignments.length;
        let done = 0;
        for (let i = 0; i < assignments.length; i++) {
            if (assignments[i].status === 'done') done++;
        }
        const pending = total - done;
        
        const summaryEl = document.getElementById('historySummary');
        if (summaryEl) {
            summaryEl.innerHTML = '📊 Total: ' + total + ' tugas | ✅ Selesai: ' + done + ' | ⏳ Belum: ' + pending;
        }
        
        // Tampilkan tabel
        let html = '';
        for (let i = 0; i < assignments.length; i++) {
            const task = assignments[i];
            const statusHtml = task.status === 'done' 
                ? '<span style="background-color: #28a745; color: white; padding: 3px 8px; border-radius: 5px;">✅ Selesai</span>'
                : '<span style="background-color: #ffc107; color: #333; padding: 3px 8px; border-radius: 5px;">⏳ Belum</span>';
            
            const completedDate = task.completed_at 
                ? new Date(task.completed_at).toLocaleDateString('id-ID') + ' ' + new Date(task.completed_at).toLocaleTimeString('id-ID')
                : '-';
            
            const username = usersMap[task.user_id] || 'User ID: ' + task.user_id;
            const groupLink = task.groups ? task.groups.link : '#';
            const groupName = task.groups ? (task.groups.link.substring(0, 40) + '...') : 'Unknown';
            const captionText = task.captions ? (task.captions.text.substring(0, 80) + (task.captions.text.length > 80 ? '...' : '')) : 'Unknown';
            
            html += '<tr>';
            html += '<td>' + task.id + '</td>';
            html += '<td>' + username + '</td>';
            html += '<td><a href="' + groupLink + '" target="_blank" style="color: #007bff;">' + groupName + '</a></td>';
            html += '<td style="max-width: 300px;">' + captionText + '</td>';
            html += '<td>' + statusHtml + '</td>';
            html += '<td>' + new Date(task.assigned_date).toLocaleDateString('id-ID') + '</td>';
            html += '<td>' + completedDate + '</td>';
            html += '</tr>';
        }
        
        if (container) container.innerHTML = html;
        
    } catch (error) {
        console.error('Load history error:', error);
        if (container) container.innerHTML = '<tr><td colspan="7">Error: ' + error.message + '</td></tr>';
        if (typeof showToast === 'function') showToast('Gagal load history: ' + error.message, 'error');
    }
}

// Reset filter
function resetHistoryFilter() {
    const userSelect = document.getElementById('filterUser');
    const statusSelect = document.getElementById('filterStatus');
    if (userSelect) userSelect.value = 'all';
    if (statusSelect) statusSelect.value = 'all';
    
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);
    
    const startInput = document.getElementById('filterDateStart');
    const endInput = document.getElementById('filterDateEnd');
    if (startInput) startInput.value = weekAgo.toISOString().slice(0, 10);
    if (endInput) endInput.value = today.toISOString().slice(0, 10);
    
    loadHistory();
}