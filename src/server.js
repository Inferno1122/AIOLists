// src/server.js

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const configureRoutes = require('./routes');

const app = express();

// Trust Vercel’s proxy headers so req.protocol and req.get('host') are correct
app.set('trust proxy', true);

// Security and parsing middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Serve static files from /public
app.use(express.static(path.join(__dirname, '..', 'public')));

// Simple health-check endpoint
app.get('/health', (_req, res) => res.status(200).send('OK'));

// Mount your Stremio addon routes (manifest, catalog, search, meta, etc.)
configureRoutes(app);

module.exports = app;
