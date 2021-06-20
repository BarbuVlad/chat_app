const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');
const {logger} = require('./config/logger');
const mongoose = require('mongoose');
require('dotenv/config'); // config file for DB conn
const cors = require('cors');

const formatMessage = require('./config/_messages');

const app = express();
//make websocket server:
const server_express = express();
const server = http.createServer(server_express);
const io = socketio(server);



/*Initialize middleware*/
//with app.use(middleware);
app.use(logger);
//body parser (working with encoded URLs)
app.use(express.json()); // get json data
app.use(express.urlencoded({extended: false})); //get encoded URL
app.use(cors());

//connect to mongoDB
mongoose.connect(
    process.env.DB_CONNECTION,
    {useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true},

    () => console.log("Connected to DB")
);

/*-----------Routes-----------*/
app.use('/api/users', require('./api/users'));
app.use('/api/conversations', require('./api/conversations'));
//set a static folder (the view from MVC)
server_express.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.send("<h2>Server is running!</h2>");
    //res.sendFile();
})


//Websockets server logic
io.on('connection', socket => {
    console.log('connected:', socket.id);
    //relative to room/conversation between 2 users
    socket.on('joinRoom', ({ username_a, username_b}) => {
        console.log(username_b, username_a);
        //join room with name: user_a + user_b
        //socket.join("abcdefghij");

        //Lisen for client message:
        socket.on('chatMessage', message => {
           // io.to(room).emit('message', formatMessage(username_a, message));
           io.emit('message', formatMessage(username_a, message));

        });

        //socket.broadcast.emit('message', formatMessage("Bot", "A user has joined!"));
        socket.broadcast
        //.to(room)
        .emit('message', formatMessage("Bot", `${username_a} has joined!`));


        socket.on('disconnect', () => {
            io.emit('message', formatMessage("Bot", "A user has disconnected!"));
        });
    });



  });

const PORT = process.env.PORT || 5000; //separate in config file

app.listen(PORT, () => console.log(`Server(REST API) running on port ${PORT}`));
server.listen(PORT+10, () => console.log(`Server(websockets) running on port ${PORT+10}`))