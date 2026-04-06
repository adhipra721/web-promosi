// Task Generator - Generate tugas otomatis dengan prioritas satu kategori habis dulu

async function generateDailyTasks() {
    console.log('🔄 Memulai generate tugas otomatis...');
    
    try {
        // 1. Ambil semua user (role = user)
        const allUsers = await supabaseFetch('users?select=id,username,role');
        const users = allUsers.filter(u => u.role === 'user');
        
        if (users.length === 0) {
            console.log('Tidak ada user ditemukan');
            if (typeof showToast === 'function') showToast('Tidak ada user', 'warning');
            return [];
        }
        
        const today = new Date().toISOString().slice(0, 10);
        
        // 2. Hapus tugas auto hari ini
        await supabaseFetch('assignments?assigned_date=eq.' + today + '&type=eq.auto', { method: 'DELETE' });
        
        // 3. Ambil semua grup
        const allGroups = await supabaseFetch('groups?select=*');
        
        if (!allGroups || allGroups.length === 0) {
            console.log('Tidak ada grup');
            return [];
        }
        
        // 4. Ambil semua caption
        const allCaptions = await supabaseFetch('captions?select=*');
        
        if (!allCaptions || allCaptions.length === 0) {
            console.log('Tidak ada caption');
            return [];
        }
        
        // 5. Ambil history progres per user
        const userProgress = {};
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            try {
                const progress = await supabaseFetch('user_progress?select=group_id&user_id=eq.' + user.id);
                userProgress[user.id] = progress ? progress.map(p => p.group_id) : [];
            } catch (e) {
                userProgress[user.id] = [];
            }
        }
        
        // 6. Buat pool grup yang belum pernah dikerjakan SIAPA PUN
        let globalAvailableGroups = [];
        for (let i = 0; i < allGroups.length; i++) {
            const group = allGroups[i];
            let isDoneByAnyone = false;
            for (let j = 0; j < users.length; j++) {
                const user = users[j];
                const progressList = userProgress[user.id] || [];
                if (progressList.includes(group.id)) {
                    isDoneByAnyone = true;
                    break;
                }
            }
            if (!isDoneByAnyone) {
                globalAvailableGroups.push(group);
            }
        }
        
        // 7. Reset jika semua grup sudah dikerjakan semua user
        if (globalAvailableGroups.length === 0) {
            console.log('Semua grup sudah dikerjakan. Reset semua history...');
            for (let i = 0; i < users.length; i++) {
                try {
                    await supabaseFetch('user_progress?user_id=eq.' + users[i].id, { method: 'DELETE' });
                } catch (e) {}
            }
            globalAvailableGroups = [...allGroups];
        }
        
        if (globalAvailableGroups.length === 0) {
            console.log('Tidak ada grup tersedia');
            return [];
        }
        
        // 8. URUTKAN GRUP BERDASARKAN KATEGORI (SATU KATEGORI TERKUMPUL)
        // Hitung jumlah per kategori
        const categoryCount = {};
        for (let i = 0; i < globalAvailableGroups.length; i++) {
            const cat = globalAvailableGroups[i].category;
            categoryCount[cat] = (categoryCount[cat] || 0) + 1;
        }
        
        console.log('📊 Jumlah grup per kategori:', categoryCount);
        
        // Urutkan kategori berdasarkan alfabet (atau bisa berdasarkan jumlah terbanyak)
        const sortedCategories = Object.keys(categoryCount).sort();
        
        // Buat ulang array grup yang sudah diurutkan per kategori
        let sortedGroups = [];
        for (let c = 0; c < sortedCategories.length; c++) {
            const category = sortedCategories[c];
            const groupsInCategory = globalAvailableGroups.filter(g => g.category === category);
            sortedGroups = sortedGroups.concat(groupsInCategory);
        }
        
        console.log('📋 Urutan grup (per kategori):');
        let lastCat = '';
        for (let i = 0; i < sortedGroups.length; i++) {
            if (sortedGroups[i].category !== lastCat) {
                console.log(`  🗂️ Kategori ${sortedGroups[i].category}:`);
                lastCat = sortedGroups[i].category;
            }
            console.log(`     - ${sortedGroups[i].link.substring(0, 50)}`);
        }
        
        // 9. Distribusi tugas dengan prioritas satu kategori HABIS DULU
        const tasksPerUser = 5;
        const assignments = [];
        let groupPointer = 0; // pointer untuk mengambil grup dari sortedGroups
        
        for (let u = 0; u < users.length; u++) {
            const user = users[u];
            const userTasks = [];
            
            // Ambil 5 grup berurutan dari sortedGroups (sudah urut per kategori)
            for (let i = 0; i < tasksPerUser; i++) {
                if (groupPointer >= sortedGroups.length) {
                    // Jika grup habis, reset dan mulai dari awal
                    groupPointer = 0;
                }
                
                const group = sortedGroups[groupPointer];
                if (group && group.id) {
                    userTasks.push(group);
                    groupPointer++;
                }
            }
            
            if (userTasks.length === 0) {
                console.log('Tidak ada grup untuk user ' + user.username);
                continue;
            }
            
            // Simpan tugas
            for (let i = 0; i < userTasks.length; i++) {
                const group = userTasks[i];
                const randomCaption = allCaptions[Math.floor(Math.random() * allCaptions.length)];
                
                assignments.push({
                    user_id: user.id,
                    group_id: group.id,
                    caption_id: randomCaption.id,
                    type: 'auto',
                    status: 'pending',
                    assigned_date: today
                });
            }
            
            // Tampilkan log kategori yang didapat user
            const categorySummary = {};
            for (let i = 0; i < userTasks.length; i++) {
                const cat = userTasks[i].category;
                categorySummary[cat] = (categorySummary[cat] || 0) + 1;
            }
            
            console.log(`\n👤 User ${user.username} mendapat ${userTasks.length} tugas:`);
            for (const cat in categorySummary) {
                console.log(`   📁 ${cat}: ${categorySummary[cat]} grup`);
            }
        }
        
        // 10. Simpan ke database
        if (assignments.length > 0) {
            for (let i = 0; i < assignments.length; i++) {
                await supabaseFetch('assignments', {
                    method: 'POST',
                    body: JSON.stringify(assignments[i])
                });
            }
            console.log(`\n✅ Berhasil generate ${assignments.length} tugas otomatis`);
            if (typeof showToast === 'function') {
                showToast(`✅ Generate ${assignments.length} tugas berhasil!`, 'success');
            }
        } else {
            console.log('Tidak ada tugas yang digenerate');
        }
        
        return assignments;
        
    } catch (error) {
        console.error('Generate tasks error:', error);
        if (typeof showToast === 'function') {
            showToast('❌ Gagal generate tugas: ' + error.message, 'error');
        }
        return [];
    }
}

// Fungsi test
async function testGenerate() {
    console.log('Test generate dimulai...');
    const result = await generateDailyTasks();
    console.log('Hasil generate:', result ? result.length : 0, 'tugas');
    return result;
}

window.generateDailyTasks = generateDailyTasks;
window.testGenerate = testGenerate;

console.log('✅ Task generator siap. Ketik generateDailyTasks() untuk menjalankan.');