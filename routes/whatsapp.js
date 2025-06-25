const express = require('express');
const { MessagingResponse } = require('twilio').twiml;
const User = require('../models/User');
const generateBudget = require('../utils/generateBudget');

const router = express.Router();


console.log("🚨 Reached fallback zone");
const twiml = new MessagingResponse();
twiml.message("🛠️ Test reply from Budget Buddy. If you're seeing this, we're alive!");
res.writeHead(200, { 'Content-Type': 'text/xml' });
res.end(twiml.toString());
return;


router.post('/', async (req, res) => {
  const from = req.body.From;
  const rawMessage = req.body.Body.trim();
  console.log("📥 Raw incoming message:", req.body.Body);
  const message = rawMessage.toLowerCase();
  const twiml = new MessagingResponse();

  console.log(`📩 Message from ${from}: "${message}"`);

  // 🔄 Restart
  if (message === 'restart') {
    await User.findOneAndDelete({ phone: from });
    twiml.message("🔄 Starting over! What’s your monthly income? (e.g., ₦70,000)");
    res.writeHead(200, { 'Content-Type': 'text/xml' });
 
    res.end(twiml.toString());
    return;
  }

  // ❓ Help
  if (message === 'help') {
    twiml.message(
      `💡 *Available Commands:*\n\n` +
      `• *restart* – Start over from the beginning\n` +
      `• *generate* – Create your personalized budget\n` +
      `• *summary* – View your saved answers\n` +
      `• *help* – See this menu again`
    );
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
    return;
  }

  let user = await User.findOne({ phone: from });

  // 📋 Summary
  if (message === 'summary') {
    if (!user) {
      twiml.message("👋 You haven’t started yet. Type 'Hi' or 'restart' to begin.");
    } else if (!user.income || !user.location || !user.rentStatus || !user.expenses?.length) {
      twiml.message("📋 You're still setting up. Complete all questions first, or type 'restart' to begin again.");
    } else {
      twiml.message(
        `📊 *Your Profile Summary:*\n` +
        `• Income: ₦${user.income.toLocaleString()}\n` +
        `• Location: ${user.location}\n` +
        `• Rent: ${user.rentStatus}\n` +
        `• Expenses: ${user.expenses.join(', ')}\n\n` +
        `✅ Type 'generate' for your budget or 'restart' to start over.`
      );
    }
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
    return;
  }

  // 🆕 New user
  if (!user) {
    user = new User({ phone: from, state: 'awaiting_income' });
    await user.save();
 twiml.message(
  `👋 Welcome to *Budget Buddy*! I’ll help you create a personalized monthly budget in under a minute.\n\n` +
  `📌 First, what’s your monthly income? (e.g., ₦70,000)\n\n` +
  `💡 *You can also type:*\n` +
  `• *restart* – Start over\n` +
  `• *summary* – View your saved details\n` +
  `• *generate* – Build your budget\n` +
  `• *help* – See these options again`
);
  } else {
    switch (user.state) {
      case 'awaiting_income':
        const income = parseInt(rawMessage.replace(/[^\d]/g, ''));
        if (!income || income < 1000) {
          twiml.message("❗ Please enter a valid monthly income in naira. (e.g., ₦70,000)");
          break;
        }
        user.income = income;
        user.state = 'awaiting_location';
        await user.save();
        twiml.message("Got it! What city or town do you live in?");
        break;

      case 'awaiting_location':
        if (rawMessage.length < 2) {
          twiml.message("❗ Please enter a valid city or town name.");
          break;
        }
        user.location = rawMessage;
        user.state = 'awaiting_rent';
        await user.save();
        twiml.message("Do you pay rent, or live with family?");
        break;

      case 'awaiting_rent':
        if (!message.includes('family') && !message.includes('rent')) {
          twiml.message("❗ Please say if you ‘pay rent’ or ‘live with family’.");
          break;
        }
        user.rentStatus = message.includes('family') ? 'living with parents' : 'pays rent';
        user.state = 'awaiting_expenses';
        await user.save();
        twiml.message("What do you typically spend on? (e.g., food, transport, data)");
        break;

      case 'awaiting_expenses':
        const expenses = rawMessage.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
        if (!expenses.length) {
          twiml.message("❗ Please list at least one expense, like ‘food, transport’.");
          break;
        }
        user.expenses = expenses;
        user.state = 'ready_for_budget';
        await user.save();
        twiml.message("Great! Reply ‘generate’ to see your personalized budget 📊");
        break;

      case 'ready_for_budget':
        if (!message.includes('generate')) {
          twiml.message("❗ Type ‘generate’ when you're ready to get your budget.");
          break;
        }
        try {
          const budget = await generateBudget(user);
          const reply = budget || "⚠️ Couldn't generate your budget right now. Please try again.";
          console.log("🤖 AI reply:", reply);
          twiml.message(`📊 Here’s your smart budget:\n\n${reply}`);
          user.state = 'completed';
          await user.save();
        } catch (err) {
          console.error("Budget generation error:", err.response?.data || err.message);
          twiml.message("⚠️ Something went wrong while generating your budget. Please try again later.");
        }
        // ✅ Always end response
        res.writeHead(200, { 'Content-Type': 'text/xml' });
        res.end(twiml.toString());
        return;

      case 'completed':
        twiml.message("✅ You’re all set! Type ‘restart’ to begin again or ‘help’ to see options.");
        break;

      default:
        twiml.message("🤔 Hmm, something went wrong. Type ‘restart’ to start over.");
        break;
    }
  }
   if (!twiml.toString().includes("<Message>")) {
  twiml.message("🤖 Bot received your message but didn't understand. Type 'help' to see options.");
}
  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(twiml.toString());
});

module.exports = router;