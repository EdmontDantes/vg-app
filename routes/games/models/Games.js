const mongoose = require('mongoose');
const moment = require('moment');


const GameSchema = new mongoose.Schema({
    title: {type: String, required: true, trim: true},
    description: {type: String, lowercase: true, trim: true},
    yearReleased: {type: Number},
    playTime: {type: Number},
    image: {type: String},
    timestamp: { type: String, default: () => moment().format('dddd, MMMM do YYYY, h:mm a') }

});

module.exports = mongoose.model('game', GameSchema);