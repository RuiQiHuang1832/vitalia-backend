import http from 'http';
import app from './src/app.js';
import { initSocket } from './src/lib/socket.js';

const PORT = process.env.PORT || 8080;

// Build the HTTP server explicitly so socket.io can attach to the same
// server object express is using. app.listen() would create its own
// server and there'd be nothing to hand to socket.io, so we hoist it.
const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log("NODE_ENV:", process.env.NODE_ENV);
});
