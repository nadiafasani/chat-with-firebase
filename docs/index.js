// Configurazioni di Firebase
var firebaseConfig = {
    apiKey: "AIzaSyAGbuU0gVgYKC4SHiHQWD2a0It2pR6ZuI8",
  authDomain: "prova1-cf972.firebaseapp.com",
  databaseURL: "https://prova1-cf972-default-rtdb.firebaseio.com",
  projectId: "prova1-cf972",
  storageBucket: "prova1-cf972.appspot.com",
  messagingSenderId: "1084959353155",
  appId: "1:1084959353155:web:8ef090867dc5562209a7f6",
  };

  // Inizializzare Firebase
  firebase.initializeApp(firebaseConfig);
  
  // Inizializzare database
  const db = firebase.database();

  // initialize variabili
  const auth = firebase.auth();
  const timestamp = Date.now();
  var user;
  
  // display the messages
  // reference the collection created earlier
  const fetchChat = db.ref("messages/");
  
  // check for new messages using the onChildAdded event listener
  /*fetchChat.on("child_added", function (snapshot) {
    const messages = snapshot.val();
    const message = `<li class=${
      username === messages.username ? "sent" : "receive"
    }><span>${messages.username}: </span>${messages.message}</li>`;
    // append the message on the page
    document.getElementById("messages").innerHTML += message;
  });*/
  
  // creare nuovo db per gli utenti
  /*db.ref("users/" + Date.now()).set({
    uid,
    nickname,
  });*/

  const fetchUsers = db.ref("users/");

  function registerNewUser(){
    var email = document.getElementById("email").value;
    var password = document.getElementById("password").value;
    var nickname = document.getElementById("nickname").value;
    var uid;

    // creare account
    user = firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
        console.log(error.code);
        document.getElementById("login_error").innerHTML = error.message;
        console.log(error.message);
      });

    loginUser();
    uid = user.uid;
    console.log(user.uid);

    db.ref("users/" + timestamp).set({
        uid,
        nickname,
      });
    
  }

  function registerUser(){
    var email = document.getElementById("email").value;
    var password = document.getElementById("password").value;

    auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
        // Signed in 
        user = userCredential.user;
        // ...
    })
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
    });
}

  /* Helpers */
  function checkEmail(){
    email = document.getElementById('email').value;
    if(!email.match(/^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/)){
      alert("Inserire un indirizzo email valido");
      document.getElementById('email').value = "";
    }
  }