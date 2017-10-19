'use strict'

const mongoose = use('Mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId
const Mixed = mongoose.Schema.Types.Mixed
const moment = require('moment')


let staffRatingSchema = mongoose.Schema({
  staff: { type: ObjectId, ref: 'Staff' },
  venue: { type: ObjectId, ref: 'Venue' },
  date: { type: Date, default: Date.now },
  overAll: Number,
  items: [{
    item: String,
    score: Number
  }],
}, {
  timestamps: true
})


module.exports = mongoose.model('StaffRating', staffRatingSchema)
