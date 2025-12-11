import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCDdcdQfzSuBGSvQHAGF2rFLQ0puhjpMyM",
  authDomain: "lumiere-aa8ee.firebaseapp.com",
  projectId: "lumiere-aa8ee",
  storageBucket: "lumiere-aa8ee.firebasestorage.app",
  messagingSenderId: "2863083312",
  appId: "1:2863083312:web:e63d9c9737c8257fcda2f5",
  measurementId: "G-ZP6M2Z1EYD"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };