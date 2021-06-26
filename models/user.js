const mongoose= require('mongoose');
const Schema= mongoose.Schema;
const userSchema= new Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: "I am new"
    },
    posts: [{
        type: Schema.Types.ObjectId,//indicating that it is a reference to a post
        ref: 'Post'//this is the referred post
    }]
});
module.exports= mongoose.model('User', userSchema);