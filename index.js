const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');
const {logger} = require('./config/logger');
const mongoose = require('mongoose');
require('dotenv/config'); // config file for DB conn
const cors = require('cors');

const app = express();

const {startWebSocketsServer} = require('./websockets_server/ws_server');
startWebSocketsServer();

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
//set a static folder
//server_express.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.send("<h2>Server is running!</h2>");
    //res.sendFile();
})


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`\n********************\nREST API SERVER RUNNING ON ${PORT}\n********************\n`));