// Toast Notification System

let toastContainer = null;

function getToastContainer() {
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    return toastContainer;
}

function showToast(message, type = 'info', duration = 3000) {
    const container = getToastContainer();
    
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    
    let icon = '';
    if (type === 'success') icon = '✅';
    else if (type === 'error') icon = '❌';
    else if (type === 'warning') icon = '⚠️';
    else icon = 'ℹ️';
    
    toast.innerHTML = '<div class="toast-icon">' + icon + '</div>' +
        '<div class="toast-message">' + message + '</div>' +
        '<button class="toast-close" onclick="closeToast(this.parentElement)">×</button>' +
        '<div class="toast-progress" style="animation-duration: ' + duration + 'ms;"></div>';
    
    container.appendChild(toast);
    
    const timeout = setTimeout(function() {
        closeToast(toast);
    }, duration);
    
    toast.addEventListener('click', function(e) {
        if (e.target !== toast.querySelector('.toast-close')) {
            closeToast(toast);
            clearTimeout(timeout);
        }
    });
}

function closeToast(toast) {
    toast.classList.add('fade-out');
    setTimeout(function() {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 300);
}

function confirmAction(message) {
    return new Promise(function(resolve) {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10000;font-family:Arial,sans-serif;';
        
        const modal = document.createElement('div');
        modal.style.cssText = 'background:white;border-radius:12px;padding:25px;max-width:350px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.3);';
        
        modal.innerHTML = '<p style="margin-bottom:20px;font-size:16px;color:#333;">' + message + '</p>' +
            '<div><button id="confirmYes" style="background:#28a745;color:white;border:none;padding:8px 25px;margin-right:10px;border-radius:6px;cursor:pointer;font-size:14px;">Ya, Hapus</button>' +
            '<button id="confirmNo" style="background:#6c757d;color:white;border:none;padding:8px 25px;border-radius:6px;cursor:pointer;font-size:14px;">Batal</button></div>';
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        document.getElementById('confirmYes').onclick = function() {
            document.body.removeChild(overlay);
            resolve(true);
        };
        
        document.getElementById('confirmNo').onclick = function() {
            document.body.removeChild(overlay);
            resolve(false);
        };
        
        overlay.onclick = function(e) {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
                resolve(false);
            }
        };
    });
}