const express = require('express');
const path = require('path');
const logger = require('./config/logger');

const app = express();


/*Initialize middleware*/
app.use(logger);
//body parser
app.use(express.json());
app.use(express.urlencoded({extended: false}));

/*-----------Routes-----------*/
app.use('/api/users', require('./api/users'))

app.get('/', (req, res) => {
    res.send("<h2>Server is running!</h2>");
    //res.sendFile();
})

const PORT = process.env.PORT || 5000; //separate in config file

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));