// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAdRaZEHyK95pzbOusm8bdRs-4s189V6uI",
  authDomain: "midtermcp.firebaseapp.com",
  projectId: "midtermcp",
  storageBucket: "midtermcp.firebasestorage.app",
  messagingSenderId: "99638579973",
  appId: "1:99638579973:web:facccf9067a430a83d9d6c",
  measurementId: "G-ZJBED7GSQF"
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
