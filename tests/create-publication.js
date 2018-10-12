// test route to POST a user outbox

const tap = require('tap')
const mocks = require('node-mocks-http')
const { URL } = require('url')

const main = async () => {
  let router
  await tap.test('We can post a Create Publication activity', async () => {
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
      '@context': [
        'https://www.w3.org/ns/activitystreams',
        { reader: 'https://rebus.foundation/ns/reader' }
      ],
      type: 'Create',
      object: {
        type: 'reader:Publication',
        name: `Publication A`,
        attributedTo: {
          type: 'Person',
          name: 'Sample Author'
        },
        totalItems: 2,
        orderedItems: [
          {
            type: 'Document',
            name: 'Chapter 1',
            content: 'Sample document content 1'
          },
          {
            type: 'Document',
            name: 'Chapter 2',
            content: 'Sample document content 2'
          }
        ]
      }
    })
  })

  const res = mocks.createResponse({ req: req })

  router(req, res)

  const activity = res.getHeader('Location')

  await tap.match(activity, /https:\/\/reader-api.test\/foo\/activity\/(.*)$/)
  await tap.equal(res.statusCode, 201)

  let arouter = require('../routes/activity')

  const activityURL = new URL(activity)
  const [, actid] = activity.match(
    /https:\/\/reader-api.test\/foo\/activity\/(.*)$/
  )

  const areq = mocks.createRequest({
    method: 'GET',
    url: activityURL.pathname,
    params: {
      nickname: 'foo',
      actid: actid
    },
    headers: {
      Host: 'reader-api.test'
    }
  })

  const ares = mocks.createResponse({ req: areq })

  arouter(areq, ares)

  await tap.equal(
    ares.getHeader('Content-Type'),
    'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
  )

  const body = JSON.parse(ares._getData())

  await tap.type(body, 'object')

  await tap.ok(Array.isArray(body['@context']))
  await tap.equal(body['@context'].length, 2)
  await tap.equal(body['@context'][0], 'https://www.w3.org/ns/activitystreams')
  await tap.type(body['@context'][1], 'object')
  await tap.equal(
    body['@context'][1].reader,
    'https://rebus.foundation/ns/reader'
  )

  await tap.equal(body.id, activity)
  await tap.equal(body.type, 'Create')

  await tap.type(body.object, 'object')
  await tap.type(body.object.id, 'string')
  await tap.type(body.object.type, 'reader:Publication')
}

main()
