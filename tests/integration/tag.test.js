const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const {
  getToken,
  createUser,
  destroyDB,
  getActivityFromUrl
} = require('./utils')

const test = async app => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const token = getToken()
  const userId = await createUser(app, token)
  const userUrl = urlparse(userId).path
  let noteUrl
  let activityUrl

  // const resActivity = await request(app)
  //   .post(`${userUrl}/activity`)
  //   .set('Host', 'reader-api.test')
  //   .set('Authorization', `Bearer ${token}`)
  //   .type(
  //     'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
  //   )
  //   .send(
  //     JSON.stringify({
  //       '@context': [
  //         'https://www.w3.org/ns/activitystreams',
  //         { reader: 'https://rebus.foundation/ns/reader' }
  //       ],
  //       type: 'Create',
  //       object: {
  //         type: 'reader:Publication',
  //         name: 'Publication A',
  //         attributedTo: [
  //           {
  //             type: 'Person',
  //             name: 'Sample Author'
  //           }
  //         ],
  //         totalItems: 2,
  //         attachment: [
  //           {
  //             type: 'Document',
  //             name: 'Chapter 1',
  //             content: 'Sample document content 1',
  //             position: 0
  //           }
  //         ]
  //       }
  //     })
  //   )

  // const pubActivityUrl = resActivity.get('Location')
  // const pubActivityObject = await getActivityFromUrl(app, pubActivityUrl, token)
  // const publicationUrl = pubActivityObject.object.id
  // const resPublication = await request(app)
  //   .get(urlparse(publicationUrl).path)
  //   .set('Host', 'reader-api.test')
  //   .set('Authorization', `Bearer ${token}`)
  //   .type(
  //     'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
  //   )
  // const documentUrl = resPublication.body.orderedItems[0].id

  await tap.test('Create Tag', async () => {
    const res = await request(app)
      .post(`${userUrl}/activity`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
      .send(
        JSON.stringify({
          '@context': [
            'https://www.w3.org/ns/activitystreams',
            { reader: 'https://rebus.foundation/ns/reader' }
          ],
          type: 'Create',
          object: {
            type: 'reader:Stack',
            name: 'mystack'
          }
        })
      )

    await tap.equal(res.status, 201)
    await tap.type(res.get('Location'), 'string')
    activityUrl = res.get('Location')
  })

  await tap.test('Get tag when fetching library', async () => {
    const res = await request(app)
      .get(`${userUrl}/library`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(res.status, 200)
    const body = res.body
    await tap.ok(Array.isArray(body.tags))
    await tap.type(body.tags[0].name, 'string')
  })

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
