var socket = io.connect('http://localhost:4000');

var userName = '';
var chat = document.querySelector('.chat');
var video = document.querySelector('video');
if (localStorage.getItem('usernameForWatchTogether')) {
    document.getElementById('name').value = localStorage.getItem('usernameForWatchTogether');
}

document.getElementById('submit').addEventListener('click', (e) => {
    e.preventDefault();
    var name = document.getElementById('name').value.trim();
    if (name.length <= 0) {
        return;
    }
    userName = name;
    localStorage.setItem('usernameForWatchTogether', userName);
    socket.emit('connected', userName);
    document.querySelector('.container').remove();
    document.getElementById('content').style.display = 'flex';
    window.addEventListener("beforeunload", function() {
        socket.emit('left', userName);
    });
})


window.addEventListener('load', () => {
    document.getElementById('my-video_html5_api').addEventListener('click', (e) => {
        e.preventDefault();
        sendThatSomeOnePlayedPausedTheVideo();
    })
});

function sendThatSomeOnePlayedPausedTheVideo() {
    let uid = socket.id;
    socket.emit('video-trigger', { userName, uid, video: video.currentTime });
}

document.getElementById('sendMessage').addEventListener('click', (e) => {
    e.preventDefault();
    var message = document.getElementById('message').value.trim();
    if (message.length <= 0) {
        return;
    }
    socket.emit('chat', { message, userName });
    document.getElementById('message').value = '';
})

//Lister for server's events
socket.on('connected', function(data) {
    var newlyDiv = document.createElement('div');
    newlyDiv.classList.add('join');
    newlyDiv.innerHTML = `${data} joined into the room.`;
    chat.appendChild(newlyDiv);
});
socket.on('chat', function(data) {
    var newlyDiv = document.createElement('div');
    newlyDiv.classList.add('message');
    newlyDiv.innerHTML = `${data.userName}: ${data.message}.`;
    chat.appendChild(newlyDiv);
    chat.scrollTo(0, chat.scrollHeight);
});
socket.on('left', function(data) {
    var newlyDiv = document.createElement('div');
    newlyDiv.classList.add('join');
    newlyDiv.innerHTML = `${data} left from the room.`;
    chat.appendChild(newlyDiv);
});
socket.on('video-trigger', function(data) {
    var newlyDiv = document.createElement('div');
    newlyDiv.classList.add('join');
    let uid = socket.id;
    chat.appendChild(newlyDiv);
    if (video.paused === true) {
        newlyDiv.innerHTML = `${data.userName} just played the video.`;
        video.currentTime = data.video;
        if (uid == data.uid) return;
        video.play();
    } else {
        newlyDiv.innerHTML = `${data.userName} just paused the video.`;
        video.currentTime = data.video;
        if (uid == data.uid) return;
        video.pause();
    }
});