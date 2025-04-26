const net = require('net');

const client = new net.Socket();

client.connect(15617, 'yamanote.proxy.rlwy.net', () => {
  console.log('✅ PORTA ABERTA! Conexão TCP estabelecida.');
  client.destroy();
});

client.on('error', (err) => {
  console.log('❌ PORTA BLOQUEADA/INACESSÍVEL. Erro:', err.code);
});