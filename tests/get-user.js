// test route to GET a user

const tap = require('tap')
const mocks = require('node-mocks-http')

const main = async () => {
  let router
  await tap.test('User router exists', async () => {
    router = require('../routes/user')
  })
  await tap.type(router, 'function')

  const req = mocks.createRequest({
    method: 'GET',
    url: '/foo',
    params: {
      nickname: 'foo'
    },
    headers: {
      Host: 'reader-api.test'
    }
  })

  const res = mocks.createResponse({ req: req })

  router(req, res)

  await tap.equal(
    res.getHeader('Content-Type'),
    'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
  )

  const body = JSON.parse(res._getData())

  await tap.equal(body['@context'], 'https://www.w3.org/ns/activitystreams')
  await tap.equal(body.id, 'https://reader-api.test/foo')
  await tap.equal(body.type, 'Person')
  await tap.equal(body.outbox, 'https://reader-api.test/foo/activity')
  await tap.equal(body.streams, 'https://reader-api.test/foo/streams')
  await tap.equal(typeof body.followers, 'undefined')
  await tap.equal(typeof body.following, 'undefined')
}

main()
