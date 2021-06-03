import Room from '/scripts/Room.js'
// console.log(Room.getRoomCode());
// console.log(Room.getUsername());
var chat = document.querySelector('.chat');
let commentsIco = document.querySelector('i.fa.fa-comments');
let commentsDiv = document.getElementById('chat-to-change');
let usersIco = document.querySelector('i.fa.fa-user');
let usersDiv = document.getElementById('users-to-change');
let headingTitle = document.getElementById('title');
let sendMessageBtn = document.getElementById('sendMessage');
let messageInputEl = document.getElementById('message');

//Attach send Message to server
sendMessageBtn.addEventListener('click', function(e) {
    if (!e) return;
    sendMessageToServer(e);
})
messageInputEl.addEventListener('keyup', function(e) {
    if (!e) return;
    if (e.key != 'Enter') return;
    sendMessageToServer(e);
})

function sendMessageToServer(e) {
    e.preventDefault();
    if (e.isTrusted == false) return;
    var message = document.getElementById('message').value.trim();
    if (message.length <= 0) return;
    socket.emit('chat', { message, username: Room.getUsername() });
    document.getElementById('message').value = '';
}


//FA EVENTS - START
// usersIco.addEventListener('click', (e) => {
//     commentsDiv.style.display = 'none';
//     usersDiv.style.display = 'block';
//     headingTitle.innerHTML = 'Users';
// })
// commentsIco.addEventListener('click', (e) => {
//     usersDiv.style.display = 'none';
//     commentsDiv.style.display = 'block';
//     headingTitle.innerHTML = 'Chat';
// }); 
//todo:
//FA EVENTS - STOP



// 2. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');



tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.querySelector('script');
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player;

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '390',
        width: '640',
        videoId: 'M7lc1UVf-VE',
        playerVars: {
            'playsinline': 1
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
    event.target.playVideo();
}

// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
var done = false;

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING && !done) {
        setTimeout(stopVideo, 6000);
        done = true;
    }
}

function stopVideo() {
    player.stopVideo();
}

//Handle if user left the room
// window.addEventListener('beforeunload', () => {
//     let answer = confirm("Are you sure you want to leave?");
//     if (answer) {
//         let obj = {
//             roomCode: Room.getRoomCode(),
//             username: Room.getUsername(),
//             uid: Room.getUid()
//         };
//         socket.emit('left-room', obj);
//     }
//     return null;
// });
window.onbeforeunload = function(e) {
    e.preventDefault();
    let obj = {
        roomCode: Room.getRoomCode(),
        username: Room.getUsername(),
        uid: Room.getUid()
    };
    socket.emit('left-room', obj);
    return null;
};

// window.addEventListener('load', () => {
//     document.getElementById('my-video_html5_api').addEventListener('click', (e) => {
//         e.preventDefault();
//         sendThatSomeOnePlayedPausedTheVideo();
//     })
// });

// function sendThatSomeOnePlayedPausedTheVideo() {
//     let uid = socket.id;
//     socket.emit('video-trigger', { userName, uid, video: video.currentTime });
// }

//Lister for server's events
socket.on('connected-to-room', function(data) {
    if (data.roomCode != Room.getRoomCode()) return;
    var newlyDiv = document.createElement('div');
    newlyDiv.classList.add('join');
    newlyDiv.innerHTML = `${data.username} joined into the room.`;
    chat.appendChild(newlyDiv);
    let audio = new Audio('/music/connect.mp3');
    audio.volume = 0.1;
    audio.play();
});
socket.on('chat', function(data) {
    var newlyDiv = document.createElement('div');
    newlyDiv.classList.add('message');
    newlyDiv.innerHTML = `${data.username}: ${data.message}.`;
    chat.appendChild(newlyDiv);
    chat.scrollTo(0, chat.scrollHeight);
    let audio = new Audio('/music/message.mp3');
    audio.volume = 0.1;
    audio.play();
});
socket.on('left-room', function(data) {
    if (data.roomCode != Room.getRoomCode())
        return;
    var newlyDiv = document.createElement('div');
    newlyDiv.classList.add('join');
    newlyDiv.innerHTML = `${data} left from the room.`;
    chat.appendChild(newlyDiv);
});
// socket.on('video-trigger', function(data) {
//     var newlyDiv = document.createElement('div');
//     newlyDiv.classList.add('join');
//     let uid = socket.id;
//     chat.appendChild(newlyDiv);
//     if (video.paused === true) {
//         newlyDiv.innerHTML = `${data.userName} just played the video.`;
//         video.currentTime = data.video;
//         if (uid == data.uid) return;
//         video.play();
//     } else {
//         newlyDiv.innerHTML = `${data.userName} just paused the video.`;
//         video.currentTime = data.video;
//         if (uid == data.uid) return;
//         video.pause();
//     }
// });