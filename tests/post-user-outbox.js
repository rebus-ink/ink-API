// test route to POST a user outbox

const tap = require('tap')
const mocks = require('node-mocks-http')

const main = async () => {
  let router
  await tap.test('Outbox router exists', async () => {
    router = require('../routes/outbox')
  })
  await tap.type(router, 'function')

  const req = mocks.createRequest({
    method: 'POST',
    url: '/foo/activity',
    params: {
      nickname: 'foo'
    },
    headers: {
      Host: 'reader-api.test',
      'Content-Type':
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
    },
    body: JSON.stringify({
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'Create',
      object: {
        type: 'Note',
        content: 'Hello, World!'
      }
    })
  })

  const res = mocks.createResponse({ req: req })

  router(req, res)

  await tap.match(
    res.getHeader('Location'),
    /https:\/\/reader-api.test\/foo\/activity\/(.*)$/
  )
  await tap.equal(res.statusCode, 201)
}

main()
