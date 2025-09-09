// Set up the API endpoint and headers
const url = 'https://api.perplexity.ai/chat/completions';
const headers = {
    'Authorization': 'Bearer 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', // Replace with your actual API key
    'Content-Type': 'application/json'
};

// Define the request payload
const payload = {
    model: 'sonar-pro',
    messages: [
        { role: 'user', content: 'What were the results of the 2025 French Open Finals?' }
    ]
};

// Make the API call
const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
});

const data = await response.json();

// Print the AI's response
console.log('Response content:', data.choices[0].message.content);
console.log(data); // replace with console.log(data.choices[0].message.content) for just the content