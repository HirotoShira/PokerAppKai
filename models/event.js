const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const eventTable = new Schema({
    eventName: {type: String, required: true},
    eventDate: {type: Date, required: true},
    eventPlace: {type: String, required: true},
    description: {type: String}
});

module.exports = mongoose.model('eventTable', eventTable);
