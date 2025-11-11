// server.js
// ใช้: npm init -y
// npm install ws express
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
app.use(express.static('.')); // serve files
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const rooms = {}; // roomId -> [ws, ws, ...]

wss.on('connection', (ws) => {
  ws.on('message', (msg) => {
    try{
      const data = JSON.parse(msg);
      const room = data.room || data.roomId || 'lobby';
      if(!rooms[room]) rooms[room] = [];
      if(!rooms[room].includes(ws)) rooms[room].push(ws);

      // broadcast message to other clients in the room
      rooms[room].forEach(client => {
        if(client !== ws && client.readyState === WebSocket.OPEN){
          client.send(JSON.stringify({...data, room}));
        }
      });
    }catch(e){
      console.error('Bad message', e);
    }
  });

  ws.on('close', () => {
    // remove from rooms
    for(const r in rooms){
      rooms[r] = rooms[r].filter(s => s !== ws);
      if(rooms[r].length === 0) delete rooms[r];
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Signaling server on', PORT));
