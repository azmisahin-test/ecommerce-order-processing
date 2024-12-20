// websocket\index.js
const WebSocket = require('ws');
const express = require('express');

// Express App
const app = express();

// WebSocket server'ı başlat
const wss = new WebSocket.Server({ noServer: true });

// WebSocket bağlantıları saklamak için bir Map
const connections = new Map();

// WebSocket bağlantısı kurulduğunda
wss.on('connection', (ws, req) => {
  // URL'den jobId alınıyor
  const jobId = req.url.split('/').pop();
  connections.set(jobId, ws);

  // WebSocket üzerinden mesaj alındığında
  ws.on('message', (message) => {
    console.log(`Job ${jobId}: ${message}`);
    
    // Gelen mesaja göre işlem yapabiliriz, örneğin:
    // Eğer mesaj bir güncelleme ise, bunu ilgili client'a iletebiliriz
    if (message === 'status-update') {
      ws.send(JSON.stringify({ status: 'İşlem devam ediyor', jobId }));
    }
  });

  // WebSocket bağlantısı kapandığında bağlantıyı temizle
  ws.on('close', () => {
    connections.delete(jobId);
  });

  // WebSocket bağlantısı hatası durumunda (örneğin, client bağlantısı koparsa)
  ws.on('error', (err) => {
    console.error(`WebSocket hatası Job ${jobId}: ${err}`);
  });

  // Sağlık kontrolü mesajı
  ws.send(JSON.stringify({ status: 'Bağlantı kuruldu', jobId }));
});

// WebSocket server'ını HTTP server'a bağla
app.server = app.listen(4000, () => {
  console.log('WebSocket server çalışıyor: http://localhost:4000');
});

// HTTP sunucusu upgrade isteğini alacak ve WebSocket sunucusuna yönlendirecek
app.server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

// Sağlık kontrolü için bir HTTP endpoint
app.get('/health', (req, res) => {
  res.status(200).send('WebSocket server sağlıklı');
});
