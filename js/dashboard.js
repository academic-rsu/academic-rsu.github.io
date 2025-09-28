// Dashboard JavaScript

let currentUser = null;
let userStats = {
    points: 0,
    badges: [],
    completedQuests: [],
    level: 1
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            await loadUserData();
            await loadDashboardData();
            updateUI();
        } else {
            window.location.href = 'index.html';
        }
    });
});

// Load user data from Firestore
async function loadUserData() {
    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            userStats = {
                points: userData.points || 0,
                badges: userData.badges || [],
                completedQuests: userData.completedQuests || [],
                level: calculateLevel(userData.points || 0)
            };
            
            // Show admin panel if user is admin
            if (userData.isAdmin) {
                document.getElementById('adminPanel').style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        showNotification('Error loading user data', 'error');
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        // Load recent badges
        await loadRecentBadges();
        
        // Load active quests
        await loadActiveQuests();
        
        // Load user rank
        await loadUserRank();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Load recent badges
async function loadRecentBadges() {
    const recentBadgesContainer = document.getElementById('recentBadges');
    
    if (userStats.badges.length === 0) {
        recentBadgesContainer.innerHTML = `
            <div class="no-badges">
                <i class="fas fa-trophy"></i>
                <p>Complete quests to earn badges!</p>
            </div>
        `;
        return;
    }
    
    try {
        // Get the last 6 badges
        const recentBadgeIds = userStats.badges.slice(-6);
        const badgePromises = recentBadgeIds.map(badgeId => 
            db.collection('badges').doc(badgeId).get()
        );
        
        const badgeDocs = await Promise.all(badgePromises);
        
        let badgesHTML = '';
        badgeDocs.forEach(doc => {
            if (doc.exists) {
                const badge = doc.data();
                badgesHTML += `
                    <div class="badge-item">
                        <img src="${badge.icon}" alt="${badge.name}" onerror="this.src='https://via.placeholder.com/50x50/667eea/white?text=🏆'">
                        <h4>${badge.name}</h4>
                        <p>${badge.description}</p>
                    </div>
                `;
            }
        });
        
        recentBadgesContainer.innerHTML = badgesHTML || `
            <div class="no-badges">
                <i class="fas fa-trophy"></i>
                <p>Complete quests to earn badges!</p>
            </div>
        `;
    } catch (error) {
        console.error('Error loading recent badges:', error);
        recentBadgesContainer.innerHTML = `
            <div class="no-badges">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading badges</p>
            </div>
        `;
    }
}

// Load active quests
async function loadActiveQuests() {
    const activeQuestsContainer = document.getElementById('activeQuests');
    
    try {
        const questsSnapshot = await db.collection('quests').limit(3).get();
        
        if (questsSnapshot.empty) {
            activeQuestsContainer.innerHTML = `
                <div class="no-quests">
                    <i class="fas fa-compass"></i>
                    <p>No active quests. Check the Quests page!</p>
                </div>
            `;
            return;
        }
        
        let questsHTML = '';
        questsSnapshot.forEach(doc => {
            const quest = doc.data();
            const isCompleted = userStats.completedQuests.includes(doc.id);
            
            if (!isCompleted) {
                questsHTML += `
                    <div class="quest-item">
                        <div class="quest-info">
                            <h4>${quest.title}</h4>
                            <p>${quest.description.substring(0, 100)}...</p>
                        </div>
                        <div class="quest-reward">
                            <span><i class="fas fa-coins"></i> ${quest.points} pts</span>
                        </div>
                    </div>
                `;
            }
        });
        
        activeQuestsContainer.innerHTML = questsHTML || `
            <div class="no-quests">
                <i class="fas fa-check-circle"></i>
                <p>All quests completed! Great job!</p>
            </div>
        `;
    } catch (error) {
        console.error('Error loading active quests:', error);
        activeQuestsContainer.innerHTML = `
            <div class="no-quests">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading quests</p>
            </div>
        `;
    }
}

// Load user rank
async function loadUserRank() {
    try {
        const usersSnapshot = await db.collection('users')
            .where('points', '>', userStats.points)
            .get();
        
        const rank = usersSnapshot.size + 1;
        document.getElementById('userRank').textContent = `#${rank}`;
    } catch (error) {
        console.error('Error loading user rank:', error);
        document.getElementById('userRank').textContent = '#-';
    }
}

// Update UI with user data
function updateUI() {
    // Update greeting
    const userGreeting = document.getElementById('userGreeting');
    userGreeting.textContent = `Welcome, ${currentUser.displayName || 'Student'}!`;
    
    // Update stats
    document.getElementById('userLevel').textContent = userStats.level;
    document.getElementById('userPoints').textContent = userStats.points.toLocaleString();
    document.getElementById('userBadges').textContent = userStats.badges.length;
    
    // Update progress bar
    const xpInfo = calculateXPForNextLevel(userStats.points);
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    progressFill.style.width = `${xpInfo.progress}%`;
    progressText.textContent = `${xpInfo.current} / ${xpInfo.needed} XP to next level`;
}

// Add some CSS for quest items
const questItemStyles = document.createElement('style');
questItemStyles.textContent = `
    .quest-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 10px;
        margin-bottom: 10px;
        transition: all 0.3s ease;
    }
    
    .quest-item:hover {
        background: #e9ecef;
        transform: translateX(5px);
    }
    
    .quest-info h4 {
        margin-bottom: 5px;
        color: #333;
    }
    
    .quest-info p {
        color: #666;
        font-size: 0.9rem;
    }
    
    .quest-reward {
        color: #667eea;
        font-weight: 600;
    }
`;
document.head.appendChild(questItemStyles);