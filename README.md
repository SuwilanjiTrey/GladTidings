# Gladtidings Software Platform

> **Helping you shape your future**

A comprehensive web application built with React that provides role-based access for clients and administrators, featuring course management, quiz systems, certificate generation, and user authentication.

![React](https://img.shields.io/badge/React-18.x-blue?logo=react)
![Firebase](https://img.shields.io/badge/Firebase-Authentication-orange?logo=firebase)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?logo=javascript)
![CSS3](https://img.shields.io/badge/CSS3-Responsive-blue?logo=css3)

## 🚀 Features

### 🔐 Authentication & Authorization
- **User Registration & Sign In** - Email/password authentication
- **Email Verification** - Secure account verification process
- **Password Recovery** - Forgot password functionality
- **Role-based Access Control** - Admin, SubAdmin, and Client roles
- **Session Management** - Automatic timeout and activity monitoring
- **Church Elder Registration** - Special registration for church officials

### 👤 User Management
- **Client Dashboard** - Personalized user experience
- **Admin Panel** - Comprehensive administrative controls
- **User Settings** - Profile management and preferences
- **Multi-language Support** - International accessibility with i18n

### 📚 Course & Learning Management
- **Course Management** - Create, edit, and organize courses
- **Quiz System** - Interactive quizzes and assessments
- **Certificate Generation** - Automated certificate creation
- **Progress Tracking** - Monitor learning progress
- **Subscriber Management** - Handle user subscriptions

### 🎨 User Experience
- **Responsive Design** - Mobile-first approach
- **Modern UI/UX** - Clean and intuitive interface
- **Real-time Updates** - Live data synchronization
- **Offline Support** - Progressive Web App capabilities

## 🛠️ Technology Stack

### Frontend
- **React 18+** - Modern React with Hooks
- **React Router** - Client-side routing
- **React i18next** - Internationalization
- **CSS3** - Custom styling with modern features
- **Progressive Web App** - Enhanced mobile experience

### Backend & Services
- **Firebase Authentication** - Secure user management
- **Firebase Firestore** - Real-time NoSQL database
- **Firebase Storage** - File and image storage
- **Firebase Hosting** - Fast and secure hosting

### Development Tools
- **Create React App** - Development environment
- **ESLint** - Code quality and consistency
- **Git** - Version control
- **npm/yarn** - Package management

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Firebase account and project setup

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/gladtidings-platform.git
   cd gladtidings-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Firebase Configuration**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication, Firestore, and Storage
   - Copy your Firebase config to `src/AnA/firebase.js`
   
   ```javascript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-auth-domain",
     projectId: "your-project-id",
     storageBucket: "your-storage-bucket",
     messagingSenderId: "your-messaging-sender-id",
     appId: "your-app-id"
   };
   ```

4. **Environment Variables**
   Create a `.env` file in the root directory:
   ```
   REACT_APP_FIREBASE_API_KEY=your-api-key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-auth-domain
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   ```

5. **Start the development server**
   ```bash
   npm start
   # or
   yarn start
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
src/
├── AnA/                    # Authentication & Authorization
│   ├── firebase.js         # Firebase configuration
│   ├── signin.js          # Sign in component
│   ├── signup.js          # Sign up component
│   ├── verify.js          # Email verification
│   └── recoverpassword.js # Password recovery
├── Admin/                  # Admin panel components
│   ├── AdminPage.js       # Main admin dashboard
│   ├── AdminSettings.js   # Admin settings
│   ├── AdminCourse.js     # Course management
│   ├── Adminquiz.js       # Quiz management
│   └── certificateGenerator.js # Certificate creation
├── Client/                 # Client-side components
│   ├── ClientPage.js      # Client dashboard
│   └── certificateAward.js # Certificate display
├── Language/               # Internationalization
│   ├── GoogleTranslate.js # Language switcher
│   └── config.js          # i18n configuration
├── style/                  # CSS stylesheets
│   ├── App.css            # Main application styles
│   ├── About.css          # About page styles
│   └── Contact.css        # Contact page styles
├── components/             # Reusable components
│   ├── About.js           # About us page
│   └── Contact.js         # Contact us page
├── App.js                  # Main application component
└── Home.js                # Landing page
```

## 🔧 Configuration

### Firebase Setup
1. **Authentication Methods**
   - Enable Email/Password authentication
   - Configure email verification templates
   - Set up password reset templates

2. **Firestore Rules**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       match /courses/{courseId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'subadmin'];
       }
     }
   }
   ```

3. **Storage Rules**
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

## 🌍 Multi-language Support

The application supports multiple languages using React i18next:

- **English** (default)
- **Additional languages** can be added in `src/Language/config.js`

### Adding New Languages
1. Add translation files in `public/locales/[language-code]/`
2. Update the language configuration
3. Add language options to the switcher component

## 👥 User Roles & Permissions

### Client Users
- Access to courses and learning materials
- Take quizzes and assessments
- View certificates and progress
- Manage personal profile

### Admin Users
- Full system administration
- User management and role assignment
- Course and content management
- System settings and configuration

### SubAdmin Users
- Limited administrative access
- Course management
- User support and assistance
- Content moderation

## 🚀 Deployment

### Firebase Hosting
1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Deploy to Firebase**
   ```bash
   firebase init hosting
   firebase deploy
   ```

### Other Hosting Options
- **Netlify**: Connect your GitHub repository for automatic deployments
- **Vercel**: Import project and deploy with zero configuration
- **AWS S3**: Static website hosting with CloudFront CDN

## 🧪 Testing

### Running Tests
```bash
npm test
# or
yarn test
```

### Test Coverage
```bash
npm run test:coverage
# or
yarn test:coverage
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines
- Follow the existing code style and conventions
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure responsive design compatibility

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support & Contact

**Gladtidings Software Ltd**
- 📧 Email: info@gladtidingszm.com
- 📧 Technical Support: cto@zamlib.com
- 🌐 Website: [www.gladtidingszm.com](https://www.gladtidingszm.com)
- 📱 Phone: +260 978 966774 | +260 955 441447
- 📍 Address: 25/26 Nkwazi Rd, Second Floor, Techzam Building, Lusaka, Zambia

## 🙏 Acknowledgments

- Thanks to all contributors who have helped shape this platform
- Firebase team for providing excellent backend services
- React community for continuous innovation
- Our users and clients for valuable feedback

## 📊 Project Status

![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)

---

**Made with ❤️ by Gladtidings Software Ltd**

*Helping you shape your future through innovative software solutions*
