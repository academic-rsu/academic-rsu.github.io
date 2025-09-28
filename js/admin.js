// Admin JavaScript

let currentUser = null;
let currentQuestId = null;
let currentBadgeId = null;
let isEditMode = false;

// Initialize admin page
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            
            // Check if user is admin
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (!userDoc.exists || !userDoc.data().isAdmin) {
                showNotification('Access denied. Admin privileges required.', 'error');
                window.location.href = 'dashboard.html';
                return;
            }
            
            await loadAdminData();
            updateNavigation();
        } else {
            window.location.href = 'index.html';
        }
    });
});

// Show admin tab
function showAdminTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.admin-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab and activate button
    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');
    
    // Load data for the selected tab
    switch(tabName) {
        case 'quests':
            loadQuests();
            break;
        case 'badges':
            loadBadges();
            break;
        case 'submissions':
            loadSubmissions();
            break;
    }
}

// Load admin data
async function loadAdminData() {
    await loadQuests();
    await loadBadges();
    await loadSubmissions();
}

// Load quests for admin
async function loadQuests() {
    const questsList = document.getElementById('adminQuestsList');
    
    try {
        const questsSnapshot = await db.collection('quests').orderBy('createdAt', 'desc').get();
        
        if (questsSnapshot.empty) {
            questsList.innerHTML = `
                <div class="no-quests">
                    <i class="fas fa-tasks"></i>
                    <p>No quests created yet</p>
                </div>
            `;
            return;
        }
        
        let questsHTML = '';
        for (const doc of questsSnapshot.docs) {
            const quest = doc.data();
            const questId = doc.id;
            
            // Get badge name
            let badgeName = 'No badge';
            if (quest.badgeId) {
                try {
                    const badgeDoc = await db.collection('badges').doc(quest.badgeId).get();
                    if (badgeDoc.exists) {
                        badgeName = badgeDoc.data().name;
                    }
                } catch (error) {
                    console.error('Error loading badge:', error);
                }
            }
            
            questsHTML += `
                <div class="admin-item">
                    <div class="admin-item-info">
                        <h4>${quest.title}</h4>
                        <p>${quest.description}</p>
                        <small>Points: ${quest.points} | Difficulty: ${quest.difficulty} | Badge: ${badgeName}</small>
                    </div>
                    <div class="admin-item-actions">
                        <button class="btn-edit" onclick="editQuest('${questId}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-delete" onclick="deleteQuest('${questId}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        }
        
        questsList.innerHTML = questsHTML;
    } catch (error) {
        console.error('Error loading quests:', error);
        questsList.innerHTML = `
            <div class="loading">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading quests</p>
            </div>
        `;
    }
}

// Load badges for admin
async function loadBadges() {
    const badgesList = document.getElementById('adminBadgesList');
    
    try {
        const badgesSnapshot = await db.collection('badges').orderBy('createdAt', 'desc').get();
        
        if (badgesSnapshot.empty) {
            badgesList.innerHTML = `
                <div class="no-badges">
                    <i class="fas fa-medal"></i>
                    <p>No badges created yet</p>
                </div>
            `;
            return;
        }
        
        let badgesHTML = '';
        badgesSnapshot.forEach(doc => {
            const badge = doc.data();
            const badgeId = doc.id;
            
            badgesHTML += `
                <div class="admin-item">
                    <div class="admin-item-info">
                        <h4>${badge.name}</h4>
                        <p>${badge.description}</p>
                        <small>Color: ${badge.color}</small>
                    </div>
                    <div class="admin-item-actions">
                        <button class="btn-edit" onclick="editBadge('${badgeId}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-delete" onclick="deleteBadge('${badgeId}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        });
        
        badgesList.innerHTML = badgesHTML;
    } catch (error) {
        console.error('Error loading badges:', error);
        badgesList.innerHTML = `
            <div class="loading">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading badges</p>
            </div>
        `;
    }
}

// Load submissions for admin
async function loadSubmissions() {
    const submissionsList = document.getElementById('adminSubmissionsList');
    
    try {
        const submissionsSnapshot = await db.collection('submissions')
            .orderBy('submittedAt', 'desc')
            .get();
        
        if (submissionsSnapshot.empty) {
            submissionsList.innerHTML = `
                <div class="no-submissions">
                    <i class="fas fa-file-alt"></i>
                    <p>No submissions yet</p>
                </div>
            `;
            return;
        }
        
        let submissionsHTML = '';
        for (const doc of submissionsSnapshot.docs) {
            const submission = doc.data();
            const submissionId = doc.id;
            
            // Get user and quest info
            let userName = 'Unknown User';
            let questTitle = 'Unknown Quest';
            
            try {
                const userDoc = await db.collection('users').doc(submission.userId).get();
                if (userDoc.exists) {
                    userName = userDoc.data().name || 'Anonymous';
                }
                
                const questDoc = await db.collection('quests').doc(submission.questId).get();
                if (questDoc.exists) {
                    questTitle = questDoc.data().title || 'Unknown Quest';
                }
            } catch (error) {
                console.error('Error loading submission details:', error);
            }
            
            const statusClass = submission.status === 'approved' ? 'approved' : 
                               submission.status === 'rejected' ? 'rejected' : '';
            
            let actionButtons = '';
            if (submission.status === 'pending') {
                actionButtons = `
                    <div class="submission-actions">
                        <button class="btn-approve" onclick="approveSubmission('${submissionId}', '${submission.userId}', '${submission.questId}')">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn-reject" onclick="rejectSubmission('${submissionId}')">
                            <i class="fas fa-times"></i> Reject
                        </button>
                        <a href="${submission.fileUrl}" target="_blank" class="btn-edit">
                            <i class="fas fa-download"></i> View File
                        </a>
                    </div>
                `;
            } else {
                actionButtons = `
                    <div class="submission-actions">
                        <span class="status-badge ${submission.status}">${submission.status.toUpperCase()}</span>
                        <a href="${submission.fileUrl}" target="_blank" class="btn-edit">
                            <i class="fas fa-download"></i> View File
                        </a>
                    </div>
                `;
            }
            
            submissionsHTML += `
                <div class="admin-item submission-item ${statusClass}">
                    <div class="admin-item-info">
                        <h4>${questTitle}</h4>
                        <p>Submitted by: ${userName}</p>
                        <small>File: ${submission.fileName}</small>
                        ${submission.notes ? `<small>Notes: ${submission.notes}</small>` : ''}
                    </div>
                    ${actionButtons}
                </div>
            `;
        }
        
        submissionsList.innerHTML = submissionsHTML;
    } catch (error) {
        console.error('Error loading submissions:', error);
        submissionsList.innerHTML = `
            <div class="loading">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading submissions</p>
            </div>
        `;
    }
}

// Show add quest modal
function showAddQuestModal() {
    currentQuestId = null;
    isEditMode = false;
    document.getElementById('questModalTitle').textContent = 'Add Quest';
    document.getElementById('questForm').reset();
    loadBadgeOptions();
    document.getElementById('questModal').style.display = 'block';
}

// Show add badge modal
function showAddBadgeModal() {
    currentBadgeId = null;
    isEditMode = false;
    document.getElementById('badgeModalTitle').textContent = 'Add Badge';
    document.getElementById('badgeForm').reset();
    document.getElementById('badgeModal').style.display = 'block';
}

// Load badge options for quest form
async function loadBadgeOptions() {
    const badgeSelect = document.getElementById('questBadge');
    
    try {
        const badgesSnapshot = await db.collection('badges').get();
        
        let optionsHTML = '<option value="">Select Badge</option>';
        badgesSnapshot.forEach(doc => {
            const badge = doc.data();
            optionsHTML += `<option value="${doc.id}">${badge.name}</option>`;
        });
        
        badgeSelect.innerHTML = optionsHTML;
    } catch (error) {
        console.error('Error loading badge options:', error);
    }
}

// Edit quest
async function editQuest(questId) {
    try {
        const questDoc = await db.collection('quests').doc(questId).get();
        if (questDoc.exists) {
            const quest = questDoc.data();
            
            currentQuestId = questId;
            isEditMode = true;
            document.getElementById('questModalTitle').textContent = 'Edit Quest';
            
            document.getElementById('questTitle').value = quest.title;
            document.getElementById('questDescription').value = quest.description;
            document.getElementById('questPoints').value = quest.points;
            document.getElementById('questDifficulty').value = quest.difficulty;
            
            await loadBadgeOptions();
            document.getElementById('questBadge').value = quest.badgeId || '';
            
            document.getElementById('questModal').style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading quest for edit:', error);
        showNotification('Error loading quest data', 'error');
    }
}

// Edit badge
async function editBadge(badgeId) {
    try {
        const badgeDoc = await db.collection('badges').doc(badgeId).get();
        if (badgeDoc.exists) {
            const badge = badgeDoc.data();
            
            currentBadgeId = badgeId;
            isEditMode = true;
            document.getElementById('badgeModalTitle').textContent = 'Edit Badge';
            
            document.getElementById('badgeName').value = badge.name;
            document.getElementById('badgeDescription').value = badge.description;
            document.getElementById('badgeIcon').value = badge.icon;
            document.getElementById('badgeColor').value = badge.color;
            
            document.getElementById('badgeModal').style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading badge for edit:', error);
        showNotification('Error loading badge data', 'error');
    }
}

// Save quest
async function saveQuest() {
    const title = document.getElementById('questTitle').value;
    const description = document.getElementById('questDescription').value;
    const points = parseInt(document.getElementById('questPoints').value);
    const badgeId = document.getElementById('questBadge').value;
    const difficulty = document.getElementById('questDifficulty').value;
    
    if (!title || !description || !points || !difficulty) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    const questData = {
        title,
        description,
        points,
        badgeId: badgeId || null,
        difficulty,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        if (isEditMode && currentQuestId) {
            await db.collection('quests').doc(currentQuestId).update(questData);
            showNotification('Quest updated successfully!', 'success');
        } else {
            questData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('quests').add(questData);
            showNotification('Quest created successfully!', 'success');
        }
        
        closeQuestModal();
        await loadQuests();
    } catch (error) {
        console.error('Error saving quest:', error);
        showNotification('Error saving quest: ' + error.message, 'error');
    }
}

// Save badge
async function saveBadge() {
    const name = document.getElementById('badgeName').value;
    const description = document.getElementById('badgeDescription').value;
    const icon = document.getElementById('badgeIcon').value;
    const color = document.getElementById('badgeColor').value;
    
    if (!name || !description || !icon || !color) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    const badgeData = {
        name,
        description,
        icon,
        color,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        if (isEditMode && currentBadgeId) {
            await db.collection('badges').doc(currentBadgeId).update(badgeData);
            showNotification('Badge updated successfully!', 'success');
        } else {
            badgeData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('badges').add(badgeData);
            showNotification('Badge created successfully!', 'success');
        }
        
        closeBadgeModal();
        await loadBadges();
    } catch (error) {
        console.error('Error saving badge:', error);
        showNotification('Error saving badge: ' + error.message, 'error');
    }
}

// Delete quest
async function deleteQuest(questId) {
    if (confirm('Are you sure you want to delete this quest? This action cannot be undone.')) {
        try {
            await db.collection('quests').doc(questId).delete();
            showNotification('Quest deleted successfully!', 'success');
            await loadQuests();
        } catch (error) {
            console.error('Error deleting quest:', error);
            showNotification('Error deleting quest: ' + error.message, 'error');
        }
    }
}

// Delete badge
async function deleteBadge(badgeId) {
    if (confirm('Are you sure you want to delete this badge? This action cannot be undone.')) {
        try {
            await db.collection('badges').doc(badgeId).delete();
            showNotification('Badge deleted successfully!', 'success');
            await loadBadges();
        } catch (error) {
            console.error('Error deleting badge:', error);
            showNotification('Error deleting badge: ' + error.message, 'error');
        }
    }
}

// Approve submission
async function approveSubmission(submissionId, userId, questId) {
    try {
        // Get quest and badge info
        const questDoc = await db.collection('quests').doc(questId).get();
        if (!questDoc.exists) {
            showNotification('Quest not found', 'error');
            return;
        }
        
        const quest = questDoc.data();
        
        // Update submission status
        await db.collection('submissions').doc(submissionId).update({
            status: 'approved',
            approvedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Update user points and badges
        const userRef = db.collection('users').doc(userId);
        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) {
                throw new Error('User not found');
            }
            
            const userData = userDoc.data();
            const newPoints = (userData.points || 0) + quest.points;
            const newBadges = [...(userData.badges || [])];
            const newCompletedQuests = [...(userData.completedQuests || []), questId];
            
            // Add badge if quest has one and user doesn't have it
            if (quest.badgeId && !newBadges.includes(quest.badgeId)) {
                newBadges.push(quest.badgeId);
            }
            
            transaction.update(userRef, {
                points: newPoints,
                badges: newBadges,
                completedQuests: newCompletedQuests,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
        
        showNotification('Submission approved successfully!', 'success');
        await loadSubmissions();
    } catch (error) {
        console.error('Error approving submission:', error);
        showNotification('Error approving submission: ' + error.message, 'error');
    }
}

// Reject submission
async function rejectSubmission(submissionId) {
    try {
        await db.collection('submissions').doc(submissionId).update({
            status: 'rejected',
            rejectedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showNotification('Submission rejected', 'success');
        await loadSubmissions();
    } catch (error) {
        console.error('Error rejecting submission:', error);
        showNotification('Error rejecting submission: ' + error.message, 'error');
    }
}

// Close modals
function closeQuestModal() {
    document.getElementById('questModal').style.display = 'none';
    document.getElementById('questForm').reset();
    currentQuestId = null;
    isEditMode = false;
}

function closeBadgeModal() {
    document.getElementById('badgeModal').style.display = 'none';
    document.getElementById('badgeForm').reset();
    currentBadgeId = null;
    isEditMode = false;
}

// Update navigation
function updateNavigation() {
    const userGreeting = document.getElementById('userGreeting');
    userGreeting.textContent = `Welcome, ${currentUser.displayName || 'Admin'}!`;
}

// Close modal when clicking outside
window.onclick = function(event) {
    const questModal = document.getElementById('questModal');
    const badgeModal = document.getElementById('badgeModal');
    
    if (event.target === questModal) {
        closeQuestModal();
    }
    if (event.target === badgeModal) {
        closeBadgeModal();
    }
}

// Add CSS for status badges
const statusStyles = document.createElement('style');
statusStyles.textContent = `
    .status-badge {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: 600;
    }
    
    .status-badge.approved {
        background: #d4edda;
        color: #155724;
    }
    
    .status-badge.rejected {
        background: #f8d7da;
        color: #721c24;
    }
    
    .status-badge.pending {
        background: #fff3cd;
        color: #856404;
    }
`;
document.head.appendChild(statusStyles);