# Academic Quest - Gamified Student Progress Tracker

A comprehensive web application that gamifies the academic experience for university students, allowing them to earn points and badges by completing quests (assignments/tasks).

## Features

### For Students
- **User Authentication**: Sign up, login, and password reset functionality
- **Gamified Progress**: Earn points and badges by completing quests
- **Level System**: Progress through levels based on accumulated points
- **Leaderboard**: Compare progress with other students
- **Profile Management**: Edit personal information and view achievements
- **Quest Submission**: Upload files for quest completion
- **Real-time Updates**: Live progress tracking and notifications

### For Teachers/Admins
- **Admin Access**: Special access for users with @admin.com email addresses
- **Quest Management**: Create, edit, and delete quests
- **Badge Management**: Create, edit, and delete badges with custom icons
- **Submission Review**: Approve or reject student submissions
- **Student Monitoring**: View all student progress and submissions

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Styling**: Custom CSS with responsive design
- **Icons**: Font Awesome 6.0
- **Hosting**: Compatible with GitHub Pages and other static hosting services

## Firebase Setup

### Prerequisites
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication, Firestore Database, and Storage

### Configuration
1. Replace the Firebase configuration in `js/firebase-config.js` with your project's config:

```javascript
const firebaseConfig = {
    apiKey: "your-api-key-here",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};
```

### Firebase Database Rules

Add these rules to your Firestore Database:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null; // Allow reading for leaderboard
    }
    
    // Quests are readable by all authenticated users, writable by admins only
    match /quests/{questId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Badges are readable by all authenticated users, writable by admins only
    match /badges/{badgeId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Submissions are readable/writable by the user who created them, and readable by admins
    match /submissions/{submissionId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
```

### Firebase Storage Rules

Add these rules to your Firebase Storage:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow users to upload submissions to their own folder
    match /submissions/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      // Allow admins to read all submissions
      allow read: if request.auth != null && 
        exists(/databases/(default)/documents/users/$(request.auth.uid)) &&
        get(/databases/(default)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
```





manually create the users collection and your admin document from scratch in Firestore.

🔹 Step 1. Go to Firestore Database

Open Firebase Console

Choose your project.

From the left menu, click Firestore Database.

If it says “No data yet”, click Start collection.


🔹 Step 2. Create the users Collection

Collection ID → type: users


Click Next.


🔹 Step 3. Create Your User Document

Document ID → set this to your Firebase Authentication UID.

To find it:

Go to Authentication → Users in Firebase Console.

Copy your UID (long string like f8XyQ9aBc12345...).

Paste it as the Document ID.


🔹 Step 4. Add Fields

Click Add field and enter the following:

1.Field: email

Type: string

Value: your email (same as used for signup).


2.Field: role

Type: string

Value: admin


3.Field: isAdmin

Type: boolean

Value: true


Your document should look like this:

{
  "email": "you@example.com",
  "role": "admin",
  "isAdmin": true,
  "createdAt": "2025-09-29T12:34:56Z"
}

🔹 Step 5. Save

Click Save.

Your users/{uid} document now exists with admin privileges.

🔹 Step 6. Test

Go to your website and log in with that account.

Try opening /admin.html.

The site should now see isAdmin: true and grant access.

✅ Done!
Now you have a users collection with your admin document created manually.


(Optional) Add more admins → just repeat the same process for another user’s UID.





## Installation & Setup

1. **Clone or download** this repository
2. **Configure Firebase** as described above
3. **Deploy to a web server** or use locally with a development server

### For GitHub Pages:
1. Push the code to a GitHub repository
2. Go to repository Settings > Pages
3. Select source branch (usually `main` or `master`)
4. Your app will be available at `https://yourusername.github.io/repository-name`

### For Local Development:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

## Usage

### Student Account
1. Sign up with any email address
2. Fill in student information (name, ID, major, year)
3. Browse available quests
4. Submit files for quest completion
5. Earn points and badges
6. Track progress on leaderboard

### Teacher/Admin Account
1. Sign up with an email ending in `@admin.com`
2. Access the Admin Panel
3. Create quests with point rewards and badge assignments
4. Create custom badges with icons
5. Review and approve/reject student submissions
6. Monitor student progress

## File Structure

```
academic-quest/
├── index.html              # Login/signup page
├── dashboard.html          # Student dashboard
├── quests.html            # Quest browsing and submission
├── leaderboard.html       # Student rankings
├── profile.html           # User profile management
├── admin.html             # Admin panel
├── styles.css             # Main stylesheet
├── js/
│   ├── firebase-config.js # Firebase configuration
│   ├── auth.js           # Authentication logic
│   ├── dashboard.js      # Dashboard functionality
│   ├── quests.js         # Quest management
│   ├── leaderboard.js    # Leaderboard display
│   ├── profile.js        # Profile management
│   └── admin.js          # Admin panel logic
└── README.md             # This file
```

## Features in Detail

### Gamification Elements
- **Points System**: Students earn points for completing quests
- **Level Progression**: Every 100 points = 1 level up
- **Badge Collection**: Visual achievements for quest completion
- **Leaderboard**: Competitive ranking system
- **Progress Tracking**: Visual progress bars and statistics

### Quest System
- **Difficulty Levels**: Easy, Medium, Hard quests
- **File Submissions**: Students upload work for review
- **Automatic Rewards**: Points and badges awarded upon approval
- **Quest History**: Track completed quests and earnings

### Admin Features
- **Quest Creation**: Rich quest editor with difficulty settings
- **Badge Designer**: Custom badge creation with icons and colors
- **Submission Review**: Approve/reject student work
- **Student Analytics**: Monitor progress and engagement

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues and questions:
1. Check the Firebase console for configuration issues
2. Verify database and storage rules are correctly set
3. Ensure all required Firebase services are enabled
4. Check browser console for JavaScript errors

## Future Enhancements

- Mobile app version
- Team-based quests
- Achievement categories
- Email notifications
- Advanced analytics
- Integration with LMS systems
