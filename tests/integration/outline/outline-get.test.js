const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createNoteContext,
  addNoteToContext,
  createTag,
  createSource,
  addNoteToCollection,
  updateNote
} = require('../../utils/testUtils')
const _ = require('lodash')

const test = async app => {
  const token = getToken()
  await createUser(app, token)

  const outline1 = await createNoteContext(app, token, {
    name: 'outline1',
    description: 'description1',
    type: 'outline',
    json: { property: 'value1' }
  })

  await tap.test('Get empty outline', async () => {
    const res = await request(app)
      .get(`/outlines/${outline1.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    const body = res.body
    await tap.ok(body.id)
    await tap.equal(body.name, 'outline1')
    await tap.equal(body.description, 'description1')
    await tap.equal(body.type, 'outline')
    await tap.ok(body.json)
    await tap.equal(body.json.property, 'value1')
    // notes
    await tap.equal(body.notes.length, 0)
  })

  // add notes to noteContext, with source and tag
  const source = await createSource(app, token, {
    name: 'testSource',
    type: 'Article'
  })
  let note1 = await addNoteToContext(app, token, outline1.shortId, {
    sourceId: source.shortId,
    body: { motivation: 'test' }
  })
  let note2 = await addNoteToContext(app, token, outline1.shortId)

  const tag = await createTag(app, token, { name: 'tag1', type: 'stack' })
  await addNoteToCollection(app, token, note1.shortId, tag.id)

  await tap.test('Get outline with notes', async () => {
    const res = await request(app)
      .get(`/outlines/${outline1.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    const body = res.body
    await tap.ok(body.id)
    await tap.equal(body.name, 'outline1')
    await tap.equal(body.description, 'description1')
    await tap.equal(body.type, 'outline')
    await tap.ok(body.json)
    await tap.equal(body.json.property, 'value1')
    // notes & noteRelations
    await tap.equal(body.notes.length, 2)
    await tap.ok(body.notes[0].body)
    const bodyNote1 = _.find(body.notes, { id: note1.id })
    await tap.ok(bodyNote1.tags)
    await tap.equal(bodyNote1.tags.length, 1)
    await tap.ok(bodyNote1.source)
    await tap.equal(bodyNote1.source.name, 'testSource')
    await tap.ok(bodyNote1.source.id)
  })

  /*
  3
    9
    1
    5
  6
    7
      8
      4
    2
  */

  let note3 = await addNoteToContext(app, token, outline1.shortId)
  let note4 = await addNoteToContext(app, token, outline1.shortId)
  let note5 = await addNoteToContext(app, token, outline1.shortId)
  let note6 = await addNoteToContext(app, token, outline1.shortId)
  let note7 = await addNoteToContext(app, token, outline1.shortId)
  let note8 = await addNoteToContext(app, token, outline1.shortId)
  let note9 = await addNoteToContext(app, token, outline1.shortId)

  note1 = await updateNote(
    app,
    token,
    Object.assign(note1, {
      parentId: note3.shortId,
      previous: note9.shortId,
      next: note5.shortId
    })
  )
  note2 = await updateNote(
    app,
    token,
    Object.assign(note2, { parentId: note6.shortId, previous: note7.shortId })
  )
  note3 = await updateNote(
    app,
    token,
    Object.assign(note3, { next: note6.shortId })
  )
  note4 = await updateNote(
    app,
    token,
    Object.assign(note4, { parentId: note7.shortId, previous: note8.shortId })
  )
  note5 = await updateNote(
    app,
    token,
    Object.assign(note5, { parentId: note3.shortId, previous: note1.shortId })
  )
  note6 = await updateNote(
    app,
    token,
    Object.assign(note6, { previous: note3.shortId })
  )
  note7 = await updateNote(
    app,
    token,
    Object.assign(note7, { parentId: note6.shortId, next: note2.shortId })
  )
  note8 = await updateNote(
    app,
    token,
    Object.assign(note8, { parentId: note7.shortId, next: note4.shortId })
  )
  note9 = await updateNote(
    app,
    token,
    Object.assign(note9, { parentId: note3.shortId, next: note1.shortId })
  )

  await tap.test(
    'Get outline with notes in a nested, ordered tree',
    async () => {
      const res = await request(app)
        .get(`/outlines/${outline1.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 200)
      const body = res.body
      await tap.ok(body.id)
      await tap.equal(body.name, 'outline1')
      await tap.equal(body.description, 'description1')
      await tap.equal(body.type, 'outline')
      await tap.ok(body.json)
      await tap.equal(body.json.property, 'value1')
      // notes
      await tap.equal(body.notes.length, 2)
      await tap.equal(body.notes[0].shortId, note3.shortId)
      await tap.equal(body.notes[1].shortId, note6.shortId)
      // children of 3: 9, 1, 5
      await tap.equal(body.notes[0].children.length, 3)
      await tap.equal(body.notes[0].children[0].shortId, note9.shortId)
      await tap.equal(body.notes[0].children[1].shortId, note1.shortId)
      await tap.equal(body.notes[0].children[2].shortId, note5.shortId)
      // children of 6: 7, 2
      await tap.equal(body.notes[1].children.length, 2)
      await tap.equal(body.notes[1].children[0].shortId, note7.shortId)
      await tap.equal(body.notes[1].children[1].shortId, note2.shortId)
      // children of 7: 8, 4
      await tap.equal(body.notes[1].children[0].children.length, 2)
      await tap.equal(
        body.notes[1].children[0].children[0].shortId,
        note8.shortId
      )
      await tap.equal(
        body.notes[1].children[0].children[1].shortId,
        note4.shortId
      )
    }
  )

  /*
  3
    9
    1
    5 // next: 9
  6
    7
      8
      4
    2
  */

  note5 = await updateNote(
    app,
    token,
    Object.assign(note5, {
      parentId: note3.shortId,
      previous: note1.shortId,
      next: note9.shortId
    })
  )

  await tap.test('Try to get invalid outline', async () => {
    const res = await request(app)
      .get(`/outlines/${outline1.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.error, 'Bad Request')
    await tap.equal(error.message, 'Error: outline contains a circular list')
    await tap.equal(error.details.requestUrl, `/outlines/${outline1.shortId}`)
  })

  await tap.test('Try to get an outline that does not exist', async () => {
    const res = await request(app)
      .get(`/outlines/${outline1.shortId}abc`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 404)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.error, 'Not Found')
    await tap.equal(
      error.message,
      `Get outline Error: No Outline found with id ${outline1.shortId}abc`
    )
    await tap.equal(
      error.details.requestUrl,
      `/outlines/${outline1.shortId}abc`
    )
  })

  await destroyDB(app)
}

module.exports = test
