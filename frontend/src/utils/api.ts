import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export async function apiRequest(endpoint: string, method: string = 'GET', body?: any, token?: string): Promise<{ data: any }> {
  const headers: any = {
    'Content-Type': 'application/json',
  };

  // If token is not provided explicitly, try to get it from storage
  if (!token) {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      if (storedToken) {
        headers.Authorization = `Bearer ${storedToken}`;
      }
    } catch (e) {
      console.error("Failed to get token from storage", e);
    }
  } else {
    headers.Authorization = `Bearer ${token}`;
  }

  // Ensure endpoint starts with / if not present (unless it is a full URL, but avoiding that for simplicity)
  const url = `${API_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  console.log(`API Request: ${method} ${url}`);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Handle empty responses (like 204 No Content)
    const text = await response.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.error("Failed to parse JSON response:", text);
      data = { error: "Invalid JSON response", raw: text };
    }

    if (!response.ok) {
      throw new Error(data.detail || data.message || 'Request failed');
    }

    return { data }; // Axios compatibility: return object with data property
  } catch (error: any) {
    console.error("API Request Error:", error);
    throw error;
  }
}

export default {
  get: (endpoint: string) => apiRequest(endpoint, 'GET'),
  post: (endpoint: string, body: any) => apiRequest(endpoint, 'POST', body),
  put: (endpoint: string, body: any) => apiRequest(endpoint, 'PUT', body),
  delete: (endpoint: string) => apiRequest(endpoint, 'DELETE'),
};
