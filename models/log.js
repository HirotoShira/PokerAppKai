const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const logTable = new Schema({
    userNumber: {type: String, required: true},
    date: {type: Date, required: true, default: Date.now},
    point: {type: Number, required: true},
    reEntry: {type: Number, required: true},
    maxPot: {type: Number, required: true},
    event: {type: String, required: true},
    totalPoint: {type: Number},
    bp: {type: Number}
});

module.exports = mongoose.model('logTable', logTable);

