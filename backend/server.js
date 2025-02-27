const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const chokidar = require('chokidar');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

let watcher = null;
let existingFiles = new Set();

app.post('/start-watching', (req, res) => {
    const { folderPath } = req.body;
    if (!fs.existsSync(folderPath)) {
        return res.status(400).json({ error: 'Carpeta no encontrada' });
    }
    if (watcher) watcher.close();
    
    watcher = chokidar.watch(folderPath, { 
        persistent: true,
        ignoreInitial: false,
        usePolling: true,
        interval: 1000,
        depth: 0
    });
    
    watcher.on('add', (filePath) => {
        if (filePath.endsWith('.txt')) {
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (!err) {
                    const fileName = path.basename(filePath);
                    const isNew = !existingFiles.has(fileName);
                    existingFiles.add(fileName);
                    io.emit('new-file', { fileName, content: data, isNew });
                }
            });
        }
    });

    const allFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.txt'));
    existingFiles = new Set(allFiles);
    io.emit('all-files', Array.from(existingFiles));
    
    res.json({ message: 'Monitoreo iniciado' });
});

app.post('/stop-watching', (req, res) => {
    if (watcher) { watcher.close(); watcher = null; }
    res.json({ message: 'Monitoreo detenido' });
});

server.listen(4000, () => console.log('Servidor corriendo en puerto 4000'));