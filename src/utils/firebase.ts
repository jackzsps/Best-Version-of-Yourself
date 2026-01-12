import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyCkunA7R8UK8OyYJ0dYZ8e76FOp4I42xOs",
  authDomain: "best-ver-of-yourself-080-b2069.firebaseapp.com",
  projectId: "best-ver-of-yourself-080-b2069",
  storageBucket: "best-ver-of-yourself-080-b2069.firebasestorage.app",
  messagingSenderId: "1044238167774",
  appId: "1:1044238167774:web:eea7081be723f823425c4f"
};

const app = initializeApp(firebaseConfig);

// 現代 Modular 匯出
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export const functions = getFunctions(app, "asia-east1");
export const googleProvider = new GoogleAuthProvider();
