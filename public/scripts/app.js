socket.on('deleted-room', function(roomCode) {
    let squreToDel = document.querySelector(`.square[data-key="${roomCode}"]`);
    if (!squreToDel)
        location.reload();
    squreToDel.remove();
})