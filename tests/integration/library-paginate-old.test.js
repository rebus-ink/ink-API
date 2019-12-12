const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const {
  getToken,
  createUser,
  destroyDB,
  createPublication
} = require('../utils/utils')
const app = require('../../server').app

const test = async () => {
  const token = getToken()
  const readerCompleteUrl = await createUser(app, token)
  const readerUrl = urlparse(readerCompleteUrl).path

  const createPublicationSimplified = async object => {
    return await createPublication(readerUrl, object)
  }

  await createPublicationSimplified({ name: 'Publication 1' })
  await createPublicationSimplified({ name: 'Publication 2' })
  await createPublicationSimplified({ name: 'Publication 3' })
  await createPublicationSimplified({ name: 'Publication 4' })
  await createPublicationSimplified({ name: 'Publication 5' })
  await createPublicationSimplified({ name: 'Publication 6' })
  await createPublicationSimplified({ name: 'Publication 7' })
  await createPublicationSimplified({ name: 'Publication 8' })
  await createPublicationSimplified({ name: 'Publication 9' })
  await createPublicationSimplified({ name: 'Publication 10' })
  await createPublicationSimplified({ name: 'Publication 11' })
  await createPublicationSimplified({ name: 'Publication 12' })
  await createPublicationSimplified({ name: 'Publication 13' })

  await tap.test('By default, Library paginated to 10 per page', async () => {
    const res = await request(app)
      .get(`${readerUrl}/library`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.equal(body.totalItems, 13)
    await tap.ok(Array.isArray(body.items))
    // documents should include:
    await tap.equal(body.items.length, 10)
    await tap.equal(body.items[0].name, 'Publication 13')
    await tap.equal(body.items[9].name, 'Publication 4')
    await tap.equal(body.page, 1)
    await tap.equal(body.pageSize, 10)
  })

  await tap.test('Paginate library by setting limit', async () => {
    const res = await request(app)
      .get(`${readerUrl}/library?limit=11`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.equal(body.totalItems, 13)
    await tap.ok(Array.isArray(body.items))
    // documents should include:
    await tap.equal(body.items.length, 11)
    await tap.equal(body.items[0].name, 'Publication 13')
    await tap.equal(body.items[9].name, 'Publication 4')
    await tap.equal(body.page, 1)
    await tap.equal(body.pageSize, 11)
  })

  await tap.test('Paginate Library by setting page', async () => {
    const res = await request(app)
      .get(`${readerUrl}/library?page=2`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.equal(body.totalItems, 13)
    await tap.ok(Array.isArray(body.items))
    // documents should include:
    await tap.equal(body.items.length, 3)
    await tap.equal(body.items[0].name, 'Publication 3')
    await tap.equal(body.items[2].name, 'Publication 1')
    await tap.equal(body.page, 2)
    await tap.equal(body.pageSize, 10)
  })

  await tap.test('Paginate Library by setting limit and page', async () => {
    const res = await request(app)
      .get(`${readerUrl}/library?limit=11&page=2`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.equal(body.totalItems, 13)
    await tap.ok(Array.isArray(body.items))
    // documents should include:
    await tap.equal(body.items.length, 2)
    await tap.equal(body.items[0].name, 'Publication 2')
    await tap.equal(body.items[1].name, 'Publication 1')
    await tap.equal(body.page, 2)
    await tap.equal(body.pageSize, 11)
  })

  await tap.test(
    'Paginate Library with limit over the number of publications',
    async () => {
      const res = await request(app)
        .get(`${readerUrl}/library?limit=20`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type(
          'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
        )

      await tap.equal(res.statusCode, 200)

      const body = res.body
      await tap.type(body, 'object')
      await tap.equal(body.totalItems, 13)
      await tap.ok(Array.isArray(body.items))
      // documents should include:
      await tap.equal(body.items.length, 13)
      await tap.equal(body.items[0].name, 'Publication 13')
      await tap.equal(body.items[12].name, 'Publication 1')
      await tap.equal(body.page, 1)
      await tap.equal(body.pageSize, 20)
    }
  )

  await tap.test('Get empty page of a Library', async () => {
    const res = await request(app)
      .get(`${readerUrl}/library?page=3`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.equal(body.totalItems, 13)
    await tap.ok(Array.isArray(body.items))
    await tap.equal(body.items.length, 0)
    await tap.equal(body.page, 3)
    await tap.equal(body.pageSize, 10)
  })

  await tap.test(
    'Library page size under 10 should default to 10',
    async () => {
      const res = await request(app)
        .get(`${readerUrl}/library?limit=4`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type(
          'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
        )

      await tap.equal(res.statusCode, 200)

      const body = res.body
      await tap.type(body, 'object')
      await tap.equal(body.totalItems, 13)
      await tap.ok(Array.isArray(body.items))
      await tap.equal(body.items.length, 10)
      await tap.equal(body.page, 1)
      await tap.equal(body.pageSize, 10)
    }
  )

  await tap.test('Library page size of 0 should default to 10', async () => {
    const res = await request(app)
      .get(`${readerUrl}/library?limit=0`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.equal(body.totalItems, 13)
    await tap.ok(Array.isArray(body.items))
    await tap.equal(body.items.length, 10)
    await tap.equal(body.page, 1)
    await tap.equal(body.pageSize, 10)
  })

  await tap.test(
    'Library page size of over 100 should default to 100',
    async () => {
      // create many more publications
      await createPublicationSimplified({ name: 'Publication 14' })
      await createPublicationSimplified({ name: 'Publication 15' })
      await createPublicationSimplified({ name: 'Publication 16' })
      await createPublicationSimplified({ name: 'Publication 17' })
      await createPublicationSimplified({ name: 'Publication 18' })
      await createPublicationSimplified({ name: 'Publication 19' })
      await createPublicationSimplified({ name: 'Publication 20' })
      // 20
      await createPublicationSimplified({ name: 'Publication 21' })
      await createPublicationSimplified({ name: 'Publication 22' })
      await createPublicationSimplified({ name: 'Publication 23' })
      await createPublicationSimplified({ name: 'Publication 24' })
      await createPublicationSimplified({ name: 'Publication 25' })
      await createPublicationSimplified({ name: 'Publication 26' })
      await createPublicationSimplified({ name: 'Publication 27' })
      await createPublicationSimplified({ name: 'Publication 28' })
      await createPublicationSimplified({ name: 'Publication 29' })
      await createPublicationSimplified({ name: 'Publication 30' })
      // 30
      await createPublicationSimplified({ name: 'Publication 31' })
      await createPublicationSimplified({ name: 'Publication 32' })
      await createPublicationSimplified({ name: 'Publication 33' })
      await createPublicationSimplified({ name: 'Publication 34' })
      await createPublicationSimplified({ name: 'Publication 35' })
      await createPublicationSimplified({ name: 'Publication 36' })
      await createPublicationSimplified({ name: 'Publication 37' })
      await createPublicationSimplified({ name: 'Publication 38' })
      await createPublicationSimplified({ name: 'Publication 39' })
      await createPublicationSimplified({ name: 'Publication 40' })
      // 40
      await createPublicationSimplified({ name: 'Publication 41' })
      await createPublicationSimplified({ name: 'Publication 42' })
      await createPublicationSimplified({ name: 'Publication 43' })
      await createPublicationSimplified({ name: 'Publication 44' })
      await createPublicationSimplified({ name: 'Publication 45' })
      await createPublicationSimplified({ name: 'Publication 46' })
      await createPublicationSimplified({ name: 'Publication 47' })
      await createPublicationSimplified({ name: 'Publication 48' })
      await createPublicationSimplified({ name: 'Publication 49' })
      await createPublicationSimplified({ name: 'Publication 50' })
      // 50
      await createPublicationSimplified({ name: 'Publication 51' })
      await createPublicationSimplified({ name: 'Publication 52' })
      await createPublicationSimplified({ name: 'Publication 53' })
      await createPublicationSimplified({ name: 'Publication 54' })
      await createPublicationSimplified({ name: 'Publication 55' })
      await createPublicationSimplified({ name: 'Publication 56' })
      await createPublicationSimplified({ name: 'Publication 57' })
      await createPublicationSimplified({ name: 'Publication 58' })
      await createPublicationSimplified({ name: 'Publication 59' })
      await createPublicationSimplified({ name: 'Publication 60' })
      // 60
      await createPublicationSimplified({ name: 'Publication 61' })
      await createPublicationSimplified({ name: 'Publication 62' })
      await createPublicationSimplified({ name: 'Publication 63' })
      await createPublicationSimplified({ name: 'Publication 64' })
      await createPublicationSimplified({ name: 'Publication 65' })
      await createPublicationSimplified({ name: 'Publication 66' })
      await createPublicationSimplified({ name: 'Publication 67' })
      await createPublicationSimplified({ name: 'Publication 68' })
      await createPublicationSimplified({ name: 'Publication 69' })
      await createPublicationSimplified({ name: 'Publication 70' })
      // 70
      await createPublicationSimplified({ name: 'Publication 71' })
      await createPublicationSimplified({ name: 'Publication 72' })
      await createPublicationSimplified({ name: 'Publication 73' })
      await createPublicationSimplified({ name: 'Publication 74' })
      await createPublicationSimplified({ name: 'Publication 75' })
      await createPublicationSimplified({ name: 'Publication 76' })
      await createPublicationSimplified({ name: 'Publication 77' })
      await createPublicationSimplified({ name: 'Publication 78' })
      await createPublicationSimplified({ name: 'Publication 79' })
      await createPublicationSimplified({ name: 'Publication 80' })
      // 80
      await createPublicationSimplified({ name: 'Publication 81' })
      await createPublicationSimplified({ name: 'Publication 82' })
      await createPublicationSimplified({ name: 'Publication 83' })
      await createPublicationSimplified({ name: 'Publication 84' })
      await createPublicationSimplified({ name: 'Publication 85' })
      await createPublicationSimplified({ name: 'Publication 86' })
      await createPublicationSimplified({ name: 'Publication 87' })
      await createPublicationSimplified({ name: 'Publication 88' })
      await createPublicationSimplified({ name: 'Publication 89' })
      await createPublicationSimplified({ name: 'Publication 90' })
      // 90
      await createPublicationSimplified({ name: 'Publication 91' })
      await createPublicationSimplified({ name: 'Publication 92' })
      await createPublicationSimplified({ name: 'Publication 93' })
      await createPublicationSimplified({ name: 'Publication 94' })
      await createPublicationSimplified({ name: 'Publication 95' })
      await createPublicationSimplified({ name: 'Publication 96' })
      await createPublicationSimplified({ name: 'Publication 97' })
      await createPublicationSimplified({ name: 'Publication 98' })
      await createPublicationSimplified({ name: 'Publication 99' })
      await createPublicationSimplified({ name: 'Publication 100' })
      // 100
      await createPublicationSimplified({ name: 'Publication 101' })
      await createPublicationSimplified({ name: 'Publication 102' })
      await createPublicationSimplified({ name: 'Publication 103' })
      await createPublicationSimplified({ name: 'Publication 104' })
      await createPublicationSimplified({ name: 'Publication 105' })
      await createPublicationSimplified({ name: 'Publication 106' })
      await createPublicationSimplified({ name: 'Publication 107' })
      await createPublicationSimplified({ name: 'Publication 108' })
      await createPublicationSimplified({ name: 'Publication 109' })
      await createPublicationSimplified({ name: 'Publication 110' })
      // 110

      const res = await request(app)
        .get(`${readerUrl}/library?limit=120`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type(
          'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
        )

      await tap.equal(res.statusCode, 200)

      const body = res.body
      await tap.type(body, 'object')
      await tap.equal(body.totalItems, 110)
      await tap.ok(Array.isArray(body.items))
      await tap.equal(body.items.length, 100)
      await tap.equal(body.page, 1)
      await tap.equal(body.pageSize, 100)
    }
  )

  await tap.test(
    'Trying to paginate library with invalid limit (string)',
    async () => {
      const res = await request(app)
        .get(`${readerUrl}/library?limit=notANumber`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type(
          'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
        )

      await tap.equal(res.statusCode, 200)

      const body = res.body
      await tap.type(body, 'object')
      await tap.equal(body.totalItems, 110)
      await tap.ok(Array.isArray(body.items))
      await tap.equal(body.items.length, 10)
      await tap.equal(body.page, 1)
      await tap.equal(body.pageSize, 10)
    }
  )

  await tap.test(
    'Trying to paginate library with invalid page (string)',
    async () => {
      const res = await request(app)
        .get(`${readerUrl}/library?page=notANumber`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type(
          'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
        )

      await tap.equal(res.statusCode, 200)

      const body = res.body
      await tap.type(body, 'object')
      await tap.equal(body.totalItems, 110)
      await tap.ok(Array.isArray(body.items))
      await tap.equal(body.items.length, 10)
      await tap.equal(body.page, 1)
      await tap.equal(body.pageSize, 10)
    }
  )

  await destroyDB(app)
}

module.exports = test
