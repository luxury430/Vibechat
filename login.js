import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// 🔥 Firebase Config (your working one)
const firebaseConfig = {
  apiKey: "AIzaSyBm_cuY0tQI6ObAzwWZyvuUSaEX6sTgTs4",
  authDomain: "neuroforge-815e5.firebaseapp.com",
  projectId: "neuroforge-815e5",
  storageBucket: "neuroforge-815e5.appspot.com",
  messagingSenderId: "101095135000",
  appId: "1:101095135000:web:b5068cfb8262dd9f8c306d"
};

// 🔥 Init
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 🚫 Prevent redirect loop
let authChecked = false;

/* ================= AUTO LOGIN CHECK ================= */
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Already logged in → redirecting");
    window.location.href = "chat.html";
  } else {
    authChecked = true; // allow login page to stay
  }
});

/* ================= LOGIN ================= */
document.getElementById("login")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      alert("Login success 🔥");

      // ✅ redirect after login
      window.location.href = "chat.html";
    })
    .catch((error) => {
      alert(error.code);
      console.log(error);
    });
});

/* ================= SIGNUP ================= */
document.getElementById("signup")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      alert("Signup success 🚀");

      // ✅ redirect after signup
      window.location.href = "chat.html";
    })
    .catch((error) => {
      alert(error.code);
      console.log(error);
    });
});
