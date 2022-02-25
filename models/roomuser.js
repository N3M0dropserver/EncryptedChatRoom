var mongoose = require('mongoose');

// User Schema
var RoomUserSchema = mongoose.Schema({
	email: {
		type: String
	},
	timejoined: {
		type: String,
		default: Date.now()
	}
});

var RoomUser = module.exports = mongoose.model('RoomUser', RoomUserSchema,);
