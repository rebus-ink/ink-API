const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createSource,
  createNote
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()
  await createUser(app, token)

  const source = await createSource(app, token, {
    name: 'Source A'
  })
  const sourceUrl = source.id
  const sourceId1 = urlToId(sourceUrl)

  // create another source
  const source2 = await createSource(app, token, {
    name: 'Source B'
  })
  const sourceUrl2 = source2.id
  const sourceId2 = urlToId(sourceUrl2)

  const createNoteSimplified = async object => {
    const noteObj = Object.assign(
      {
        sourceId: sourceId1,
        body: { motivation: 'test' }
      },
      object
    )
    return await createNote(app, token, noteObj)
  }

  await createNoteSimplified({
    body: {
      motivation: 'test',
      content: 'this string contains abc and other things'
    }
  })
  await createNoteSimplified({
    body: {
      motivation: 'test',
      content: 'this string contains ABCD and other things'
    }
  })
  await createNoteSimplified({
    body: {
      motivation: 'test',
      content: 'this string contains XYABC and other things'
    },
    sourceId: sourceId2
  })
  await createNoteSimplified({
    body: {
      motivation: 'highlighting',
      content: 'abc'
    }
  })

  await tap.test('Search Note content', async () => {
    const res = await request(app)
      .get(`/notes?search=abc`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.totalItems, 4)
    await tap.equal(res.body.items.length, 4)
  })

  await createNoteSimplified({
    body: {
      motivation: 'highlighting',
      content: 'abc'
    }
  })
  await createNoteSimplified({
    body: {
      motivation: 'highlighting',
      content: 'abc'
    }
  })
  await createNoteSimplified({
    body: {
      motivation: 'highlighting',
      content: 'abc'
    }
  })
  await createNoteSimplified({
    body: {
      motivation: 'highlighting',
      content: 'abc'
    }
  })
  await createNoteSimplified({
    body: {
      motivation: 'highlighting',
      content: 'abc'
    }
  })
  await createNoteSimplified({
    body: {
      motivation: 'highlighting',
      content: 'abc'
    }
  })
  await createNoteSimplified({
    body: {
      motivation: 'highlighting',
      content: 'abc'
    }
  })
  await createNoteSimplified({
    body: {
      motivation: 'highlighting',
      content: 'abc'
    }
  })

  await tap.test('Search Note Content with pagination', async () => {
    const res = await request(app)
      .get(`/notes?search=abc&limit=11&page=2`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.totalItems, 12)
    await tap.equal(res.body.items.length, 1)
  })

  await tap.test('Search Note Content that does not exist', async () => {
    const res = await request(app)
      .get(`/notes?search=xyz`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.totalItems, 0)
    await tap.equal(res.body.items.length, 0)
  })

  await tap.test('Search Note should ignore html tags', async () => {
    const htmlNote1 = await createNoteSimplified({
      body: {
        motivation: 'highlighting',
        content: 'background'
      }
    })
    const htmlNote2 = await createNoteSimplified({
      body: {
        motivation: 'highlighting',
        content: '<style background="something">abcdefg<br/>'
      }
    })

    const res = await request(app)
      .get(`/notes?search=background`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.totalItems, 1)
    await tap.equal(res.body.items.length, 1)
    await tap.equal(res.body.items[0].id, htmlNote1.id)

    const res2 = await request(app)
      .get(`/notes?search=abcdefg`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res2.status, 200)
    await tap.ok(res2.body)
    await tap.equal(res2.body.totalItems, 1)
    await tap.equal(res2.body.items.length, 1)
    await tap.equal(res2.body.items[0].id, htmlNote2.id)
  })

  await destroyDB(app)
}

module.exports = test
