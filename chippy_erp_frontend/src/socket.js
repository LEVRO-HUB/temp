import { io } from 'socket.io-client';
import API_BASE_URL from './config';

const socket = io(API_BASE_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('Connected to real-time server:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Disconnected from real-time server');
});

export default socket;
