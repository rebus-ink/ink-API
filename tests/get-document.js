// test route to GET a document

const tap = require('tap')
const mocks = require('node-mocks-http')

const main = async () => {
  let router
  await tap.test('Document router exists', async () => {
    router = require('../routes/document')
  })
  await tap.type(router, 'function')

  const req = mocks.createRequest({
    method: 'GET',
    url: '/foo/publication/1/document/1',
    params: {
      nickname: 'foo',
      pubid: '1',
      docid: '1'
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
  await tap.equal(
    body.id,
    'https://reader-api.test/foo/publication/1/document/1'
  )
  await tap.equal(body.type, 'Document')
  await tap.ok(body.name)
  await tap.ok(body.content)
}

main()
