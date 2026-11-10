To validate the tokens, you only need your Firebase Project ID:

Project ID: sbox-cms

Valid Issuer (Authority): https://securetoken.google.com/sbox-cms

Valid Audience: sbox-cms

---

firebase sdk:

```
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAvYTA0B24I495MrQiJTkUPQ5W1xuUMNN4",
  authDomain: "sbox-cms.firebaseapp.com",
  projectId: "sbox-cms",
  storageBucket: "sbox-cms.firebasestorage.app",
  messagingSenderId: "750792873729",
  appId: "1:750792873729:web:3218bc0264607e488d6d00",
  measurementId: "G-Y22819SQSW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
```