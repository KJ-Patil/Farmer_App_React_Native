import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyA8a3HTi22FMz_O2G6hbezyqRuS4SagOak',
  authDomain: 'farmer-ledger-ss.firebaseapp.com',
  projectId: 'farmer-ledger-ss',
  storageBucket: 'farmer-ledger-ss.firebasestorage.app',
  messagingSenderId: '723868421948',
  appId: '1:723868421948:web:4a94da0e3cf97af8d03d8d',
  measurementId: 'G-JNTF8QB6BY',
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
