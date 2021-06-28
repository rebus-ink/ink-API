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
      .get(`/outlines/${outline1.shortId}/docx`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
  })

  // add notes to noteContext, with source and tag
  const source = await createSource(app, token, {
    name: 'testSource',
    type: 'Article'
  })

  // header
  let note1 = await addNoteToContext(app, token, outline1.shortId, {
    body: {
      motivation: 'commenting',
      content: 'header1'
    },
    json: {
      type: 'header'
    }
  })
  console.log('note1?????', note1)

  // note with highlight and comment
  let note2 = await addNoteToContext(app, token, outline1.shortId, {
    sourceId: source.shortId,
    body: [
      {
        motivation: 'highlighting',
        content: 'This is a highlight from a source... .... .... '
      },
      {
        motivation: 'commenting',
        content: 'this is a comment on the previous highlight'
      }
    ]
  })

  // highlight only
  let note3 = await addNoteToContext(app, token, outline1.shortId, {
    sourceId: source.shortId,
    body: {
      motivation: 'highlighting',
      content: 'this is a highlight without a comment.... '
    }
  })

  // note only, linked to source
  let note4 = await addNoteToContext(app, token, outline1.shortId, {
    sourceId: source.shortId,
    body: {
      motivation: 'commenting',
      content: 'this is a comment on a source without a highlight.... ... ... '
    }
  })

  // note only, linked to source
  let note5 = await addNoteToContext(app, token, outline1.shortId, {
    body: {
      motivation: 'commenting',
      content: 'this is a note that does not belong to a source... ... ... '
    }
  })

  // order them
  note1 = await updateNote(
    app,
    token,
    Object.assign(note1, {
      next: note2.shortId
    })
  )
  note2 = await updateNote(
    app,
    token,
    Object.assign(note2, {
      previous: note1.shortId,
      next: note3.shortId
    })
  )
  note3 = await updateNote(
    app,
    token,
    Object.assign(note3, {
      previous: note2.shortId,
      next: note4.shortId
    })
  )
  note4 = await updateNote(
    app,
    token,
    Object.assign(note4, {
      previous: note3.shortId,
      next: note5.shortId
    })
  )
  note5 = await updateNote(
    app,
    token,
    Object.assign(note5, {
      previous: note4.shortId
    })
  )

  await tap.test('Get outline with notes', async () => {
    const res = await request(app)
      .get(`/outlines/${outline1.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    const body = res.body
    console.log(JSON.stringify(body.notes[0]))
  })

  await destroyDB(app)
}

module.exports = test
