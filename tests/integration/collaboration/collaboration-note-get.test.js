const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createNotebook,
  addSourceToNotebook,
  createSource,
  addNoteToNotebook,
  addTagToNotebook,
  createTag,
  createNote,
  createCanvas,
  createNoteContext,
  addSourceToCollection,
  addNoteToCollection,
  createCollaborator,
  createReader
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  // owner, collab1, collab2
  const token = getToken()
  const owner = await createReader(app, token)
  const token2 = getToken()
  const collab1 = await createReader(app, token2) // will be pending
  const token3 = getToken()
  const collab2 = await createReader(app, token3) // will be accepted

  const notebook = await createNotebook(app, token, {
    name: 'notebook1',
    status: 'archived',
    description: 'test',
    settings: {
      property: 'value'
    }
  })

  const collabObject1 = await createCollaborator(app, token, notebook.shortId, {
    readerId: collab1.shortId,
    status: 'pending',
    permission: { read: true }
  })

  const collabObject2 = await createCollaborator(app, token, notebook.shortId, {
    readerId: collab2.shortId,
    status: 'accepted',
    permission: { read: true }
  })

  // add sources to the notebook
  const note1 = await createNote(app, token, {
    body: { content: 'something', motivation: 'test' }
  })
  await addNoteToNotebook(app, token, note1.shortId, notebook.shortId)

  await tap.test(
    'Accepted collaborator should be able to get a note in the notebook',
    async () => {
      const res = await request(app)
        .get(`/notes/${note1.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token3}`)
        .type('application/ld+json')

      await tap.equal(res.status, 200)
      const body = res.body
      await tap.equal(body.body[0].content, 'something')
    }
  )

  await destroyDB(app)
}

module.exports = test
