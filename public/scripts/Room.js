class Room {

    room_code;
    username;
    uid;

    constructor() {
        this.room_code = document.getElementById('code').innerHTML.trim();
        this.username = document.getElementById('username').innerHTML.trim();
        this.uid = document.getElementById('uid').innerHTML.trim();
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
    remove() {
        document.getElementById('to-remove').remove();
    }
}

export default new Room;