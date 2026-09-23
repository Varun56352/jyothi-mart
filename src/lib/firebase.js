import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAkXvZ7MQqsrtqbwDZc3G7i6HYgSmhHK-Q',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'shop-inventory-manager-5fb25.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'shop-inventory-manager-5fb25',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'shop-inventory-manager-5fb25.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '903723810587',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:903723810587:web:9671d2f4edfe3a4672ddbe',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-HP1HG6BS52',
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = typeof window !== 'undefined' ? getAuth(app) : null;
export default app;
