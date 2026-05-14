import axios from 'axios';
import { env } from '../../env';

export async function callVeniceAI(options: {
  pairId: string;
  userId: string;
  message: string;
  mode: 'DEEPLY_US';
}) {
  const response = await axios.post(
    'https://api.venice.ai/v1/chat/completions',
    {
      model: 'llama-3.3-70b',
      messages: [
        {
          role: 'user',
          content: options.message,
        },
      ],
      temperature: 0.9,
      max_tokens: 800,
    },
    {
      headers: {
        Authorization: `Bearer ${env.VENICE_API_KEY}`,
      },
    }
  );

  return {
    id: response.data.id,
    content: response.data.choices[0].message.content,
    mode: 'DEEPLY_US',
    confidence: 0.9,
    createdAt: new Date(),
  };
}
