import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ── Firebase Config — MUST match chat.html exactly (same project: neuros-52cda) ──
const firebaseConfig = {
  apiKey:            "AIzaSyC4VFRg8moM-39BO0CPZgOg94gD3T1ED5k",
  authDomain:        "neuros-52cda.firebaseapp.com",
  databaseURL:       "https://neuros-52cda-default-rtdb.firebaseio.com",
  projectId:         "neuros-52cda",
  storageBucket:     "neuros-52cda.firebasestorage.app",
  messagingSenderId: "817588719752",
  appId:             "1:817588719752:web:f206aabf4e908d99d90f3d"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ── Redirect guard — fires once, prevents any double-navigation ─────────────
let _redirecting = false;

// ── Toast UI ─────────────────────────────────────────────────────────────────
function showToast(message, isError = false) {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast ${isError ? "error" : "success"}`;
  toast.innerText = message;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => { toast.classList.remove("show"); setTimeout(() => toast.remove(), 400); }, 4000);
}

// ── Error messages ────────────────────────────────────────────────────────────
function getReadableError(code) {
  switch (code) {
    case "auth/email-already-in-use":   return "This email is already registered.";
    case "auth/invalid-email":          return "Please enter a valid email address.";
    case "auth/invalid-credential":     return "Incorrect email or password.";
    case "auth/wrong-password":         return "Incorrect email or password.";
    case "auth/user-not-found":         return "No account found with this email.";
    case "auth/too-many-requests":      return "Too many attempts. Please try again later.";
    case "auth/weak-password":          return "Password must be at least 6 characters.";
    case "auth/network-request-failed": return "Network error. Check your connection.";
    default:                            return "Something went wrong. Please try again.";
  }
}

// ── Auth state — SINGLE place that navigates to chat.html ────────────────────
// If user is already signed in when index.html loads, skip straight to chat.
// Using replace() so login page is removed from history (no back-button loop).
onAuthStateChanged(auth, (user) => {
  if (user && !_redirecting) {
    _redirecting = true;
    window.location.replace("chat.html");
  }
});

// ── LOGIN ─────────────────────────────────────────────────────────────────────
document.getElementById("login")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email    = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const btn      = e.target.querySelector("button");

  btn.innerText = "Authenticating…";
  btn.disabled  = true;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged above handles the redirect — don't double-navigate here
    showToast("Login successful! Entering NeuroForge…");
  } catch (err) {
    showToast(getReadableError(err.code), true);
    btn.innerText = "Access Portal";
    btn.disabled  = false;
  }
});

// ── SIGNUP ────────────────────────────────────────────────────────────────────
document.getElementById("signup")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email    = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;
  const btn      = e.target.querySelector("button");

  // Minimum 6 chars — matches Firebase's own minimum so old accounts aren't locked out
  if (password.length < 6) {
    showToast("Password must be at least 6 characters.", true);
    return;
  }

  btn.innerText = "Creating Account…";
  btn.disabled  = true;

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged handles redirect — new users land on chat.html
    // where the onboarding modal fires automatically for brand-new accounts
    showToast("Account created! Welcome to NeuroForge 🎉");
  } catch (err) {
    showToast(getReadableError(err.code), true);
    btn.innerText = "Create Account";
    btn.disabled  = false;
  }
});
