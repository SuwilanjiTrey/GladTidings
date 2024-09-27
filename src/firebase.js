// firebase.js
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  signOut,
  getRedirectResult
} from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCYTSjHq3LgmhK3yCFungQFHN_l4bUGWgA",
  authDomain: "testing-webapi-22d1d.firebaseapp.com",
  projectId: "testing-webapi-22d1d",
  storageBucket: "testing-webapi-22d1d.appspot.com",
  messagingSenderId: "732646386281",
  appId: "1:732646386281:web:2a46c8f3e6b4646ffbd0f8",
  measurementId: "G-PVSYYRDMTM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  
  try {
    // Try popup first
    const result = await signInWithPopup(auth, provider);
    console.log("User signed in", result.user);
    return result;
  } catch (error) {
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
      // If popup is blocked or closed, fall back to redirect
      console.log("Popup blocked or closed, falling back to redirect");
      return signInWithRedirect(auth, provider);
    } else {
      // Handle other errors
      console.error("Error during sign-in", error);
      throw error;
    }
  }
};

const logOut = () => {
  return signOut(auth)
    .then(() => {
      console.log("User signed out");
    })
    .catch((error) => {
      console.error("Error during sign-out", error);
    });
};

const handleRedirectResult = () => {
  return getRedirectResult(auth)
    .then((result) => {
      if (result) {
        // Handle successful sign-in after redirect
        console.log("User signed in after redirect", result.user);
        return result.user;
      }
      return null;
    })
    .catch((error) => {
      // Handle errors
      console.error("Error after redirect", error);
      throw error;
    });
};

export { 
  auth, 
  signInWithGoogle, 
  logOut, 
  handleRedirectResult 
};