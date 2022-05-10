const ws = require('ws');
var express = require('express');
var app = express();

app.use(require('morgan')('dev'));
app.use(express.static(__dirname + '/public'));

app.get('/wordbank', (req, res) => {
    const wordBank = require(__dirname + '/public/js/easy_5.json')
    res.send(wordBank)
});

/* TikTok connector */
let socketStates = {};
const { WebcastPushConnection } = require('tiktok-live-connector'); 
// Username of someone who is currently live
let tiktokUsername = "guess_the_word_game";
// Create a new wrapper object and pass the username
let tiktokChatConnection = new WebcastPushConnection(tiktokUsername);

tiktokChatConnection.connect().then(state => {
    console.info(`Connected to roomId ${state.roomId}`);
}).catch(err => {
    console.error('Failed to connect', err);
})
/* */

const wsServer = new ws.Server({ noServer: true });
wsServer.on('connection', socket => {
    console.log("Client connected");

    socket.on('message', function message(data) {
        console.log('received: %s', JSON.parse(data));
    });
});

const server = app.listen(process.env.PORT || 80);
server.on('upgrade', (request, socket, head) => {
    wsServer.handleUpgrade(request, socket, head, socket => {
        wsServer.emit('connection', socket, request);
    });
});

function sendAllClients(payload) {
    console.log(payload);
    wsServer.clients.forEach(function each(client) {
        if (client.readyState === ws.WebSocket.OPEN) {
            client.send(payload);
        }
    });
}

tiktokChatConnection.on('like', data => {
    let resp = {
        event: "like",
        nickname: data.nickname,
        uniqueId: data.uniqueId,
        count: data.likeCount
    }
    sendAllClients(JSON.stringify(resp));
})

tiktokChatConnection.on('chat', data => {
    let resp = {
        event: "chat",
        nickname: data.nickname,
        uniqueId: data.uniqueId,
        comment: data.comment,
        picture: data.profilePictureUrl
    }
    sendAllClients(JSON.stringify(resp));
});

tiktokChatConnection.on('social', data => {
    let resp = {
        event: "follow",
        nickname: data.nickname,
        uniqueId: data.uniqueId,
        picture: data.profilePictureUrl
    }
    sendAllClients(JSON.stringify(resp));
});
