const request = require('request')
const util = require('util')

const requestPost = util.promisify(request.post)

const createReader = async token => {
  return requestPost(`${process.env.DOMAIN}/readers`, {
    auth: {
      bearer: token
    },
    headers: {
      //   Host: process.eventNames.DOMAIN,
      'content-type':
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
    },
    body: JSON.stringify({
      name: 'J. Random Reader',
      '@context': 'https://www.w3.org/ns/activitystreams'
    })
  })
    .then(res => {
      return res.headers.location
    })
    .catch(err => {
      console.log('create reader error: ', err)
    })
}

module.exports = createReader
