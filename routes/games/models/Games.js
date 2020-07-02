const mongoose = require('mongoose');
const moment = require('moment');


const GameSchema = new mongoose.Schema({
    title: {type: String, required: true, trim: true, unique: true},
    description: {type: String, lowercase: true, trim: true},
    yearReleased: {type: String},
    playTime: {type: String},
    image: {type: String},
    timestamp: { type: String, default: () => moment().format('dddd, MMMM do YYYY, h:mm a') }

});

module.exports = mongoose.model('game', GameSchema);