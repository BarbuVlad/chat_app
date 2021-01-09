const express = require('express');
const path = require('path');
const {logger} = require('./config/logger');
const mongoose = require('mongoose');
require('dotenv/config'); // config file for DB conn
const cors = require('cors');

const app = express();


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
app.use('/api/users', require('./api/users'))

app.get('/', (req, res) => {
    res.send("<h2>Server is running!</h2>");
    //res.sendFile();
})

const PORT = process.env.PORT || 5000; //separate in config file

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));