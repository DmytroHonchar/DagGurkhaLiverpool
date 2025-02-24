const QRCode = require('qrcode');
const url = 'https://daggurkhaliverpool.onrender.com/scan'; // Updated URL

QRCode.toFile('qrcode.png', url, {
  color: {
    dark: '#000',  // Black dots
    light: '#FFF'  // White background
  }
}, function (err) {
  if (err) throw err;
  console.log('QR code saved as qrcode.png');
});
