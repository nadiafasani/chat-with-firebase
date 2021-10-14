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
  const app = firebase.initializeApp(firebaseConfig);
  
  // Inizializzare database
  const db = firebase.database();

  // Inizializzare variabili
  const auth = firebase.auth();
  const timestamp = Date.now();
  const user = firebase.auth().currentUser;

  /* index.html */
  function registerNewUser(){
    var email = document.getElementById("email").value;
    var password = document.getElementById("password").value;
    var nickname = document.getElementById("nickname").value;
    var uid;

    // creare account
    auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      user = userCredential.user;
      var uid = user.uid;
      db.ref("users/" + user.uid).set({
        uid,
        email,
        nickname,
        isAdmin: false,
      });
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log(error.message);
    });
  }

  function loginUser(){
    var email = document.getElementById("email").value;
    var password = document.getElementById("password").value;

    auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      window.open("chat.html", "_self");
    });
}

/* chat.html */
// submit form
  // listen for submit event on the form and call the postChat function
  //document.getElementById("message-form").addEventListener("submit", sendMessage);
  
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
      uid,
      message,
    });
  }
  
  // display the messages
  // reference the collection created earlier
  const fetchChat = db.ref("messages/");
  
  // check for new messages using the onChildAdded event listener
  fetchChat.on("child_added", function (snapshot) {
    const user = firebase.auth().currentUser;
    const messages = snapshot.val();
    const message = `<li class=${
      username === messages.uid ? "sent" : "receive"
    }><span>${messages.username}: </span>${messages.message}</li>`;
    // append the message on the page
    document.getElementById("messages").innerHTML += message;
  });

function viewAllUsers(){
  console.log("esisto");
  var dropdown = document.getElementById('members');
  console.log(dropdown);

  var users = new Array();

  firebase.database().ref('users/').once('value', function(snapshot) {
    snapshot.forEach(function(childSnapshot) {
      var childKey = childSnapshot.key;
      var childData = childSnapshot.val();
      if(childData.uid != firebase.auth().currentUser.uid){
      document.getElementById('members').innerHTML += '<li><a class="dropdown-item" id="' + childData.nickname + '" onclick="addToChannel(this.innerHTML)" >' +  childData.nickname + '</a></li>';
      }
      console.log(childData.nickname);
      users.push(childData);
    });
  });
}

function addToChannel(nickname){
  console.log(nickname);
  if(document.getElementById('names_of_channel').style.display == 'none'){
    document.getElementById('names_of_channel').style.display = 'block';
  }

  document.getElementById('names_of_channel').innerHTML += '<li class="list-group-item list-group-item-action list-group-item-dark" onclick="this.remove()" id="' + nickname +'">' + nickname + '</li>';
}

function createChannel(){
  var channel = document.getElementById('channel_name').value;


  var nodes = document.getElementById('names_of_channel').childNodes;

  for (var i = 1; i < nodes.length; i++) {
    console.log(nodes[i].innerHTML);

    db.ref('users').orderByChild('nickname').equalTo(nodes[i].innerHTML).once('value', function(snapshot) {
      snapshot.forEach(function(childSnapshot) {
        var nickname = childSnapshot.val().nickname;
        var uid = childSnapshot.val().uid;
        db.ref("channels/" + channel + "/" + uid).push({
          uid,
        });
      });
    });
  }
}

function loadChannels(){
  db.ref('channels/').once('value', function(snapshot) {
    snapshot.forEach(function(childSnapshot) {
      const user = firebase.auth().currentUser;
      var channel = childSnapshot.key;
      if(snapshot.child(channel).child(user.uid).exists()){
        document.getElementById('channels').innerHTML += '<a class="list-group-item list-group-item-action list-group-item-dark" id="' + channel + '">' + channel +'</a>';
      }
    });
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