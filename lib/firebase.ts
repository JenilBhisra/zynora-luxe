import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyASOo99AX_f_W8DI1WM0vt-Ue7ysgZCrKs",
  authDomain: "zynora-acd32.firebaseapp.com",
  projectId: "zynora-acd32",
  storageBucket: "zynora-acd32.firebasestorage.app",
  messagingSenderId: "996309677437",
  appId: "1:996309677437:web:9717daa3e979febb6e8814"
};

// Initialize Firebase safely for Next.js App Router
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider };
