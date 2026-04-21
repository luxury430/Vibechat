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

// ── Redirect guard — ensures we only navigate once, ever ────────────────────
// Prevents the double-redirect loop caused by onAuthStateChanged firing at
// the same time as the form submit's own window.location call.
let _redirecting = false;

// ── Premium Toast UI ─────────────────────────────────────────────────────────
function showToast(message, isError = false) {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast ${isError ? "error" : "success"}`;
  toast.innerText = message;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 10);
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
    case "auth/email-already-in-use":   return "This email is already registered.";
    case "auth/invalid-email":          return "Please enter a valid email address.";
    case "auth/invalid-credential":     return "Incorrect email or password.";
    case "auth/too-many-requests":      return "Too many failed attempts. Please try again later.";
    case "auth/weak-password":          return "Password must be at least 8 characters.";
    case "auth/network-request-failed": return "Network error. Check your connection and retry.";
    default:                            return "An unexpected error occurred. Please try again.";
  }
}

// ── Auth State ────────────────────────────────────────────────────────────────
// THIS is the single source of truth for navigation away from login.
// Both login and signup rely on this — they never call window.location directly.
onAuthStateChanged(auth, (user) => {
  if (user && !_redirecting) {
    _redirecting = true;
    // replace() prevents the login page from being in browser history,
    // so pressing Back from chat.html doesn't loop back here.
    window.location.replace("chat.html");
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
    await signInWithEmailAndPassword(auth, email, password);
    // ✅ Do NOT redirect here — onAuthStateChanged fires immediately after
    // signIn and handles the single redirect above. Double-redirecting
    // is what causes the login ↔ chat loop.
    showToast("Login successful! Entering NeuroForge…");

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

  if (!isStrongPassword(password)) {
    showToast("Password must be at least 8 characters.", true);
    return;
  }

  btn.innerText = "Forging Identity…";
  btn.disabled  = true;

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    // ✅ Same here — onAuthStateChanged fires after account creation
    // and handles the redirect. New users will hit chat.html where
    // the onboarding overlay launches automatically for brand-new accounts.
    showToast("Account created! Welcome to NeuroForge 🎉");

  } catch (error) {
    showToast(getReadableError(error.code), true);
    btn.innerText = "Create Account";
    btn.disabled  = false;
  }
});
