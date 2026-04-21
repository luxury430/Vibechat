import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signOut
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

// ── Password Strength Validator ──────────────────────────────────────────────
// Rules: 8+ chars · 1 uppercase · 1 lowercase · 1 digit · 1 special character
function isStrongPassword(password) {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
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

// ── Auth State: auto-redirect only when email is verified ────────────────────
onAuthStateChanged(auth, (user) => {
  if (user && user.emailVerified) {
    window.location.href = "chat.html";
  }
  // Unverified users and logged-out users stay on this page — no action needed.
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

    // Block unverified users from entering the app
    if (!user.emailVerified) {
      showToast("Email not verified yet. Please check your inbox and click the verification link.", true);
      await signOut(auth);
      btn.innerText = "Access Portal";
      btn.disabled  = false;
      return;
    }

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
    showToast(
      "Password must be 8+ characters and include an uppercase letter, a lowercase letter, a number, and a special symbol (@$!%*?&).",
      true
    );
    return;
  }

  btn.innerText = "Forging Identity…";
  btn.disabled  = true;

  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);

    // Send Firebase email verification link
    await sendEmailVerification(user);

    // Sign out immediately — they cannot access the app until verified
    await signOut(auth);

    showToast("Identity forged! A verification link has been sent to your email. Verify it before logging in.");

    // Reset form and return to the Login tab
    e.target.reset();
    document.getElementById("strengthFill").style.width = "0%";
    document.getElementById("strengthText").textContent = "";
    btn.innerText = "Create Account";
    btn.disabled  = false;

    // Switch back to the login tab
    const loginTab = document.querySelectorAll(".tab")[0];
    if (loginTab) loginTab.click();

  } catch (error) {
    showToast(getReadableError(error.code), true);
    btn.innerText = "Create Account";
    btn.disabled  = false;
  }
});
