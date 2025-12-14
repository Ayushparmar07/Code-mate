import axios from 'axios';

// AI Chat handler
export const handleAIChat = async (io, socket, { roomId, message, provider }) => {
  try {
    console.log(`AI request from room ${roomId}: ${message}`);
    
    let response;
    
    // Auto-detect provider based on available API keys
    if (!provider) {
      if (process.env.GROQ_API_KEY) {
        provider = 'groq';
      } else if (process.env.GEMINI_API_KEY) {
        provider = 'gemini';
      } else if (process.env.OPENAI_API_KEY) {
        provider = 'openai';
      }
    }
    
    console.log(`Using AI provider: ${provider}`);
    
    switch (provider) {
      case 'groq':
        response = await getGroqResponse(message);
        break;
      case 'gemini':
        response = await getGeminiResponse(message);
        break;
      case 'openai':
        response = await getOpenAIResponse(message);
        break;
      default:
        response = 'AI provider not configured. Please add GROQ_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY to your .env file.';
    }
    
    socket.emit('aiResponse', { message: response });
    
  } catch (error) {
    console.error('AI Error:', error.message);
    socket.emit('aiResponse', { 
      message: 'Sorry, I encountered an error. Please try again.',
      error: true 
    });
  }
};

// Google Gemini API
async function getGeminiResponse(message) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }
  
  // Using v1 API with gemini-1.5-flash model
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  console.log('Calling Gemini API with URL:', url.replace(apiKey, 'API_KEY_HIDDEN'));
  
  try {
    const response = await axios.post(url, {
      contents: [{
        parts: [{
          text: message
        }]
      }]
    }, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Gemini API response received');
    console.log('Response status:', response.status);
    
    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('Unexpected API response structure:', JSON.stringify(response.data, null, 2));
      throw new Error('Invalid API response format');
    }
    
    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Gemini API Error Details:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
    throw error;
  }
}

// OpenAI API (ChatGPT)
async function getOpenAIResponse(message) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }
  
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: message }],
      max_tokens: 1000
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data.choices[0].message.content;
}

// Groq API (Fast inference)
async function getGroqResponse(message) {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }
  
  console.log('Calling Groq API...');
  
  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        messages: [
          { 
            role: 'system', 
            content: 'You are ChatGPT, a helpful AI assistant. Keep responses concise and focused. For code: show the code with a 1-2 sentence explanation. Avoid lengthy tutorials or multiple examples unless specifically asked.' 
          },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 400
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    console.log('Groq API response received');
    
    if (!response.data?.choices?.[0]?.message?.content) {
      console.error('Unexpected Groq response:', JSON.stringify(response.data, null, 2));
      throw new Error('Invalid Groq response format');
    }
    
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Groq API Error Details:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
    throw error;
  }
}

// Code completion/suggestion handler (like Copilot)
export const handleCodeSuggestion = async (io, socket, { roomId, code, language, cursor }) => {
  try {
    const prompt = `You are a code completion assistant. Given the following ${language} code, suggest the next line or completion:

\`\`\`${language}
${code}
\`\`\`

Provide only the code suggestion, no explanations.`;

    const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('AI API key not configured');
    }
    
    let suggestion;
    
    if (process.env.GEMINI_API_KEY) {
      suggestion = await getGeminiResponse(prompt);
    } else if (process.env.OPENAI_API_KEY) {
      suggestion = await getOpenAIResponse(prompt);
    }
    
    socket.emit('codeSuggestion', { suggestion });
    
  } catch (error) {
    console.error('Code suggestion error:', error.message);
    socket.emit('codeSuggestion', { suggestion: '', error: true });
  }
};
