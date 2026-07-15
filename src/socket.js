import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:3000`;

export const socket = io(BACKEND_URL, { autoConnect: false });

// Called after login — sends the user's Google access token to the backend
// so the backend can use the user's own Gemini quota for AI responses.
export function authenticateSocket() {
  const accessToken = localStorage.getItem('sov_google_access_token');
  if (accessToken) {
    socket.emit('authenticate', { accessToken });
  }
}

// Connect + authenticate in one step
export function connectAndAuth() {
  if (!socket.connected) {
    socket.connect();
  }
  socket.once('connect', () => {
    authenticateSocket();
  });
  // If already connected, authenticate immediately
  if (socket.connected) {
    authenticateSocket();
  }
}
