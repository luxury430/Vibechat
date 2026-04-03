import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 🔥 YOUR FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyBm_cuY0tQI6ObAzwWZyvuUSaEX6sTgTs4",
  authDomain: "neuroforge-815e5.firebaseapp.com",
  projectId: "neuroforge-815e5",
  storageBucket: "neuroforge-815e5.firebasestorage.app",
  messagingSenderId: "101095135000",
  appId: "1:101095135000:web:b5068cfb8262dd9f8c306d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 🔥 AUTO REDIRECT IF ALREADY LOGGED IN
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "chat.html";
  }
});

// WAIT FOR PAGE LOAD
document.addEventListener("DOMContentLoaded", () => {

  // ================= LOGIN =================
  const loginForm = document.getElementById("login");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {
      await signInWithEmailAndPassword(auth, email, password);

      // 🔥 GO TO CHAT
      window.location.href = "chat.html";

    } catch (error) {
      alert(error.message);
    }
  });

  // ================= SIGNUP =================
  const signupForm = document.getElementById("signup");

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("signupName").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      // 🔥 SAVE USER DATA (VERY IMPORTANT)
      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: email,
        uid: "NF-" + user.uid.slice(0,8).toUpperCase(),
        ini: name.slice(0,2).toUpperCase(),
        g: 'linear-gradient(140deg,#7c3aed,#8b5cf6)',
        online: true,
        lastSeen: Date.now()
      });

      // 🔥 GO TO CHAT
      window.location.href = "chat.html";

    } catch (error) {
      alert(error.message);
    }
  });

});