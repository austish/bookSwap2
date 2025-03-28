import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAHnyO_qZH7IvFXg9Zybl4KzdpAcbca8ok",
  authDomain: "bookswap-75b97.firebaseapp.com",
  databaseURL: "https://bookswap-75b97.firebaseio.com",
  projectId: "bookswap-75b97",
  storageBucket: "bookswap-75b97.firebasestorage.app",
  messagingSenderId: "246404929324",
  appId: "1:246404929324:ios:604025f5335c905707be89",
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
const db = getFirestore(app);

export {app, auth, db};
