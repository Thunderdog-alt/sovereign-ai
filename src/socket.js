import { io } from 'socket.io-client';

// In production, VITE_BACKEND_URL points to the Render.com backend.
// In development, it falls back to localhost:3000.
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:3000`;

export const socket = io(BACKEND_URL, { autoConnect: false });
