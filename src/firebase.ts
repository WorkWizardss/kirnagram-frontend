import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDvlTTK_oEr1M3kJRl1r8zllRuxj7ykVkY",
  authDomain: "kirnagram-b672d.firebaseapp.com",
  projectId: "kirnagram-b672d",
  storageBucket: "kirnagram-b672d.appspot.com",
  messagingSenderId: "440741687516",
  appId: "1:440741687516:web:d62974c7457aeb1b1ec419",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 🔐 Firebase Auth
export const auth = getAuth(app);

// 🔵 Google Provider
export const googleProvider = new GoogleAuthProvider();
