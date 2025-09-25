const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:1939';

interface ApiOptions extends RequestInit {
  token?: string;
}

export async function apiFetch<T>(endpoint: string, options?: ApiOptions): Promise<T> {
  const { token, headers, ...rest } = options || {};

  const config: RequestInit = {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
  };

  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`Fetching: ${url}`); // Log the URL
  const response = await fetch(url, config);

  if (!response.ok) {
    let errorMessage = "An unknown error occurred";
    try {
      const errorData = await response.json();
      console.error('API Error:', errorData);
      if (errorData && errorData.message) {
        if (Array.isArray(errorData.message)) {
          errorMessage = errorData.message.join(', ');
        } else if (typeof errorData.message === 'object') {
          errorMessage = JSON.stringify(errorData.message);
        } else {
          errorMessage = errorData.message;
        }
      } else {
        errorMessage = JSON.stringify(errorData);
      }
    } catch (e) {
      errorMessage = response.statusText;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}