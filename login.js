import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBm_cuY0tQI60bAzwWZyvuUSaEX6sTgTs4",
  authDomain: "neuroforge-815e5.firebaseapp.com",
  projectId: "neuroforge-815e5",
  storageBucket: "neuroforge-815e5.firebasestorage.app",
  messagingSenderId: "101095135000",
  appId: "1:101095135000:web:b5068cfb8262dd9f8c306d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ✅ LOGIN FORM
document.getElementById("login").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Login success 🔥");

    window.location.href = "/Vibechat/chat.html"; // ✅ correct path
  } catch (err) {
    alert(err.message);
  }
});

// ✅ AUTO REDIRECT if already logged in
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "/Vibechat/chat.html";
  }
});
