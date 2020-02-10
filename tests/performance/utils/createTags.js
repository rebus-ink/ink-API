const crypto = require('crypto')
const request = require('request')
const util = require('util')

const requestPost = util.promisify(request.post)

const createTags = async (token, readerUrl, number = 1) => {
  let promises = []

  for (let i = 0; i < number; i++) {
    promises.push(
      requestPost(`${readerUrl}/activity`, {
        body: JSON.stringify({
          type: 'Create',
          object: {
            type: 'stack',
            name: crypto.randomBytes(8).toString('hex')
          }
        }),
        auth: {
          bearer: token
        },
        headers: {
          'content-type': 'application/ld+json'
        }
      })
    )
  }

  await Promise.all(promises)
}

module.exports = createTags
