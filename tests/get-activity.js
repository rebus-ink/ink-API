// test route to GET a document

const tap = require('tap')
const mocks = require('node-mocks-http')

const main = async () => {
  let router
  await tap.test('Document router exists', async () => {
    router = require('../routes/activity')
  })
  await tap.type(router, 'function')

  const req = mocks.createRequest({
    method: 'GET',
    url: '/foo/activity/1create',
    params: {
      nickname: 'foo',
      actid: '1create'
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

  await tap.type(body['@context'], 'object')
  await tap.ok(Array.isArray(body['@context']))

  await tap.equal(body.id, 'https://reader-api.test/foo/activity/1create')
  await tap.equal(body.type, 'Create')
  await tap.type(body.summaryMap, 'object')
  await tap.type(body.summaryMap.en, 'string')
  await tap.type(body.actor, 'object')
  await tap.type(body.actor.id, 'string')
  await tap.type(body.actor.summaryMap, 'object')
  await tap.type(body.actor.summaryMap.en, 'string')
  await tap.type(body.object, 'object')
  await tap.type(body.object.id, 'string')
  await tap.type(body.object.name, 'string')
}

main()
