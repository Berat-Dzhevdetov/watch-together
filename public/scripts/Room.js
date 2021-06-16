class Room {

    room_code;
    username;
    uid;
    videoSrc;

    constructor() {
        this.room_code = document.getElementById('code').innerHTML.trim();
        this.username = document.getElementById('username').innerHTML.trim();
        this.uid = document.getElementById('uid').innerHTML.trim();
        this.videoSrc = document.getElementById('videosrc').innerHTML.trim();
        this.remove();
    }

    getRoomCode() {
        return this.room_code;
    }
    getUsername() {
        return this.username;
    }
    getUid() {
        return this.uid;
    }
    getVideoSrc() {
        return this.videoSrc;
    }
    getYoutubeLinkIdCode() {
        var array = this.getVideoSrc().split('/');
        return array[array.length - 1];
    }
    remove() {
        document.getElementById('to-remove').remove();
    }
}

export default new Room;