// test route to GET a user

const tap = require('tap')
const mocks = require('node-mocks-http')

const main = async () => {
  let router
  await tap.test('User router exists', async () => {
    router = require('../routes/user-library')
  })
  await tap.type(router, 'function')

  const req = mocks.createRequest({
    method: 'GET',
    url: '/foo/library',
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

  await tap.ok(body['@context'])
  await tap.equal(body.id, 'https://reader-api.test/foo/library')
  await tap.equal(body.type, 'Collection')
  await tap.ok(Array.isArray(body.items))
  await tap.ok(body.items.length > 0)

  for (let i = 0; i < body.items.length; i++) {
    let item = body.items[i]
    await tap.type(item, 'object')
    await tap.match(item.id, /^https:\/\/reader-api.test\/foo\/publication/)
    await tap.equal(item.type, 'reader:Publication')
    await tap.ok(item.name)
    await tap.ok(item.attributedTo)
  }
}

main()
