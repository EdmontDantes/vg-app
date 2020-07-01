const mongoose = require('mongoose');
const moment = require('moment');
const Schema = mongoose.Schema;

const UserSchema = new mongoose.Schema({
    name: {type: String, required: true, lowercase: true },
    userName: {type: String, required: true, unique: true},
    email: {type: String, unique: true, required: true, lowercase: true},
    password: { type: String, required: true, min: 3 },
    admin: {type: Boolean, default: false},
    timestamp: { type: String, default: () => moment().format('dddd, MMMM do YYYY, h:mm a') },
    games: [{ 
        favorite: {type: Boolean, default: false },
        reference:{ type: Schema.Types.ObjectId, ref: 'game' }
        }]
});

module.exports = mongoose.model('user', UserSchema);