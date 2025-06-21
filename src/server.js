// src/server.js

// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const configureRoutes = require('./routes');

// Create the Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes
configureRoutes(app);

// ✅ Vercel expects a default export of the app (Express instance)
module.exports = app; 
