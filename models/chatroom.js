var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

// User Schema
var ChatRoomSchema = mongoose.Schema({
    name: {
        type: String,
        default: 'New chat room'
    },
    topic: {
        type: String,
        default: "No Specific Topic"
    },
    users: {
        type: Array
    },
    usercap: {
        type: Number,
        default: 2,
    },
    password: {
        type: String,
        default: null
    },
    locked: {
        type: Boolean,
        default: false,
    },
	timeCreated: {
		type: String,
		default: Date.now()
	}
});

var ChatRoom = module.exports = mongoose.model('ChatRoom', ChatRoomSchema);

module.exports.createRoom = function(newRoom, callback){
	bcrypt.genSalt(10, function(err, salt) {
	    bcrypt.hash(newRoom.password, salt, function(err, hash) {
	        newRoom.password = hash;
	        newRoom.save(callback);
	    });
	});
}

module.exports.comparePassword = function(candidatePassword, hash, callback){
	bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
    	if(err) throw err;
    	callback(null, isMatch);
	});
}