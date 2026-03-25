let fetchFn;
if (typeof global.fetch !== 'undefined') {
  fetchFn = global.fetch;
} else {
  try {
    fetchFn = require('node-fetch');
  } catch (e) {
    fetchFn = null;
  }
}

const generateSuggestions = async (prompt) => {
  const apiKey = process.env.AI_API_KEY;
  const apiUrl = process.env.AI_API_URL;
  const model = process.env.AI_MODEL;

  if (!apiKey || apiKey === 'your_ai_api_key_here') {
    // Return dummy response if no real API key is set
    return "This is a dummy AI suggestion. Provide a real API key to get actual insights based on your obstacles and missed items.";
  }

  try {
    if (!fetchFn) return "Fetch API is not available on this Node version.";
    
    // Ensure the user's URL hits the actual completions endpoint instead of the base domain
    let finalUrl = apiUrl.trim();
    if (!finalUrl.endsWith('/chat/completions')) {
      finalUrl = finalUrl.replace(/\/+$/, '') + '/chat/completions';
    }

    const response = await fetchFn(finalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    if (data && data.choices && data.choices.length > 0) {
      return data.choices[0].message.content;
    }
    if (data && data.error && data.error.message) {
      return `API Error: ${data.error.message}`;
    }
    return `Failed to parse AI response. ${JSON.stringify(data)}`;
  } catch (error) {
    console.error("AI Service Error:", error);
    return `AI service is currently unavailable: ${error.message}`;
  }
};

const getRolloverSuggestions = async (pastTasks) => {
  if (!pastTasks || pastTasks.length === 0) return "No past obstacles found.";

  const descriptions = pastTasks.map(t => 
    `Task: ${t.name}\nObstacles faced: ${t.obstacles || 'None'}\nWhat wasn't done: ${t.whatNotDone || 'None'}`
  ).join('\n\n');

  const prompt = `Based on the following recently completed tasks and their obstacles/missed items, please provide a short, actionable suggestion for what the user should focus on for their next task to overcome these specific challenges. Judge if the obstacles are global or goal-specific and adjust your advice accordingly:\n\n${descriptions}`;
  
  return await generateSuggestions(prompt);
};

const getWeeklyInsights = async (pastTasks) => {
  if (!pastTasks || pastTasks.length === 0) return "No data from the past week to generate insights.";

  const descriptions = pastTasks.map(t => 
    `Task: ${t.name}\nObstacles faced: ${t.obstacles || 'None'}\nWhat wasn't done: ${t.whatNotDone || 'None'}`
  ).join('\n\n');

  const prompt = `You are an AI productivity coach. Review the user's tasks from the past week, noting the obstacles they faced and what they failed to complete. Generate a concise "Past Week Insights" summary. Encourage them to set their new week's goals around overcoming these specific challenges:\n\n${descriptions}`;

  return await generateSuggestions(prompt);
};

module.exports = {
  getRolloverSuggestions,
  getWeeklyInsights
};
