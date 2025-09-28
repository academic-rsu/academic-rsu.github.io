// Firebase Configuration
// Replace these with your actual Firebase config values
const firebaseConfig = {
    apiKey: "AIzaSyCyZXzS5e4XQ2sAQOSflfB3s_5oA2S8GTQ",
    authDomain: "academic-rsu.firebaseapp.com",
    projectId: "academic-rsu",
    storageBucket: "academic-rsu.firebasestorage.app",
    messagingSenderId: "645900661069",
    appId: "1:645900661069:web:3cdc49f58fd79467910704"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Auth state observer
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
            window.location.href = 'dashboard.html';
        }
    } else {
        // User is signed out
        if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
            window.location.href = 'index.html';
        }
    }
});

// Utility functions
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add CSS for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(notificationStyles);

// Calculate level from points
function calculateLevel(points) {
    return Math.floor(points / 100) + 1;
}

// Calculate XP for next level
function calculateXPForNextLevel(points) {
    const currentLevel = calculateLevel(points);
    const nextLevelPoints = currentLevel * 100;
    const currentLevelPoints = (currentLevel - 1) * 100;
    return {
        current: points - currentLevelPoints,
        needed: nextLevelPoints - currentLevelPoints,
        progress: ((points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100
    };
}

// Check if user is admin
function isAdmin(email) {
    return email && email.endsWith('@admin.com');
}

// Logout function
function logout() {
    auth.signOut().then(() => {
        showNotification('Logged out successfully!', 'success');
        window.location.href = 'index.html';
    }).catch((error) => {
        showNotification('Error logging out: ' + error.message, 'error');
    });
}
