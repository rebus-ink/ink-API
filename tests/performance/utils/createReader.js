const axios = require('axios')

const createReader = async token => {
  let config = {
    headers: {
      Host: process.env.DOMAIN,
      Authorization: `Bearer ${token}`,
      'Content-type':
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
    }
  }

  return axios
    .post(
      `${process.env.DOMAIN}/readers`,
      {
        '@context': 'https://www.w3.org/ns/activitystreams',
        name: 'J. Random Reader'
      },
      config
    )
    .then(() => {
      return axios.get(`${process.env.DOMAIN}/whoami`, config)
    })
    .then(res => {
      return res.data.id
    })
    .catch(err => {
      console.log('error in createReader: ', err.toJSON())
    })
}

module.exports = createReader
