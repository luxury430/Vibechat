import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
// ✅ IMPORT createUserWithEmailAndPassword HERE
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } 
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

// ✅ SIGNUP FORM LOGIC (This was missing!)
document.getElementById("signup").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;
  // You also have signupName, which you can save to a database later!

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("Account created successfully! 🔥");
    window.location.href = "chat.html"; // Using relative path for GitHub pages
  } catch (err) {
    console.log("SIGNUP ERROR CODE:", err.code);
    alert(err.message);
  }
});

// ✅ LOGIN FORM LOGIC
document.getElementById("login").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Login success 🔥");
    window.location.href = "chat.html"; // Using relative path for GitHub pages
  } catch (err) {
    console.log("LOGIN ERROR CODE:", err.code);
    alert(err.message);
  }
});

// ✅ AUTO REDIRECT if already logged in
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Only redirect if we are actively on the index/login page
    if (window.location.pathname.endsWith("index.html") || window.location.pathname === "/Vibechat/") {
        window.location.href = "chat.html";
    }
  }
});
