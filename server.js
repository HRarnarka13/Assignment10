'use strict';

// Node models
const express = require('express');
const mongoose = require('mongoose');

// Require the api file
const api = require('./api');

const port = 3000;
const app = express();

app.use('/api', api);

// Connect mongoose and then run the server.
mongoose.connect('localhost/app');
mongoose.connection.once('open', () => {
    console.log('Mongoose is connected.');
    // Run the server
    app.listen(port, () => {
        console.log('Server is on port', port);
    });
});
