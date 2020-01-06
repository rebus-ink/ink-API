const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const {
  getToken,
  createUser,
  destroyDB,
  createTag
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()
  const readerCompleteUrl = await createUser(app, token)
  const readerUrl = urlparse(readerCompleteUrl).path
  const readerId = urlToId(readerCompleteUrl)

  await tap.test('Get Tags for a reader with no tags', async () => {
    const res = await request(app)
      .get('/tags')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.equal(res.body.length, 4) // 4 default modes
  })

  await createTag(app, token, { name: 'tag1' })
  await createTag(app, token, { name: 'tag2' })

  await tap.test('Get Tags', async () => {
    const res = await request(app)
      .get('/tags')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    const body = res.body
    await tap.equal(res.body.length, 6) // 4 default modes + 2 created tags
  })

  await destroyDB(app)
}

module.exports = test
