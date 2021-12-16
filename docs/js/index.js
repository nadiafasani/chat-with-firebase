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
var timestamp = Date.now();
const user = firebase.auth().currentUser;
var banned = false;
var currentChannel;

/* index.html */
function registerNewUser() {
    var email = document.getElementById("email").value;
    var password = document.getElementById("password").value;
    var nickname = document.getElementById("nickname").value;
    var uid;

    // creare nuovo account
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            var uid = userCredential.user.uid;
            db.ref("users/" + uid).set({
                uid,
                email,
                nickname,
                ban: false,
                admin: false,
            });
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            document.getElementById('login_error').innerHTML = error.message;
        });
}

function loginUser() {
    banned = false;
    var email = document.getElementById("email").value;
    var password = document.getElementById("password").value;

    db.ref('bans/').once('value', function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            var date = new Date(parseInt(childSnapshot.key)).getTime();
            var now = new Date().getTime();

            var childData = childSnapshot.val();

            db.ref('users/').once('value', function(snapshot) {

                snapshot.forEach(function(childSnapshot) {
                    var emailUser = childSnapshot.val().email;
                    if (email == emailUser && date > now && childSnapshot.val().uid == childData.banned) {
                        document.getElementById('login_error').innerHTML = "Sei stato bannato fino a " + date.toLocaleString();
                        banned = true;
                    }
                });
            });
            if (!banned) {
                auth.signInWithEmailAndPassword(email, password)
                    .then((userCredential) => {
                        window.open("chat.html", "_self");
                    });
            }
        });
    });
}

function logoutUser() {
    auth.signOut();
}

/* chat.html */

// inviare messaggi al DB
function sendMessage(broadcast) {

    // get values to be submitted
    const timestamp = Date.now();
    const messageInput = document.getElementById(broadcast ? "broadcast_message" : "message-input");

    const message = messageInput.value;

    if (message.trim()) {
        var uid = firebase.auth().currentUser.uid;
        db.ref("messages/" + timestamp).set({
            uid,
            channel: currentChannel,
            message,
            broadcast,
        });
    }
    messageInput.value = "";
}

// controllare se ci sono vuoi messaggi
db.ref("messages/").on("child_added", function(snapshot) {
    const user = firebase.auth().currentUser;
    const messages = snapshot.val();
    timestamp = Date.now();
    db.ref("users/").orderByChild("name").on("child_added", function(data) {
        if ((data.val().uid == messages.uid && messages.currentChannel == currentChannel) || (messages.broadcast && data.val().uid == messages.uid)) {
            document.getElementById("messages").appendChild(getChatBox(data.val().nickname, messages.message, user.uid == messages.uid, messages.broadcast));
        }
    });
});

// mostrare tutti gli utenti nel dropdown per il nuovo canale
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

// aggiungere un utente del dropdown al canale
function addToChannel(nickname) {
    if (document.getElementById('names_of_channel').style.display == 'none') {
        document.getElementById('names_of_channel').style.display = 'block';
    }

    document.getElementById('names_of_channel').innerHTML += '<li class="list-group-item list-group-item-action list-group-item-dark" onclick="this.remove()" id="' + nickname + '">' + nickname + '</li>';
}

// creare un nuovo canale
function createChannel() {
    var channel = document.getElementById('channel_name').value;
    var deleteAfter = document.getElementById('channel_delete_after').value;
    if (channel == "") {
        document.getElementById('new_channel_error').innerHTML = "Inserire il nome del canale";
        return;
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
                    db.ref("channels/" + channel + "/deleteAfter " + deleteAfter).push({
                        deleteAfter,
                    });
                }
            }
        });

    loadChannels();
}

// controllare se un canale esiste già
function channelExists(channel, error_id) {
    db.ref("channels").once("value")
        .then(function(snapshot) {
            if (snapshot.child(channel).exists()) {
                document.getElementById(error_id).innerHTML = "Il canale esiste già. Cambia il nome";
            } else {
                document.getElementById(error_id).innerHTML = "";
            }
        });
}

// rimuovere i vecchi messaggi
function deleteOldMessages(channel) {
    var deleteAfter;
    db.ref('channels/' + channel).once('value', function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            var value = childSnapshot.key;
            if (value.startsWith("deleteAfter")) {
                deleteAfter = value.split(" ")[1];
            }

            db.ref("messages/").once("value", function(snapshot) {
                snapshot.forEach(function(childSnapshot) {
                    if (deleteAfter != undefined) {
                        const user = firebase.auth().currentUser;
                        const messages = snapshot.val();
                        now = Date.now();
                        console.log("deleteafter: " + deleteAfter);

                        time = new Date(parseInt(childSnapshot.key)).getTime() + parseInt(deleteAfter) * 3600000;
                        console.log(now);
                        console.log(time);
                        console.log("----------------");
                        if (time > now) {
                            console.log("if entra");
                            //db.ref('messages/' + childSnapshot.key).remove();
                        }
                    }

                });
            });
        });
    });
}

