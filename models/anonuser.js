var mongoose = require('mongoose');
// User Schema
var AnonUserSchema = mongoose.Schema({
	username: {
		type: String,
		index:true
	},
	password: {
		type: String,
	},
	room: {
		type: String
	},
	timeCreated: {
		type: String,
		default: Date.now()
	}
});

var AnonUser = module.exports = mongoose.model('AnonUser', AnonUserSchema,);