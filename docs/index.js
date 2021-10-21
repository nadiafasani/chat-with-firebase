// Configurazioni di Firebase
var firebaseConfig = {
    apiKey: "AIzaSyAjJ0bNKGMPoIeU6jbq8SNlkAiIbEt7TL8",
    authDomain: "chat-with-firebase-1dc0f.firebaseapp.com",
    databaseURL: "https://chat-with-firebase-1dc0f-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "chat-with-firebase-1dc0f",
    storageBucket: "chat-with-firebase-1dc0f.appspot.com",
    messagingSenderId: "699801194182",
    appId: "1:699801194182:web:b5a7617363dd7cc08651c7",
    measurementId: "G-1337V0ESK6"
};

// Inizializzare Firebase
const app = firebase.initializeApp(firebaseConfig);

// Inizializzare database
const db = firebase.database();

// Inizializzare variabili
const auth = firebase.auth();
const timestamp = Date.now();
const user = firebase.auth().currentUser;
var currentChannel;

/* index.html */
function registerNewUser() {
    var email = document.getElementById("email").value;
    var password = document.getElementById("password").value;
    var nickname = document.getElementById("nickname").value;
    var uid;

    // creare account
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            var uid = userCredential.user.uid;
            db.ref("users/" + uid).set({
                uid,
                email,
                nickname,
            });
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            document.getElementById('login_error').innerHTML = error.message;
        });
}

function loginUser() {
    var email = document.getElementById("email").value;
    var password = document.getElementById("password").value;

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            window.open("chat.html", "_self");
        });
}

/* chat.html */

// send message to db
function sendMessage() {

    // get values to be submitted
    const timestamp = Date.now();
    const messageInput = document.getElementById("message-input");
    const message = messageInput.value;

    // clear the input box
    messageInput.value = "";

    var uid = firebase.auth().currentUser.uid;
    // create db collection and send in the data
    db.ref("messages/" + timestamp).set({
        uid,
        currentChannel,
        message,
    });
}

// display the messages
// reference the collection created earlier
const fetchChat = db.ref("messages/");

// check for new messages using the onChildAdded event listener
fetchChat.on("child_added", function(snapshot) {
    const user = firebase.auth().currentUser;
    const messages = snapshot.val();
    /*const message = `<li class=${
      firebase.auth().currentUser.uid === messages.uid ? "sent" : "receive"
    }><span>${messages.username}: </span>${messages.message}</li>`;
    // append the message on the page
    document.getElementById("messages").innerHTML += message;*/
    db.ref("users/").orderByChild("name").on("child_added", function(data) {
        if (data.val().uid == messages.uid && messages.currentChannel == currentChannel) {
            document.getElementById("messages").appendChild(getChatBox(data.val().nickname, messages.message));
        }
    });
});

function viewAllUsers() {
    var dropdown = document.getElementById('members');

    var users = new Array();

    firebase.database().ref('users/').once('value', function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            var childKey = childSnapshot.key;
            var childData = childSnapshot.val();
            if (childData.uid != firebase.auth().currentUser.uid) {
                document.getElementById('members').innerHTML += '<li><a class="dropdown-item" id="' + childData.nickname + '" onclick="addToChannel(this.innerHTML)" >' + childData.nickname + '</a></li>';
            }
            users.push(childData);
        });
    });
}

function addToChannel(nickname) {
    if (document.getElementById('names_of_channel').style.display == 'none') {
        document.getElementById('names_of_channel').style.display = 'block';
    }

    document.getElementById('names_of_channel').innerHTML += '<li class="list-group-item list-group-item-action list-group-item-dark" onclick="this.remove()" id="' + nickname + '">' + nickname + '</li>';
}

function createChannel() {
    var channel = document.getElementById('channel_name').value;
    if (channel == "") {
        document.getElementById('new_channel_error').innerHTML = "Inserire il nome del canale"
    }

    var channel = document.getElementById('channel_name').value;
    if (channel == "") {
        document.getElementById('new_channel_error').innerHTML = "Inserire il nome del canale";
        return false;
    }

    db.ref("channels").once("value")
        .then(function(snapshot) {
            if (snapshot.child(channel).exists()) {
                document.getElementById('new_channel_error').innerHTML = "Il canale esiste già. Cambia il nome";
            } else {
                var nodes = document.getElementById('names_of_channel').childNodes;

                for (var i = 1; i < nodes.length; i++) {

                    db.ref('users').orderByChild('nickname').equalTo(nodes[i].innerHTML).once('value', function(snapshot) {
                        snapshot.forEach(function(childSnapshot) {
                            var nickname = childSnapshot.val().nickname;
                            var uid = childSnapshot.val().uid;
                            db.ref("channels/" + channel + "/" + uid).push({
                                uid,
                            });
                        });
                    });
                    var userUID = firebase.auth().currentUser.uid;
                    db.ref("channels/" + channel + "/" + userUID).push({
                        userUID,
                    });
                }
            }
        });


}

function loadChannels() {
    db.ref('channels/').once('value', function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            const user = firebase.auth().currentUser;
            var channel = childSnapshot.key;
            if (snapshot.child(channel).child(user.uid).exists()) {
                currentChannel = channel;
                document.getElementById('channels').innerHTML += '<a class="list-group-item list-group-item-action list-group-item-dark" onclick="changeChannel(this.id)" id="' + channel + '">' + channel + '<button type="button" class="btn-close position-absolute end-0" onclick="deleteChannel()"></button></a>';
            }
        });
    });
    showNickname();
}

/* Helpers */
function checkEmail() {
    email = document.getElementById('email').value;
    if (!email.match(/^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/)) {
        alert("Inserire un indirizzo email valido");
        document.getElementById('email').value = "";
    }
}

/* create message element */
function getChatBox(nickname, message) {
    var strong = document.createElement("strong");
    strong.textContent = nickname;
    var div = document.createElement("div");
    div.setAttribute("class", "w-50 alert alert-dark m-2 p-2");
    div.appendChild(strong).appendChild(document.createElement("br"));
    div.append(message);
    return div;
}

function changeChannel(channel) {
    currentChannel = channel;
    reloadMessages();
}

function showNickname() {
    db.ref("users/").orderByChild("name").on("child_added", function(data) {
        const user = firebase.auth().currentUser;
        if (data.val().uid == user.uid) {
            document.getElementById('account').innerHTML += data.val().nickname;
        }
    });
}

function reloadMessages() {
    const divMessages = document.getElementById("messages");
    while (divMessages.lastElementChild) {
        divMessages.removeChild(divMessages.lastElementChild);
    }

    // check for new messages using the onChildAdded event listener
    db.ref("messages/").on("child_added", function(snapshot) {
        const user = firebase.auth().currentUser;
        const messages = snapshot.val();
        db.ref("users/").orderByChild("name").on("child_added", function(data) {
            if (data.val().uid == messages.uid && messages.currentChannel == currentChannel) {
                console.log("entra");
                document.getElementById("messages").appendChild(getChatBox(data.val().nickname, messages.message));
            }
        });
    });
}

function deleteChannel() {

}