import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD6-8r5g-RZIa9C56FS_miTFDXzZFx8Q_Q",
  authDomain: "best-version-of-yourself.firebaseapp.com",
  projectId: "best-version-of-yourself",
  storageBucket: "best-version-of-yourself.firebasestorage.app",
  messagingSenderId: "1002162920152",
  appId: "1:1002162920152:web:14c00017b3a720a40695ad",
  measurementId: "G-CQHWGPLQ30"
};

const app = initializeApp(firebaseConfig);

// 匯出各項服務實體
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();