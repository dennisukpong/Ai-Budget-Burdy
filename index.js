const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const whatsappRoute = require('./routes/whatsapp');
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('Mongo error:', err));

app.use('/whatsapp', whatsappRoute);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));