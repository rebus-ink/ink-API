const express = require('express')
const app = express()
const morgan = require('morgan')
const URL = require('url').URL

app.use(morgan('dev'))
const prefix = new URL(process.env.DOMAIN).pathname

app.use(prefix, require('./server.js').app)
app.listen(8080, () => console.log('Listening'))
