import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAVt_XIlWvq0aExGhl4GMmlcCVaDy65yTU",
  authDomain: "vaultify-b6ebb.firebaseapp.com",
  projectId: "vaultify-b6ebb",
  storageBucket: "vaultify-b6ebb.firebasestorage.app",
  messagingSenderId: "603747170732",
  appId: "1:603747170732:web:c49d3263f25cc8603c2209"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
