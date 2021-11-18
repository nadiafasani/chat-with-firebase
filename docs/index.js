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
                ban: false,
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

    db.ref('bans/').once('value', function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            var date = new Date(parseInt(childSnapshot.key));
            var now = new Date().getTime();

            console.log(date.getTime() + " - " + now);
            var childData = childSnapshot.val();

            db.ref('users/').once('value', function(snapshot) {
                snapshot.forEach(function(childSnapshot) {
                    var emailUser = childSnapshot.val().email;
                    console.log(email + " - " + emailUser);
                    if (email == emailUser && date > now) {
                        document.getElementById('login_error').innerHTML = "Sei stato bannato fino a " + date.toLocaleString();
                    } else {
                        auth.signInWithEmailAndPassword(email, password)
                            .then((userCredential) => {
                                console.log("entra");
                                window.open("chat.html", "_self");
                            });
                    }
                });
            });
        });
    });
}

/* chat.html */

// send message to db
function sendMessage() {

    // get values to be submitted
    const timestamp = Date.now();
    const messageInput = document.getElementById("message-input");

    const message = messageInput.value;

    if (message.trim()) {
        var uid = firebase.auth().currentUser.uid;
        // create db collection and send in the data
        db.ref("messages/" + timestamp).set({
            uid,
            channel: currentChannel,
            message,
        });
    }
    messageInput.value = "";
}

// display the messages
// reference the collection created earlier
const fetchChat = db.ref("messages/");

// check for new messages using the onChildAdded event listener
fetchChat.on("child_added", function(snapshot) {
    const user = firebase.auth().currentUser;
    const messages = snapshot.val();
    db.ref("users/").orderByChild("name").on("child_added", function(data) {
        if (data.val().uid == messages.uid && messages.currentChannel == currentChannel) {
            document.getElementById("messages").appendChild(getChatBox(data.val().nickname, messages.message));
        }
    });
});

function viewAllUsers() {
    var dropdown = document.getElementById('members');
    var dropdown2 = document.getElementById('members_for_ban');

    var users = new Array();

    db.ref('users/').once('value', function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            var childKey = childSnapshot.key;
            var childData = childSnapshot.val();
            if (childData.uid != firebase.auth().currentUser.uid) {
                dropdown.innerHTML += '<li><a class="dropdown-item" id="' + childData.nickname + '_for_ban" onclick="addToChannel(this.innerHTML)" >' + childData.nickname + '</a></li>';
                dropdown2.innerHTML += '<li><a class="dropdown-item" id="' + childData.nickname + '_for_ban" onclick="addToBan(this.innerHTML)" >' + childData.nickname + '</a></li>';
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
    loadChannels();
}

function channelExists(channel) {
    db.ref("channels").once("value")
        .then(function(snapshot) {
            if (snapshot.child(channel).exists()) {
                document.getElementById('new_channel_error').innerHTML = "Il canale esiste già. Cambia il nome";
            } else {
                document.getElementById('new_channel_error').innerHTML = "";
            }
        });
}

function loadChannels() {
    document.getElementById('channels').innerHTML = "";
    db.ref('channels/').once('value', function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            const user = firebase.auth().currentUser;
            var channel = childSnapshot.key;
            if (snapshot.child(channel).child(user.uid).exists()) {
                currentChannel = channel;
                document.getElementById('channels').innerHTML += '<a class="list-group-item list-group-item-action list-group-item-dark" onclick="changeChannel(this.id)" id="' + channel + '">' +
                    channel +
                    "<box-icon type='solid' name='edit' class='float-end' color='#6a6a6a' class='edit_icon'></box-icon>" +
                    '<button type="button" class="btn-close float-end" onclick="deleteChannel(this.id)" id="' + channel + '"></button>' +
                    '</a>';
            }
        });
    });
    reloadMessages();
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
function getChatBox(nickname, message, floatRight) {
    var strong = document.createElement("strong");
    strong.textContent = nickname;
    var div = document.createElement("div");
    div.setAttribute("class", (floatRight ? "float-right" : "float-left") + " w-50 m-2 p-2 rounded");
    div.setAttribute("style", "background-color: #D4B0A5")
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
            document.getElementById('account').innerHTML = "<box-icon name='user'></box-icon>" + data.val().nickname;
        }
    });
}

function reloadMessages() {
    const divMessages = document.getElementById("messages");
    divMessages.innerHTML = "";
    while (divMessages.lastElementChild) {
        divMessages.removeChild(divMessages.lastElementChild);
    }

    // check for new messages using the onChildAdded event listener
    db.ref("messages/").on("child_added", function(snapshot) {
        const user = firebase.auth().currentUser;
        const messages = snapshot.val();
        db.ref("users/").orderByChild("name").on("child_added", function(data) {
            if (data.val().uid == messages.uid && messages.channel == currentChannel) {
                document.getElementById("messages").appendChild(getChatBox(data.val().nickname, messages.message, user.uid == messages.uid));
            }
        });
    });
}

function deleteChannel(channel) {
    db.ref('channels/' + channel).remove();
    loadChannels();

    db.ref("messages/").once("value", function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            if (childSnapshot.val().channel == channel) {
                db.ref("messages/" + childSnapshot.key).remove();
            }
        });
    });
}

function modifyChannel(channel) {

}

function addToBan(user) {
    if (document.getElementById('bans').style.display == 'none') {
        document.getElementById('bans').style.display = 'block';
    }

    if (document.getElementById('bans').childNodes.length < 2) {
        document.getElementById('bans').innerHTML += '<li class="list-group-item list-group-item-action list-group-item-dark" onclick="this.remove()" id="' + user + '">' + user + '</li>';
    }
}

function banUser() {
    var reason = document.getElementById('reason').value;
    var hours = document.getElementById('hours').value;
    if (hours <= 0) {
        hours = 1;
    }

    if (reason == "") {
        document.getElementById('ban_error').innerHTML = "Inserire il motivo del ban";
        return false;
    }

    var now = new Date();
    var banTime = new Date(now.getTime() + hours * 3.6e+6);
    console.log(now + " - " + banTime.toLocaleString());

    db.ref("bans").once("value")
        .then(function(snapshot) {
            var bannedNickname = document.getElementById('bans').childNodes[1].innerHTML;

            db.ref('users').orderByChild('nickname').equalTo(bannedNickname).once('value', function(snapshot) {
                snapshot.forEach(function(childSnapshot) {
                    var nickname = childSnapshot.val().nickname;
                    var userUID = firebase.auth().currentUser.uid;
                    var uid = childSnapshot.val().uid;
                    console.log(bannedNickname + " - " + nickname)
                    if (bannedNickname == nickname) {
                        db.ref("bans/" + banTime.getTime()).set({
                            banner: userUID,
                            banned: uid,
                        });
                    }
                });
            });
        });
}