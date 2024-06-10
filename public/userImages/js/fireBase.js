  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
  import { getAuth,GoogleAuthProvider ,signInWithPopup} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

  
  const firebaseConfig = {
    apiKey: "AIzaSyC75LYmFbXb24Ev3Vj_sARPpzgv3TLf7ec",
    authDomain: "audizo12.firebaseapp.com",
    projectId: "audizo12",
    storageBucket: "audizo12.appspot.com",
    messagingSenderId: "886733955085",
    appId: "1:886733955085:web:c43faf196b58a33173f544"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  auth.languageCode = "en"
  const provider = new GoogleAuthProvider();

  const googleLogin = document.getElementById("google-login-button");
  googleLogin.addEventListener("click",function(){
    alert(5 )
  })