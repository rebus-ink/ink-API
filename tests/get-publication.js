// test route to GET a user

const tap = require('tap')
const mocks = require('node-mocks-http')

const main = async () => {
  let router
  await tap.test('User router exists', async () => {
    router = require('../routes/publication')
  })
  await tap.type(router, 'function')

  const req = mocks.createRequest({
    method: 'GET',
    url: '/foo/publication/1',
    params: {
      nickname: 'foo',
      pubid: '1'
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

  await tap.ok(Array.isArray(body['@context']))
  await tap.equal(body['@context'].length, 2)
  await tap.equal(body['@context'][0], 'https://www.w3.org/ns/activitystreams')
  await tap.type(body['@context'][1], 'object')
  await tap.equal(
    body['@context'][1].reader,
    'https://rebus.foundation/ns/reader'
  )

  await tap.equal(body.id, 'https://reader-api.test/foo/publication/1')
  await tap.equal(body.type, 'reader:Publication')
  await tap.ok(body.name)
  await tap.ok(body.attributedTo)
  await tap.ok(Array.isArray(body.orderedItems))
  await tap.ok(body.orderedItems.length > 0)

  for (let i = 0; i < body.orderedItems.length; i++) {
    let item = body.orderedItems[i]
    await tap.type(item, 'object')
    await tap.match(
      item.id,
      /^https:\/\/reader-api.test\/foo\/publication\/1\/document/
    )
    await tap.equal(item.type, 'Document')
    await tap.ok(item.name)
  }
}

main()
