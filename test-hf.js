require('dotenv').config();
const axios = require('axios');

(async () => {
  const res = await axios.post(
    'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct',
    { inputs: "Generate a sample Nigerian budget for ₦70,000" },
    { headers: { Authorization: `Bearer ${process.env.HF_API_KEY}` } }
  );
  console.log(res.data);
})();