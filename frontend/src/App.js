import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:4000');

export default function FileMonitor() {
    const [folderPath, setFolderPath] = useState('');
    const [files, setFiles] = useState([]);
    const [fileContent, setFileContent] = useState('');
    const [isWatching, setIsWatching] = useState(false);

    useEffect(() => {
        socket.on('new-file', ({ fileName, content, isNew }) => {
            setFiles(prevFiles => {
                const updatedFiles = prevFiles.map(file => file.name === fileName ? { name: fileName, isNew } : file);
                if (!updatedFiles.some(file => file.name === fileName)) {
                    updatedFiles.push({ name: fileName, isNew });
                }
                return updatedFiles;
            });
            setFileContent(content);
        });
        socket.on('all-files', (allFiles) => {
            setFiles(allFiles.map(file => ({ name: file, isNew: false })));
        });
        return () => {
            socket.off('new-file');
            socket.off('all-files');
        };
    }, []);

    const startWatching = async () => {
        await fetch('http://localhost:4000/start-watching', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ folderPath })
        });
        setIsWatching(true);
    };

    const stopWatching = async () => {
        await fetch('http://localhost:4000/stop-watching', { method: 'POST' });
        setIsWatching(false);
    };

    return (
        <div className="container">
            <input className="input" type="text" value={folderPath} onChange={e => setFolderPath(e.target.value)} placeholder="📁 Ingrese la ruta de la carpeta" />
            <button className="btn start" onClick={startWatching} disabled={isWatching}>▶️ Iniciar</button>
            <button className="btn stop" onClick={stopWatching} disabled={!isWatching}>⏹️ Detener</button>
            <ul className="file-list">
                {files.map(file => (
                    <li key={file.name} className={file.isNew ? 'new-file' : ''}>
                        📄 {file.name} {file.isNew ? '🆕' : ''}
                    </li>
                ))}
            </ul>
            <div className="file-content">
                {fileContent ? <pre>{fileContent}</pre> : '⌛ Esperando archivos...'}
            </div>
        </div>
    );
}