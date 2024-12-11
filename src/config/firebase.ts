// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD5WAeE3vMdIqLG5_sfVUEAG066pmUoh0s",
  authDomain: "christmas-roulette-68caf.firebaseapp.com",
  projectId: "christmas-roulette-68caf",
  storageBucket: "christmas-roulette-68caf.firebasestorage.app",
  messagingSenderId: "134471063220",
  appId: "1:134471063220:web:09317ddf0745ca8455a9e1",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
