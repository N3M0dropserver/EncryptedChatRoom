var mongoose = require('mongoose');

// User Schema
var BlogPostSchema = mongoose.Schema({
    content: {
        type: String
    },
    timeofpost: {
        type: Number
    }
});

var blogPost = module.exports = mongoose.model('BlogPost', BlogPostSchema);