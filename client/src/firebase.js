import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCERmyoqqhbt2Dz7NEzeawlBMYScDFz12o",
  authDomain: "pethealth-f2d3e.firebaseapp.com",
  projectId: "pethealth-f2d3e",
  storageBucket: "pethealth-f2d3e.firebasestorage.app",
  messagingSenderId: "289459206684",
  appId: "1:289459206684:web:cc970a8e895ca7cbe9fdd9"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
