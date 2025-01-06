import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyAGmYQubCHHd1yz7XOc9uWOeuuA0VXxIXI",
    authDomain: "atelier-2901.firebaseapp.com",
    projectId: "atelier-2901",
    storageBucket: "atelier-2901.firebasestorage.app",
    messagingSenderId: "820094681779",
    appId: "1:820094681779:web:20278b7221ea25722fa6c6",
    measurementId: "G-2PM0YEZMLD"
  };

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
const analytics = getAnalytics(app);