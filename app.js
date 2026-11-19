// All imports
const express = require('express')
const mongoose = require('mongoose')
const flash = require('connect-flash')
const authRoute = require('./route/auth')
const adminRoute = require('./route/admin')
const companyRouter = require('./route/company')
const userRouter = require('./route/user')
const path = require('path')
const bcrypt = require('bcryptjs')
const fs = require('fs')
const cors = require('cors')
const User = require('./model/User')
const AppConfig = require('./model/AppConfig')

require('dotenv').config()

const app = express()

const MongoURL = process.env.MONGODB_URL
const port = process.env.PORT || 4000

// Define public directory
const publicDir = path.join(__dirname, 'public')
const imageDir = path.join(publicDir, 'company_logo')

const dns = require('dns')

dns.setServers(['0.0.0.0', '1.1.1.1'])

// Ensure /public/company_logo folder exists
if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, {
    recursive: true
  })
}

const uploadDir = './public/uploads/complain'

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// Middleware
app.use(
  cors({
    origin: '*', // allow requests from any origin
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
  })
)

app.use(
  express.json({
    limit: '50mb'
  })
)
app.use(
  express.urlencoded({
    extended: true,
    limit: '50mb'
  })
)

app.use(flash())

// Serve static files (accessible at /public/...)
app.use('/public', express.static(publicDir))

// Routes
app.use('/api/auth', authRoute)
app.use('/api/admin', adminRoute)
app.use('/api/company', companyRouter)
app.use('/api/user', userRouter)

// Simple test route
app.get('/ping', (req, res) => {
  res.send('pong')
})

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error)
  res.status(error.statusCode || 500).json({
    status: 'Failure',
    statusCode: error.statusCode || 500,
    message: error.message || 'Internal Server Error'
  })
})

// Start server (listen regardless of Mongo status)
mongoose
  .connect(MongoURL)
  .then(() => {
    app.listen(port, () => {
      console.log(`Server started on http://localhost:${port}`)
    })
  })
  .catch(err => {
    console.error('MongoDB connection error:', err)
  })
