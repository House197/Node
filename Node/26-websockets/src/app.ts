import { WebSocketServer, WebSocket } from 'ws';

const wss = new WebSocketServer({ port: 3000 });

wss.on('connection', function connection(ws) {
  ws.on('error', console.error);

  console.log('Cliente conectado')

  ws.on('message', function message(data) {
    

    const payload = JSON.stringify({
        type: 'custom-message',
        payload: data.toString(),
    })
    //ws.send(JSON.stringify(payload));

    //* Todos - incluyendo
/*     wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload, { binary: false });
        }
      }); */
    
      //* Todos excluyente
      wss.clients.forEach(function each(client) {
        if (client != ws && client.readyState === WebSocket.OPEN) {
          client.send(payload, { binary: false });
        }
      });
  });

  //ws.send('Cui cui desde el servidor');

  ws.on('close', () => {
    console.log('Client disconnected')
  })
});

console.log('Server running on port 3000')