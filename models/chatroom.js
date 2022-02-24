var mongoose = require('mongoose');

// User Schema
var ChatRoomSchema = mongoose.Schema({
    name: {
        type: String,
        default: 'New chat room'
    },
    topic: {
        type: String
    },
    users: {
        type: Array
    },
    live: {
        type: Boolean,
        default: false,
    }
});

var ChatRoom = module.exports = mongoose.model('ChatRoom', ChatRoomSchema);