const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const {
  getToken,
  createUser,
  destroyDB,
  createPublication,
  getActivityFromUrl
} = require('../utils/utils')

const test = async app => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const token = getToken()
  const readerCompleteUrl = await createUser(app, token)
  const readerUrl = urlparse(readerCompleteUrl).path

  // create publication
  const resActivity = await createPublication(app, token, readerUrl)
  const pubActivityUrl = resActivity.get('Location')
  const pubActivityObject = await getActivityFromUrl(app, pubActivityUrl, token)
  const publicationId = pubActivityObject.object.id

  await tap.test('Create Document', async () => {
    const res = await request(app)
      .post(`${readerUrl}/activity`)
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
            type: 'Document',
            publicationId,
            mediaType: 'text/html',
            url: 'http://somewhere.com',
            documentPath: '/document/path'
          }
        })
      )

    await tap.equal(res.status, 201)
    await tap.type(res.get('Location'), 'string')
    activityUrl = res.get('Location')
  })

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
