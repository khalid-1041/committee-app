// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA_OMaPxkVd5f9DhhY_b9yinapi-xK3QUw",
  authDomain: "committee-app-cbd9b.firebaseapp.com",
  projectId: "committee-app-cbd9b",
  storageBucket: "committee-app-cbd9b.firebasestorage.app",
  messagingSenderId: "232996110285",
  appId: "1:232996110285:web:3ebcd13896f968e4abd8e84"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
window.fb = { db, doc, setDoc, getDoc };
console.log("Firebase Connected");