// caricare nella sidebar tutti i canali dell'utente
function loadChannels() {
    document.getElementById('channels').innerHTML = "";
    db.ref('channels/').once('value', function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            const user = firebase.auth().currentUser;
            var channel = childSnapshot.key;
            if (snapshot.child(channel).child(user.uid).exists()) {
                currentChannel = channel;
                document.getElementById('channels').innerHTML += '<li><a class="py-0 fs-6 text-dark" style="color: #404040;" onclick="changeChannel(this.id)" id="' + channel + '">' + channel +
                    '<box-icon type="solid" name="edit" class="float-end edit_icon" id="modify_' + channel + '" color="#6a6a6a" data-bs-toggle="modal" data-bs-target="#modalModifyChannel" onclick="openModifyChannel(this.id)">' +
                    '</box-icon><button type="button" class="btn-close float-end" onclick="deleteChannel(this.id)" id="' + channel + '"></button></a></li>';
            }
        });
    });
    reloadMessages();
    showNickname();
}

/* creare nuova riga per la chat */
function getChatBox(nickname, message, floatRight, broadcast) {
    var strong = document.createElement("strong");
    strong.textContent = nickname + (broadcast ? " in Broadcast" : "");
    var divRow = document.createElement("div");
    var divColumn = document.createElement("div");
    divRow.setAttribute("class", "row");
    divColumn.setAttribute("class", "column");
    var div = document.createElement("div");
    div.setAttribute("class", (floatRight ? "float-end" : "float-start") + " w-50 m-2 p-2 rounded");
    div.setAttribute("style", "background-color: #b7a5d9");
    //divRow.appendChild(div).appendChild(strong).appendChild(document.createElement("br"));
    divRow.appendChild(divColumn);
    divRow.appendChild(divColumn).appendChild(div).appendChild(strong).appendChild(document.createElement("br"));
    div.append(message);
    return divRow;
}

// cambiare il canale corrente
function changeChannel(channel) {
    currentChannel = channel;
    reloadMessages();
}

// mostrare nella sidebar il nickname dell'utente
function showNickname() {
    db.ref("users/").orderByChild("name").on("child_added", function(data) {
        const user = firebase.auth().currentUser;
        if (data.val().uid == user.uid) {
            document.getElementById('account').innerHTML = "<box-icon name='user'></box-icon>" + data.val().nickname;
        }
    });
}

// ricaricare i messaggi del canale corrente
function reloadMessages() {
    const divMessages = document.getElementById("messages");
    divMessages.innerHTML = "";
    while (divMessages.lastElementChild) {
        divMessages.removeChild(divMessages.lastElementChild);
    }

    db.ref("messages/").on("child_added", function(snapshot) {
        const user = firebase.auth().currentUser;
        const messages = snapshot.val();
        timestamp = Date.now();
        db.ref("users/").orderByChild("name").on("child_added", function(data) {
            if ((data.val().uid == messages.uid && messages.channel == currentChannel) || (messages.broadcast && data.val().uid == messages.uid)) {
                document.getElementById("messages").appendChild(getChatBox(data.val().nickname, messages.message, user.uid == messages.uid, messages.broadcast));
            }
        });
    });
}

// eliminare un canale
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

// aprire il form di modifica dei canali
function openModifyChannel(channel) {
    channel = channel.substring(7);
    modalModifyChannel = document.getElementById('modalModifyChannel');
    document.getElementById("modify_channel_name").innerHTML = channel;
    modalModifyChannel.show;
}

// modificare un canale
function modifyChannel() {
    channel = document.getElementById('modify_channel_name').value;
    newName = document.getElementById('channel_new').value;
    newHours = document.getElementById('hours_new');
    //myRef.child("someChild").child("name").setValue(name)
    db.ref('channels/' + channel).update({ 'deleteAfter': newHours });
}

// aggiungere l'utente da bannare
function addToBan(user) {
    if (document.getElementById('bans').style.display == 'none') {
        document.getElementById('bans').style.display = 'block';
    }

    if (document.getElementById('bans').childNodes.length < 2) {
        document.getElementById('bans').innerHTML += '<li class="list-group-item list-group-item-action list-group-item-dark" onclick="this.remove()" id="' + user + '">' + user + '</li>';
    }
}

// bannare un utente
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

    db.ref("bans").once("value")
        .then(function(snapshot) {
            var bannedNickname = document.getElementById('bans').childNodes[1].innerHTML;

            db.ref('users').orderByChild('nickname').equalTo(bannedNickname).once('value', function(snapshot) {
                snapshot.forEach(function(childSnapshot) {
                    var nickname = childSnapshot.val().nickname;
                    var userUID = firebase.auth().currentUser.uid;
                    var uid = childSnapshot.val().uid;
                    if (bannedNickname == nickname) {
                        db.ref("bans/" + banTime.getTime()).set({
                            banner: userUID,
                            banned: uid,
                            reason: reason,
                        });
                    }
                });
            });
        });
}

// caricare nella sidebar la possibilità di inviare messaggi in broadcast
function loadAdminOption() {
    db.ref('users/').once('value', function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            var childKey = childSnapshot.key;
            var childData = childSnapshot.val();
            var uid = firebase.auth().currentUser.uid;
            if (childData.admin && uid == childData.uid) {
                document.getElementById("admin").style.display = "block";
            }
        });
    });
}

// al resize verticale della finestra adattare dinamicamente l'altezza del div con i messaggi
function resizeMessagesDiv() {
    document.getElementById('messages').style.height = screen.height -
        document.getElementById('div_send_message').style.height -
        document.getElementById('open_nav_button').style.height - 150 + "px";
}

// permette di poter inviare messaggi premendo il tasto Enter
function onEnterSendMessage() {
    var input = document.getElementById("message-input");

    input.addEventListener("keyup", function(event) {
        if (event.code === "Enter") {
            event.preventDefault();
            document.getElementById("message-btn").click();
        }
    });
}