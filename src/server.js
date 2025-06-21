// src/server.js

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const configureRoutes = require('./routes');

const app = express();

app.set('trust proxy', true);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/health', (_req, res) => res.status(200).send('OK'));

configureRoutes(app);

module.exports = app;
