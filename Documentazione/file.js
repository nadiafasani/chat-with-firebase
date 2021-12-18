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

// modificare un canale
function modifyChannel() {
    channel = document.getElementById('modify_channel_name').value;
    newName = document.getElementById('channel_new').value;
    newHours = document.getElementById('hours_new');
    //myRef.child("someChild").child("name").setValue(name)
    db.ref('channels/' + channel).update({ 'deleteAfter': newHours });
}