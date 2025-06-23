const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  phone: String,
  income: Number,
  location: String,
  rentStatus: String,
  expenses: [String],
  state: String
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);