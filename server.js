// Dependencies
var express = require('express')
var fs = require('fs')
var app = express()

// Middleware
app.use(express.static('public'))

// Endpoints
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/index.html')
})

// Initialize Server
app.listen(3000, function() {
    console.log('App listening on port 3000!')
})