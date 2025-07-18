import { OpenAIRequest } from '@shared/schema';

// API for verifying passkey
export async function verifyPasskey(passkey: string) {
  const response = await fetch('/api/verify-passkey', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ passkey }),
  });

  if (!response.ok) {
    // Try to get error message from response
    let errorMessage;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || `Authentication failed: ${response.status}`;
    } catch (e) {
      errorMessage = `Authentication failed: ${response.status}`;
    }
    
    throw new Error(errorMessage);
  }

  return response.json();
}

// API for querying OpenAI
export async function queryOpenAI(data: OpenAIRequest) {
  const response = await fetch('/api/openai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    // Try to get error message from response
    let errorMessage;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || `Error: ${response.status} ${response.statusText}`;
    } catch (e) {
      errorMessage = `Error: ${response.status} ${response.statusText}`;
    }
    
    throw new Error(errorMessage);
  }

  return response.json();
}

// API for health check
export async function checkHealth() {
  const response = await fetch('/api/health');
  return response.json();
}
