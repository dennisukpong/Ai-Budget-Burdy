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