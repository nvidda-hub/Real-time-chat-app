const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// set static folder
app.use(express.static(path.join(__dirname, 'public')))

const botName = 'ChatCord Bot';

// run when a client connects
io.on('connection', socket =>{

    socket.on('joinRoom', ({username, room})=>
    {
        const user = userJoin(socket.id, username, room)
        socket.join(user.room)

        // console.log("New WS connection ...");
        
        // welcome current user
        socket.emit('message', formatMessage(botName, 'Welcome to ChatCord')); // only to user who is connecting

        // broadcast when a user gets connected
        socket.broadcast.to(user.room).emit('message', formatMessage(botName,`${username} has joined the chat!!`));    // will broadcast everyone except user who is connecting

        // send users and room info
        io.to(user.room).emit('roomUsers', {
            room : user.room,
            users : getRoomUsers(user.room)
        })
    });



    // io.emit() // to broadcast message to all clients in general

    // listen for chat message
    socket.on('chatMessage', (msg)=>{
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    // runs when client disconnected
    socket.on('disconnect', ()=>{
        const user = userLeave(socket.id);
        if (user)
        {
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat!!`));
            // also when someone leave the chat send users and room info
            io.to(user.room).emit('roomUsers', {
                room : user.room,
                users : getRoomUsers(user.room)});
        }
    });

});




const PORT = 3000 || process.env.PORT;
// listen at 3000 if availble else listen process.env.PORT

server.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`);
})