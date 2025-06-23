const axios = require('axios');

async function generateBudget({ income, location, rentStatus, expenses }) {
  const prompt = `Create a Nigerian monthly budget for someone earning ₦${income}, living in ${location}, ${rentStatus}, with expenses on: ${expenses.join(', ')}. Format as a clear list with approximate naira values and one-line savings advice.`;

  const response = await axios.post(
    'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct',
    { inputs: prompt },
    {
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
      }
    }
  );

  const result = response.data?.[0]?.generated_text || "Sorry, I couldn’t generate your budget.";
  return result;
}

module.exports = generateBudget;