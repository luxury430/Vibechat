import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ── Firebase Config ──────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyBm_cuY0tQI6ObAzwWZyvuUSaEX6sTgTs4",
  authDomain:        "neuroforge-815e5.firebaseapp.com",
  projectId:         "neuroforge-815e5",
  storageBucket:     "neuroforge-815e5.appspot.com",
  messagingSenderId: "101095135000",
  appId:             "1:101095135000:web:b5068cfb8262dd9f8c306d"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ── Premium Toast UI (replaces all alert() calls) ────────────────────────────
function showToast(message, isError = false) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${isError ? "error" : "success"}`;
  toast.innerText = message;
  container.appendChild(toast);

  // Trigger slide-in animation
  setTimeout(() => toast.classList.add("show"), 10);

  // Auto-dismiss after 4 s
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

// ── Password Validator ───────────────────────────────────────────────────────
// Simple rule: 8+ characters (like WhatsApp / Instagram)
function isStrongPassword(password) {
  return password.length >= 8;
}

// ── Human-Readable Firebase Error Messages ───────────────────────────────────
function getReadableError(errorCode) {
  switch (errorCode) {
    case "auth/email-already-in-use":  return "This email is already registered.";
    case "auth/invalid-email":         return "Please enter a valid email address.";
    case "auth/invalid-credential":    return "Incorrect email or password.";
    case "auth/too-many-requests":     return "Too many failed attempts. Please try again later.";
    case "auth/weak-password":         return "Password must be at least 6 characters.";
    case "auth/network-request-failed":return "Network error. Check your connection and retry.";
    default:                           return "An unexpected error occurred. Please try again.";
  }
}

// ── Auth State: redirect any signed-in user ───────────────────────────────────
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "chat.html";
  }
});

// ── LOGIN ────────────────────────────────────────────────────────────────────
document.getElementById("login")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email    = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const btn      = e.target.querySelector("button");

  btn.innerText = "Authenticating…";
  btn.disabled  = true;

  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);

    showToast("Login successful! Entering NeuroForge…");
    window.location.href = "chat.html";

  } catch (error) {
    showToast(getReadableError(error.code), true);
    btn.innerText = "Access Portal";
    btn.disabled  = false;
  }
});

// ── SIGNUP ───────────────────────────────────────────────────────────────────
document.getElementById("signup")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email    = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;
  const btn      = e.target.querySelector("button");

  // Gate 1 — enforce strong password before hitting Firebase
  if (!isStrongPassword(password)) {
    showToast("Password must be at least 8 characters.", true);
    return;
  }

  btn.innerText = "Forging Identity…";
  btn.disabled  = true;

  try {
    await createUserWithEmailAndPassword(auth, email, password);

    showToast("Account created! Welcome to NeuroForge 🎉");
    window.location.href = "chat.html";

  } catch (error) {
    showToast(getReadableError(error.code), true);
    btn.innerText = "Create Account";
    btn.disabled  = false;
  }
});
