const axios = require('axios');

async function generateBudget({ income, location, rentStatus, expenses }) {
  const prompt = `Give a clear Nigerian monthly budget for someone earning ₦${income}, living in ${location}, who ${rentStatus}, and spends on: ${expenses.join(', ')}. Return a short bullet list with estimated naira amounts and one savings tip.`;

  try {
    console.time("🔁 Groq response time");

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama3-70b-8192',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful Nigerian financial assistant that creates simple personalized budgets.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.timeEnd("🔁 Groq response time");
    const aiReply = response.data?.choices?.[0]?.message?.content;
    return aiReply || "⚠️ No budget returned from Groq.";
    
  } catch (err) {
    console.error("💥 Groq error:", err.response?.data || err.message);
    return "⚠️ Budget generator timeout or connection issue. Please try again later.";
  }
}

module.exports = generateBudget;