// Authentication JavaScript

// Tab switching
function showTab(tabName) {
    // Hide all forms
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected form and activate tab
    document.getElementById(tabName + 'Form').classList.add('active');
    event.target.classList.add('active');
}

// Login form handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        showNotification('Login successful!', 'success');
    } catch (error) {
        showNotification('Login failed: ' + error.message, 'error');
    }
});

// Sign up form handler
document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const studentId = document.getElementById('signupStudentId').value;
    const email = document.getElementById('signupEmail').value;
    const major = document.getElementById('signupMajor').value;
    const year = document.getElementById('signupYear').value;
    const password = document.getElementById('signupPassword').value;
    
    try {
        // Create user account
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Update display name
        await user.updateProfile({
            displayName: name
        });
        
        // Create user document in Firestore
        await db.collection('users').doc(user.uid).set({
            name: name,
            studentId: studentId || '',
            email: email,
            major: major || '',
            year: year || '',
            points: 0,
            badges: [],
            completedQuests: [],
            isAdmin: isAdmin(email),
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showNotification('Account created successfully!', 'success');
    } catch (error) {
        showNotification('Sign up failed: ' + error.message, 'error');
    }
});

// Forgot password form handler
document.getElementById('forgotForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('forgotEmail').value;
    
    try {
        await auth.sendPasswordResetEmail(email);
        showNotification('Password reset email sent! Check your inbox.', 'success');
    } catch (error) {
        showNotification('Error sending reset email: ' + error.message, 'error');
    }
});

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    auth.onAuthStateChanged((user) => {
        if (user) {
            window.location.href = 'dashboard.html';
        }
    });
});