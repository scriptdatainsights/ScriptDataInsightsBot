const express = require('express');
const server = express();

server.all('/', (req, res) => {
    res.send('Bot is alive!');
});

function keepAlive() {
    server.listen(3001, () => {
        console.log('Server is ready on port 3001.');
    });
}

module.exports = keepAlive;
