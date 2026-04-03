import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {

  apiKey: "AIzaSyC4VFRg8moM-39BO0CPZgOg94gD3T1ED5k",
  authDomain: "neuros-52cda.firebaseapp.com",
  projectId: "neuros-52cda",
  storageBucket: "neuros-52cda.firebasestorage.app",
  messagingSenderId: "817588719752",
  appId: "1:817588719752:web:f206aabf4e908d99d90f3d"
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
