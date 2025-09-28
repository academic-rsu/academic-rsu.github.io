// Profile JavaScript

let currentUser = null;
let userData = {};

// Initialize profile page
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            await loadUserProfile();
            updateNavigation();
        } else {
            window.location.href = 'index.html';
        }
    });
});

// Load user profile data
async function loadUserProfile() {
    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        if (userDoc.exists) {
            userData = userDoc.data();
            updateProfileUI();
            await loadUserBadges();
            await loadQuestHistory();
            
            // Show admin panel if user is admin
            if (userData.isAdmin) {
                document.getElementById('adminPanel').style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
        showNotification('Error loading profile data', 'error');
    }
}

// Update profile UI
function updateProfileUI() {
    // Update profile header
    document.getElementById('profileName').textContent = userData.name || 'Anonymous';
    document.getElementById('profileEmail').textContent = userData.email || '';
    
    const level = calculateLevel(userData.points || 0);
    document.getElementById('profileLevel').textContent = level;
    document.getElementById('profilePoints').textContent = (userData.points || 0).toLocaleString();
    document.getElementById('profileBadges').textContent = (userData.badges || []).length;
    
    // Update form fields
    document.getElementById('editName').value = userData.name || '';
    document.getElementById('editStudentId').value = userData.studentId || '';
    document.getElementById('editMajor').value = userData.major || '';
    document.getElementById('editYear').value = userData.year || '';
}

// Load user badges
async function loadUserBadges() {
    const badgesShowcase = document.getElementById('userBadgesShowcase');
    
    if (!userData.badges || userData.badges.length === 0) {
        badgesShowcase.innerHTML = `
            <div class="no-badges">
                <i class="fas fa-trophy"></i>
                <p>Complete quests to earn badges!</p>
            </div>
        `;
        return;
    }
    
    try {
        const badgePromises = userData.badges.map(badgeId => 
            db.collection('badges').doc(badgeId).get()
        );
        
        const badgeDocs = await Promise.all(badgePromises);
        
        let badgesHTML = '';
        badgeDocs.forEach(doc => {
            if (doc.exists) {
                const badge = doc.data();
                badgesHTML += `
                    <div class="showcase-badge">
                        <img src="${badge.icon}" alt="${badge.name}" onerror="this.src='https://via.placeholder.com/60x60/667eea/white?text=🏆'">
                        <h4>${badge.name}</h4>
                        <p>${badge.description}</p>
                    </div>
                `;
            }
        });
        
        badgesShowcase.innerHTML = badgesHTML;
    } catch (error) {
        console.error('Error loading badges:', error);
        badgesShowcase.innerHTML = `
            <div class="no-badges">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading badges</p>
            </div>
        `;
    }
}

// Load quest history
async function loadQuestHistory() {
    const questHistory = document.getElementById('questHistory');
    
    if (!userData.completedQuests || userData.completedQuests.length === 0) {
        questHistory.innerHTML = `
            <div class="no-history">
                <i class="fas fa-clipboard-list"></i>
                <p>No completed quests yet!</p>
            </div>
        `;
        return;
    }
    
    try {
        const questPromises = userData.completedQuests.map(questId => 
            db.collection('quests').doc(questId).get()
        );
        
        const questDocs = await Promise.all(questPromises);
        
        let historyHTML = '';
        questDocs.forEach(doc => {
            if (doc.exists) {
                const quest = doc.data();
                historyHTML += `
                    <div class="history-item">
                        <div class="history-info">
                            <h4>${quest.title}</h4>
                            <p>Completed quest</p>
                        </div>
                        <div class="history-reward">
                            <i class="fas fa-coins"></i> +${quest.points} pts
                        </div>
                    </div>
                `;
            }
        });
        
        questHistory.innerHTML = historyHTML;
    } catch (error) {
        console.error('Error loading quest history:', error);
        questHistory.innerHTML = `
            <div class="no-history">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading quest history</p>
            </div>
        `;
    }
}

// Handle profile form submission
document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const updatedData = {
        name: document.getElementById('editName').value,
        studentId: document.getElementById('editStudentId').value,
        major: document.getElementById('editMajor').value,
        year: document.getElementById('editYear').value,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        // Update Firestore document
        await db.collection('users').doc(currentUser.uid).update(updatedData);
        
        // Update Firebase Auth display name
        await currentUser.updateProfile({
            displayName: updatedData.name
        });
        
        // Update local userData
        userData = { ...userData, ...updatedData };
        
        // Update UI
        updateProfileUI();
        
        showNotification('Profile updated successfully!', 'success');
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('Error updating profile: ' + error.message, 'error');
    }
});

// Update navigation
function updateNavigation() {
    const userGreeting = document.getElementById('userGreeting');
    userGreeting.textContent = `Welcome, ${currentUser.displayName || 'Student'}!`;
}