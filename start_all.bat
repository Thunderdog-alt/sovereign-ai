cd backend
start "Backend Server" cmd /k "node server.js"
cd ..
start "Frontend Vite" cmd /k "npm run dev -- --host"
npx localtunnel --port 5173
