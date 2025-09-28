// Leaderboard JavaScript

let currentUser = null;
let currentUserId = null;

// Initialize leaderboard page
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            currentUserId = user.uid;
            await loadLeaderboard();
            updateNavigation();
        } else {
            window.location.href = 'index.html';
        }
    });
});

// Load leaderboard data
async function loadLeaderboard() {
    try {
        // Get all users ordered by points
        const usersSnapshot = await db.collection('users')
            .orderBy('points', 'desc')
            .limit(50)
            .get();
        
        if (usersSnapshot.empty) {
            document.getElementById('leaderboardBody').innerHTML = `
                <div class="loading">
                    <i class="fas fa-users"></i>
                    <p>No students found</p>
                </div>
            `;
            return;
        }
        
        const users = [];
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            // Only include non-admin users in leaderboard
            if (!userData.isAdmin) {
                users.push({
                    id: doc.id,
                    ...userData
                });
            }
        });
        
        // Update top three
        updateTopThree(users.slice(0, 3));
        
        // Update leaderboard table
        updateLeaderboardTable(users);
        
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        document.getElementById('leaderboardBody').innerHTML = `
            <div class="loading">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading leaderboard</p>
            </div>
        `;
    }
}

// Update top three podium
function updateTopThree(topUsers) {
    const positions = ['firstPlace', 'secondPlace', 'thirdPlace'];
    
    positions.forEach((position, index) => {
        const element = document.getElementById(position);
        const user = topUsers[index];
        
        if (user) {
            const userElement = element.querySelector('.podium-user');
            userElement.innerHTML = `
                <i class="fas ${index === 0 ? 'fa-crown gold' : index === 1 ? 'fa-medal silver' : 'fa-medal bronze'}"></i>
                <h3>${user.name || 'Anonymous'}</h3>
                <p>${user.points || 0} pts</p>
            `;
        } else {
            const userElement = element.querySelector('.podium-user');
            userElement.innerHTML = `
                <i class="fas ${index === 0 ? 'fa-crown' : 'fa-medal'}" style="opacity: 0.3;"></i>
                <h3>-</h3>
                <p>0 pts</p>
            `;
        }
    });
}

// Update leaderboard table
function updateLeaderboardTable(users) {
    const leaderboardBody = document.getElementById('leaderboardBody');
    
    if (users.length === 0) {
        leaderboardBody.innerHTML = `
            <div class="loading">
                <i class="fas fa-users"></i>
                <p>No students found</p>
            </div>
        `;
        return;
    }
    
    let tableHTML = '';
    
    users.forEach((user, index) => {
        const rank = index + 1;
        const level = calculateLevel(user.points || 0);
        const badgeCount = (user.badges || []).length;
        const isCurrentUser = user.id === currentUserId;
        
        tableHTML += `
            <div class="leaderboard-row ${isCurrentUser ? 'current-user' : ''}">
                <div class="rank-col">
                    <div class="rank-badge ${rank <= 10 ? 'top' : 'normal'}">
                        ${rank}
                    </div>
                </div>
                <div class="name-col">
                    <div class="student-info">
                        <h4>${user.name || 'Anonymous'} ${isCurrentUser ? '(You)' : ''}</h4>
                        <p>${user.major || 'No major specified'} ${user.year ? `- Year ${user.year}` : ''}</p>
                    </div>
                </div>
                <div class="level-col">
                    <div class="level-badge">
                        Level ${level}
                    </div>
                </div>
                <div class="points-col">
                    <div class="points-display">
                        ${(user.points || 0).toLocaleString()}
                    </div>
                </div>
                <div class="badges-col">
                    <div class="badges-count">
                        <i class="fas fa-medal"></i>
                        ${badgeCount}
                    </div>
                </div>
            </div>
        `;
    });
    
    leaderboardBody.innerHTML = tableHTML;
}

// Update navigation
function updateNavigation() {
    const userGreeting = document.getElementById('userGreeting');
    userGreeting.textContent = `Welcome, ${currentUser.displayName || 'Student'}!`;
    
    // Show admin panel if user is admin
    db.collection('users').doc(currentUser.uid).get().then(doc => {
        if (doc.exists && doc.data().isAdmin) {
            document.getElementById('adminPanel').style.display = 'block';
        }
    });
}