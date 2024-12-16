import express from 'express';
import cors from 'cors';
import logger from 'morgan';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import { createServer } from 'http';
import DBConnector from './DBconnector.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT ?? 3000;

const app = express();
const server = createServer(app);

const io = new Server(server, {
    cors: {
        //origin: "http://localhost:5173",
        origin: ["http://localhost:5173", "http://192.168.237.93:5173"],  
        methods: ["GET", "POST"],
        credentials: true,
    }
});

app.use(cors({
    //origin: 'http://localhost:5173',
    origin: ['http://localhost:5173', 'http://192.168.237.93:5173'],
    methods: ['GET', 'POST'],
    credentials: true,
}));

io.on('connection', (socket) => {
    console.log('A user connected!');

    socket.on('disconnect', () => {
        console.log('A user has disconnected');
    });

    socket.on('chat message', async (data) => {
        const { msg, user, createdAt, participants } = data;

        try {
            const chat = await DBConnector.findOne('chats', {
                participantes: { $all: participants, $size: 2 }
            });

            if (chat) {
                await DBConnector.db.collection('chats').updateOne(
                    { _id: chat._id },
                    { $push: { mensajes: { texto: msg, remitente: user, creado: createdAt } } }
                );

                io.emit('chat message', { msg, user, createdAt, participants });
            }
        } catch (e) {
            console.error('Error handling chat message:', e);
        }
    });

    socket.on('create chat', async (participants) => {
        try {
            const existingChat = await DBConnector.findOne('chats', {
                participantes: { $all: participants, $size: 2 }
            });

            if (!existingChat) {
                await DBConnector.insertOne('chats', { participantes: participants, mensajes: [] });
                socket.emit('chat created', participants);
            } else {
                socket.emit('chat exists', participants);
            }
        } catch (e) {
            console.error('Error creating chat:', e);
        }
    });

    socket.on('get chats', async (userId) => {
        try {
            const chats = await DBConnector.find('chats', { participantes: userId });
            socket.emit('chats', chats);
        } catch (e) {
            console.error('Error getting chats:', e);
        }
    });
});

app.use(logger('dev'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

server.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
});
