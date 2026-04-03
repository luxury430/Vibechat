import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 🔥 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "neuros-52cda.firebaseapp.com",
  projectId: "neuros-52cda",
  storageBucket: "neuros-52cda.appspot.com",
  messagingSenderId: "817588719752",
  appId: "1:817588719752:web:f206aabf4e908d99d90f3d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ✅ AUTO REDIRECT IF ALREADY LOGGED IN
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "/Vibechat/chat.html";
  }
});

// ✅ LOGIN
document.getElementById("login").addEventListener("submit", (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      alert("Login success 🔥");
      window.location.href = "/Vibechat/chat.html";
    })
    .catch(err => alert(err.message));
});

// ✅ SIGNUP
document.getElementById("signup").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("signupName").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, "users", cred.user.uid), {
      name,
      email,
      uid: "NF-" + cred.user.uid.slice(0,8).toUpperCase(),
      ini: name.slice(0,2).toUpperCase()
    });

    alert("Account created 🚀");
    window.location.href = "/Vibechat/chat.html";

  } catch (err) {
    alert(err.message);
  }
});
