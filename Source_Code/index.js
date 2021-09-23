// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyAGbuU0gVgYKC4SHiHQWD2a0It2pR6ZuI8",
  authDomain: "prova1-cf972.firebaseapp.com",
  databaseURL: "https://prova1-cf972-default-rtdb.firebaseio.com",
  projectId: "prova1-cf972",
  storageBucket: "prova1-cf972.appspot.com",
  messagingSenderId: "1084959353155",
  appId: "1:1084959353155:web:8ef090867dc5562209a7f6",
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  
  // initialize database
  const db = firebase.database();
  
  // get user's data
  const username = prompt("Please Tell Us Your Name");
  
  // submit form
  // listen for submit event on the form and call the postChat function
  document.getElementById("message-form").addEventListener("submit", sendMessage);
  
  // send message to db
  function sendMessage(e) {
    e.preventDefault();
  
    // get values to be submitted
    const timestamp = Date.now();
    const messageInput = document.getElementById("message-input");
    const message = messageInput.value;
  
    // clear the input box
    messageInput.value = "";
  
    //auto scroll to bottom
    document
      .getElementById("messages")
      .scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
  
    // create db collection and send in the data
    db.ref("messages/" + timestamp).set({
      username,
      message,
    });
  }
  
  // display the messages
  // reference the collection created earlier
  const fetchChat = db.ref("messages/");
  
  // check for new messages using the onChildAdded event listener
  fetchChat.on("child_added", function (snapshot) {
    const messages = snapshot.val();
    const message = `<li class=${
      username === messages.username ? "sent" : "receive"
    }><span>${messages.username}: </span>${messages.message}</li>`;
    // append the message on the page
    document.getElementById("messages").innerHTML += message;
  });

  function registerNewUser(){
    var email = document.getElementById("email").value;
    var password = document.getElementById("password").value;

    console.log(email + " : " + password);

    firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
      console.log(error.code);
      console.log(error.message);
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