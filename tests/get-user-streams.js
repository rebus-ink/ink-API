// test route to GET a user

const tap = require('tap')
const mocks = require('node-mocks-http')

const main = async () => {
  let router
  await tap.test('User router exists', async () => {
    router = require('../routes/user-streams')
  })
  await tap.type(router, 'function')

  const req = mocks.createRequest({
    method: 'GET',
    url: '/foo/streams',
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

  await tap.type(body, 'object')

  await tap.equal(body['@context'], 'https://www.w3.org/ns/activitystreams')
  await tap.equal(body.id, 'https://reader-api.test/foo/streams')
  await tap.equal(body.type, 'Collection')
  await tap.ok(Array.isArray(body.items))
  await tap.ok(body.items.length > 0)

  const [library] = body.items.filter(
    item => item.id === 'https://reader-api.test/foo/library'
  )

  await tap.type(library, 'object')

  await tap.equal(library.id, 'https://reader-api.test/foo/library')
  await tap.equal(library.type, 'Collection')
}

main()
