require('dotenv').config();
const http = require('http');

setInterval(() => {
    const temp = Math.random() * 5 + 30; // Random temp between 30 and 35
    const body = JSON.stringify([{
        device_id: 'C1',
        temperature: temp,
        humidity: 55,
        light_level: 1000
    }]);

    const req = http.request('http://localhost:5000/api/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
        let raw = '';
        res.on('data', d => raw += d);
        res.on('end', () => console.log(`Sent C1 temp: ${temp.toFixed(2)} °C | API Response:`, raw));
    });

    req.on('error', e => console.error('API Error:', e));

    req.write(body);
    req.end();
}, 5000);
