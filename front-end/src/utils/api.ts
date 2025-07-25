// lib/api.ts
import axios from "axios";
import { useRouter } from "next/navigation";

// The base URL for your API
const API_URL = "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Crucial for sending cookies (like the refreshToken)
});

// Request Interceptor: Adds the accessToken to every outgoing request
api.interceptors.request.use(
  (config) => {
    const accessToken = sessionStorage.getItem("accessToken");
    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handles expired accessTokens by refreshing them
api.interceptors.response.use(
  // If the response is successful, just return it
  (response) => {
    return response;
  },
  // If the response has an error
  async (error) => {
    const originalRequest = error.config;

    // Check if the error is 401 and it's not a retry request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark it as a retry to prevent infinite loops

      try {
        console.log("Access token expired. Attempting to refresh...");

        // Call the refresh endpoint
        const { data } = await axios.post(
          `${API_URL}/refresh`,
          {},
          { withCredentials: true }
        );

        const { accessToken: newAccessToken } = data;

        // Store the new access token
        sessionStorage.setItem("accessToken", newAccessToken);

        // Update the authorization header for the original request
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

        console.log(
          "Token refreshed successfully. Retrying original request..."
        );
        // Retry the original request with the new token
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Failed to refresh token:", refreshError);
        // If refresh fails, logout the user
        sessionStorage.removeItem("accessToken");
        // Redirect to login page. Note: This won't work directly here.
        // It's better to handle this in a global context or component.
        // For now, we'll just reject the promise.
        window.location.href = "/login"; // Force redirect
        return Promise.reject(refreshError);
      }
    }

    // For any other errors, just reject the promise
    return Promise.reject(error);
  }
);

export default api;
