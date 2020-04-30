const express = require('express')
const axios = require('axios')
const cors = require('cors')
const port = process.env.PORT || 3001

// Configure app to use bodyParser to parse json data
const app = express()

// whitelisted domains
const WHITELISTED_DOMAINS = process.env.WHITELISTED_DOMAINS

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin
      // (like mobile apps or curl requests)
      if (!origin) return callback(null, true)
      if (WHITELISTED_DOMAINS.split(',').indexOf(origin) === -1) {
        var msg = `The CORS policy for this site does not allow access from the specified ${origin}.`
        return callback(new Error(msg), false)
      }
      return callback(null, true)
    },
  })
)

const server = require('http').createServer(app)
require('dotenv').config()

// custom HTTP headers for authenticating requests sent to Algolia places server
const HEADERS = {
  'X-Algolia-Application-Id': process.env.REACT_APP_ALGOLIA_PLACES_APP_ID || '',
  'X-Algolia-API-Key': process.env.REACT_APP_ALGOLIA_PLACES_API_KEY || '',
}
const DARKSKY_API_KEY = process.env.REACT_APP_DARKSKY_API_KEY

// Test server is working (GET http://localhost:3001/)
app.get('/', function (req, res) {
  const host = req.get('host')
  res.json({
    message: 'Welcome to the Weather React application API!',
    host: host,
  })
})

// Fetch weather forecast based on latlong
app.get('/forecast/coords/:latlong', (req, res) => {
  const {latlong} = req.params
  const url = `https://api.darksky.net/forecast/${DARKSKY_API_KEY}/${latlong}?extend=hourly&exclude=minutely,flags`
  axios
    .get(url)
    .then((response) => {
      const data = response.data
      res.status(200)
      res.send({
        data,
      })
    })
    .catch((err) => {
      res.status(err.response ? err.response.status : 500)
      res.send(err.message || 'Something went wrong! Please try again later.')
    })
})

// Fetch address based on latlong
app.get('/address/coords/:latlong', (req, res) => {
  const {latlong} = req.params
  const url = `https://places-dsn.algolia.net/1/places/reverse?aroundLatLng=${latlong},&hitsPerPage=1&language=en`
  axios
    .get(url, {headers: HEADERS})
    .then((response) => {
      const data = response.data
      res.status(200)
      res.send({
        data,
      })
    })
    .catch((err) => {
      res.status(err.response ? err.response.status : 500)
      res.send(err.message || 'Something went wrong! Please try again later.')
    })
})

// Fetch address list based on query
app.get('/places/query/:city/:latlong', (req, res) => {
  const {city, latlong} = req.params
  axios
    .request({
      url: 'https://places-dsn.algolia.net/1/places/query',
      method: 'post',
      data: {
        query: city,
        type: 'city',
        aroundLatLng: latlong,
      },
      headers: HEADERS,
    })
    .then((response) => {
      const data = response.data
      res.status(200)
      res.send({
        data,
      })
    })
    .catch((err) => {
      res.status(err.response ? err.response.status : 500)
      res.send(err.message || 'Something went wrong! Please try again later.')
    })
})

// Start the server
server.listen(port)
console.log('Server is listening on port ' + port)
