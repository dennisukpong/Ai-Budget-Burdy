/*
const axios = require('axios');

async function generateBudget({ income, location, rentStatus, expenses }) {
  const prompt = `Create a Nigerian monthly budget for someone earning ₦${income}, living in ${location}, ${rentStatus}, with expenses on: ${expenses.join(', ')}. Format as a clear list with approximate naira values and one-line savings advice.`;

  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct',
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
        },
        timeout: 20000, // Optional: fail gracefully if it hangs too long
      }
    );

    // DEBUG: log response shape
    console.log("Hugging Face raw response:", JSON.stringify(response.data, null, 2));

    // Robust parsing: handles both array and object formats
    let generated;
    if (Array.isArray(response.data)) {
      generated = response.data[0]?.generated_text;
    } else if (typeof response.data === 'object') {
      generated = response.data?.generated_text || response.data?.output;
    }

    return generated || "⚠️ Sorry, I couldn’t generate your budget at the moment.";
  } catch (err) {
    console.error("💥 Hugging Face API error:", err.message);
    return "⚠️ There was an error connecting to the budget generator. Please try again later.";
  }
}

module.exports = generateBudget;
*/

const axios = require('axios');

async function generateBudget({ income, location, rentStatus, expenses }) {
  const prompt = `Create a Nigerian monthly budget for someone earning ₦${income}, living in ${location}, ${rentStatus}, with expenses on: ${expenses.join(', ')}. Format as a clear list with approximate naira values and one-line savings advice.`;

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a helpful financial assistant that creates personalized Nigerian budgets.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000
      }
    );

    return response.data?.choices?.[0]?.message?.content || "⚠️ No budget response from Groq.";
  } catch (err) {
    console.error("Groq error:", err.message);
    return "⚠️ Failed to connect to budget generator. Please try again.";
  }
}

module.exports = generateBudget;