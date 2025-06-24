const express = require('express');
const { MessagingResponse } = require('twilio').twiml;
const User = require('../models/User');
const generateBudget = require('../utils/generateBudget');

const router = express.Router();

router.post('/', async (req, res) => {
  const from = req.body.From;
  const message = req.body.Body.trim().toLowerCase();
  const twiml = new MessagingResponse();

  console.log(`📩 Message from ${from}: "${message}"`);

  // Handle restart
  if (message === 'restart') {
    await User.findOneAndDelete({ phone: from });
    twiml.message("🔄 Starting over! What’s your monthly income? (e.g., ₦70,000)");
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
    return;
  }

  let user = await User.findOne({ phone: from });

  if (!user) {
    user = new User({ phone: from, state: 'awaiting_income' });
    await user.save();
    twiml.message("👋 Welcome to Budget Buddy! What’s your monthly income? (e.g., ₦70,000)");
  } else {
    switch (user.state) {
      case 'awaiting_income':
        user.income = parseInt(req.body.Body.replace(/[^\d]/g, '')) || 0;
        user.state = 'awaiting_location';
        await user.save();
        twiml.message("Got it! What city or town do you live in?");
        break;

      case 'awaiting_location':
        user.location = req.body.Body;
        user.state = 'awaiting_rent';
        await user.save();
        twiml.message("Do you pay rent, or live with family?");
        break;

      case 'awaiting_rent':
        user.rentStatus = req.body.Body.toLowerCase().includes('family') ? 'living with parents' : 'pays rent';
        user.state = 'awaiting_expenses';
        await user.save();
        twiml.message("What do you typically spend on? (e.g., food, transport, data)");
        break;

      case 'awaiting_expenses':
        user.expenses = req.body.Body.toLowerCase().split(',').map(e => e.trim());
        user.state = 'ready_for_budget';
        await user.save();
        twiml.message("Great! Reply ‘generate’ to see your personalized budget 📊");
        break;

      case 'ready_for_budget':
        if (message.includes('generate')) {
          try {
            const budget = await generateBudget(user);
            const reply = budget || "⚠️ Couldn't generate your budget right now. Please try again.";
            twiml.message(`📊 Here’s your smart budget:\n\n${reply}`);
            user.state = 'completed';
            await user.save();
          } catch (err) {
            console.error("Budget generation error:", err.message);
            twiml.message("⚠️ Something went wrong while generating your budget. Please try again later.");
          }
        } else {
          twiml.message("Type ‘generate’ when you’re ready for your budget.");
        }
        break;

      case 'completed':
        twiml.message("You’re all set! Type ‘restart’ if you’d like to begin again.");
        break;

      default:
        twiml.message("Hmm, I’m a bit lost. Type ‘restart’ to start fresh.");
        break;
    }
  }

  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(twiml.toString());
});

module.exports = router;