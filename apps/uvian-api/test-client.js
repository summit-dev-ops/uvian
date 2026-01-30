// Simple Socket.IO client to test WebSocket connection
const { io } = require('socket.io-client');

const socket = io('ws://localhost:3000', {
  transports: ['websocket'],
  path: '/', // default path
});

socket.on('connect', () => {
  console.log('Connected, socket id:', socket.id);
  // Join a test room
  const room = 'test-room';
  socket.emit('join_conversation', room);
  // Send a test message
  socket.emit('send_message', { conversationId: room, text: 'Hello from client', sender: 'client' });
});

socket.on('new_message', (payload) => {
  console.log('Received new_message:', payload);
});

socket.on('disconnect', () => {
  console.log('Disconnected');
});

socket.on('connect_error', (err) => {
  console.error('Connection error:', err);
});
