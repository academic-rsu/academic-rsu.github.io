// Quests JavaScript

let currentUser = null;
let userStats = {
    completedQuests: [],
    pendingSubmissions: []
};
let currentQuestId = null;

// Initialize quests page
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            await loadUserData();
            await loadQuests();
            updateNavigation();
        } else {
            window.location.href = 'index.html';
        }
    });
});

// Load user data
async function loadUserData() {
    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            userStats.completedQuests = userData.completedQuests || [];
            
            // Show admin panel if user is admin
            if (userData.isAdmin) {
                document.getElementById('adminPanel').style.display = 'block';
            }
        }
        
        // Load pending submissions
        const submissionsSnapshot = await db.collection('submissions')
            .where('userId', '==', currentUser.uid)
            .where('status', '==', 'pending')
            .get();
        
        userStats.pendingSubmissions = submissionsSnapshot.docs.map(doc => doc.data().questId);
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Load quests
async function loadQuests() {
    const questsGrid = document.getElementById('questsGrid');
    
    try {
        const questsSnapshot = await db.collection('quests').orderBy('createdAt', 'desc').get();
        
        if (questsSnapshot.empty) {
            questsGrid.innerHTML = `
                <div class="no-quests">
                    <i class="fas fa-compass"></i>
                    <p>No quests available yet. Check back later!</p>
                </div>
            `;
            return;
        }
        
        let questsHTML = '';
        
        for (const doc of questsSnapshot.docs) {
            const quest = doc.data();
            const questId = doc.id;
            const isCompleted = userStats.completedQuests.includes(questId);
            const isPending = userStats.pendingSubmissions.includes(questId);
            
            // Get badge info
            let badgeInfo = '';
            if (quest.badgeId) {
                try {
                    const badgeDoc = await db.collection('badges').doc(quest.badgeId).get();
                    if (badgeDoc.exists) {
                        const badge = badgeDoc.data();
                        badgeInfo = `
                            <div class="quest-badge">
                                <img src="${badge.icon}" alt="${badge.name}" onerror="this.src='https://via.placeholder.com/25x25/667eea/white?text=🏆'">
                                <span>${badge.name}</span>
                            </div>
                        `;
                    }
                } catch (error) {
                    console.error('Error loading badge:', error);
                }
            }
            
            let actionButton = '';
            if (isCompleted) {
                actionButton = `
                    <button class="quest-btn completed" disabled>
                        <i class="fas fa-check"></i> Completed
                    </button>
                `;
            } else if (isPending) {
                actionButton = `
                    <button class="quest-btn pending" disabled>
                        <i class="fas fa-clock"></i> Pending Review
                    </button>
                `;
            } else {
                actionButton = `
                    <button class="quest-btn submit" onclick="openSubmissionModal('${questId}', '${quest.title}', '${quest.description}')">
                        <i class="fas fa-upload"></i> Submit Quest
                    </button>
                `;
            }
            
            questsHTML += `
                <div class="quest-card">
                    <div class="quest-header">
                        <div>
                            <h3 class="quest-title">${quest.title}</h3>
                            <span class="quest-difficulty ${quest.difficulty}">${quest.difficulty}</span>
                        </div>
                    </div>
                    <p class="quest-description">${quest.description}</p>
                    <div class="quest-rewards">
                        <div class="quest-points">
                            <i class="fas fa-coins"></i>
                            <span>${quest.points} Points</span>
                        </div>
                        ${badgeInfo}
                    </div>
                    <div class="quest-actions">
                        ${actionButton}
                    </div>
                </div>
            `;
        }
        
        questsGrid.innerHTML = questsHTML;
    } catch (error) {
        console.error('Error loading quests:', error);
        questsGrid.innerHTML = `
            <div class="loading">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading quests. Please try again.</p>
            </div>
        `;
    }
}

// Open submission modal
function openSubmissionModal(questId, title, description) {
    currentQuestId = questId;
    document.getElementById('modalQuestTitle').textContent = title;
    document.getElementById('modalQuestDescription').textContent = description;
    document.getElementById('submissionModal').style.display = 'block';
}

// Close submission modal
function closeSubmissionModal() {
    document.getElementById('submissionModal').style.display = 'none';
    document.getElementById('submissionFile').value = '';
    document.getElementById('submissionNotes').value = '';
    currentQuestId = null;
}

// Submit quest
async function submitQuest() {
    if (!currentQuestId) return;
    
    const fileInput = document.getElementById('submissionFile');
    const notes = document.getElementById('submissionNotes').value;
    
    if (!fileInput.files[0]) {
        showNotification('Please select a file to upload', 'error');
        return;
    }
    
    try {
        const file = fileInput.files[0];
        const fileName = `submissions/${currentUser.uid}/${currentQuestId}/${Date.now()}_${file.name}`;
        
        // Upload file to Firebase Storage
        const storageRef = storage.ref(fileName);
        const uploadTask = storageRef.put(file);
        
        // Show upload progress
        showNotification('Uploading file...', 'info');
        
        uploadTask.on('state_changed',
            (snapshot) => {
                // Progress function
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload is ' + progress + '% done');
            },
            (error) => {
                // Error function
                console.error('Upload error:', error);
                showNotification('Error uploading file: ' + error.message, 'error');
            },
            async () => {
                // Complete function
                try {
                    const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                    
                    // Create submission document
                    await db.collection('submissions').add({
                        userId: currentUser.uid,
                        questId: currentQuestId,
                        fileUrl: downloadURL,
                        fileName: file.name,
                        notes: notes,
                        status: 'pending',
                        submittedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    
                    showNotification('Quest submitted successfully! Awaiting review.', 'success');
                    closeSubmissionModal();
                    
                    // Reload quests to update UI
                    await loadUserData();
                    await loadQuests();
                } catch (error) {
                    console.error('Error creating submission:', error);
                    showNotification('Error submitting quest: ' + error.message, 'error');
                }
            }
        );
    } catch (error) {
        console.error('Error submitting quest:', error);
        showNotification('Error submitting quest: ' + error.message, 'error');
    }
}

// Update navigation
function updateNavigation() {
    const userGreeting = document.getElementById('userGreeting');
    userGreeting.textContent = `Welcome, ${currentUser.displayName || 'Student'}!`;
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('submissionModal');
    if (event.target === modal) {
        closeSubmissionModal();
    }
}