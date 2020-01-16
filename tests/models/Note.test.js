const tap = require('tap')
const { destroyDB } = require('../utils/testUtils')
const { Reader } = require('../../models/Reader')
const { Note } = require('../../models/Note')
const { Tag } = require('../../models/Tag')
const { Publication } = require('../../models/Publication')
const { Document } = require('../../models/Document')
const { Note_Tag } = require('../../models/Note_Tag')
const { urlToId } = require('../../utils/utils')
const crypto = require('crypto')
const _ = require('lodash')

const test = async app => {
  const reader = {
    name: 'J. Random Reader'
  }

  const random = crypto.randomBytes(13).toString('hex')

  const createdReader = await Reader.createReader(`auth0|foo${random}`, reader)

  const simplePublication = {
    type: 'Publication',
    name: 'Publication A',
    readingOrder: [
      {
        type: 'Link',
        url: 'http://example.org/abc',
        name: 'An example link'
      },
      {
        type: 'Link',
        url: 'http://example.org/abc2',
        name: 'An example link2'
      }
    ]
  }

  const publication = await Publication.createPublication(
    createdReader,
    simplePublication
  )

  // creating a document - this will not be exposed to the readers. It will be done as part of the upload
  const createdDocument = await Document.createDocument(
    createdReader,
    urlToId(publication.id),
    {
      documentPath: 'path/1',
      mediaType: 'text/html',
      url: 'http://something/123'
    }
  )
  const documentUrl = `${publication.id}/${createdDocument.documentPath}`

  const simpleNote = {
    target: { property: 'value' } // not actually a required property. There are no required properties for notes, I just had to put something.
  }

  const noteWithOneBody = {
    body: {
      motivation: 'test',
      content: 'this is the content of the note!',
      language: 'en'
    },
    target: { property: 'value' }
  }

  const noteWithTwoBodies = {
    body: [
      {
        motivation: 'test',
        content: 'this is content',
        language: 'en'
      },
      {
        motivation: 'test'
      }
    ]
  }

  const noteWithDocument = {
    publicationId: publication.id,
    documentUrl,
    body: {
      motivation: 'test',
      content: 'something'
    }
  }

  let note, note2, noteWithDoc

  await tap.test('Create Simple Note', async () => {
    let response = await Note.createNote(createdReader, simpleNote)
    await tap.ok(response)
    await tap.ok(response instanceof Note)
    await tap.equal(response.readerId, createdReader.id)
    await tap.equal(response.target.property, 'value')
  })

  await tap.test('Create Note with One Body', async () => {
    let response = await Note.createNote(createdReader, noteWithOneBody)
    await tap.ok(response)
    await tap.ok(response instanceof Note)
    await tap.equal(response.readerId, createdReader.id)
    await tap.ok(response.body)
    await tap.equal(response.body.motivation, 'test')
    await tap.equal(response.body.content, noteWithOneBody.body.content)
    await tap.equal(response.body.language, 'en')
    await tap.equal(response.target.property, 'value')
    note = response
  })

  await tap.test('Create Note with Two Bodies', async () => {
    let response = await Note.createNote(createdReader, noteWithTwoBodies)
    await tap.ok(response)
    await tap.ok(response instanceof Note)
    await tap.equal(response.readerId, createdReader.id)
    await tap.ok(response.body)
    await tap.ok(_.isArray(response.body))
    await tap.equal(response.body.length, 2)
    note2 = response
  })

  await tap.test('Create Note with document', async () => {
    let response = await Note.createNote(createdReader, noteWithDocument)
    await tap.ok(response)
    await tap.ok(response instanceof Note)
    await tap.equal(response.documentUrl, noteWithDocument.documentUrl)
    noteWithDoc = response
  })

  await tap.test('Update a Note with a new body', async () => {
    const newNote = Object.assign(note, {
      body: { content: 'new content', motivation: 'test' },
      target: { property1: 'value1' }
    })
    const response = await Note.update(newNote)
    await tap.ok(response)
    await tap.ok(response instanceof Note)
    await tap.equal(response.readerId, createdReader.id)
    await tap.ok(response.body)
    await tap.equal(response.body.motivation, 'test')
    await tap.equal(response.body.content, 'new content')
    await tap.notOk(response.body.language) // should be gone
    await tap.equal(response.target.property1, 'value1')
    await tap.notOk(response.target.property) // should be gone
  })

  await tap.test('Update a Note with no body', async () => {
    const newNote = Object.assign(note, {
      target: { property2: 'value2' },
      body: undefined
    })
    const response = await Note.update(newNote)
    await tap.ok(response)
    await tap.ok(response instanceof Note)
    await tap.equal(response.readerId, createdReader.id)
    await tap.notOk(response.body)
    await tap.equal(response.target.property2, 'value2')
    await tap.notOk(response.target.property1) // should be gone
  })

  await tap.test('Update a Note with two bodies', async () => {
    const newNote = Object.assign(note, {
      body: [
        { content: '1', motivation: 'test' },
        { content: '2', motivation: 'test' }
      ]
    })
    const response = await Note.update(newNote)
    await tap.ok(response)
    await tap.ok(response instanceof Note)
    await tap.equal(response.readerId, createdReader.id)
    await tap.equal(response.body.length, 2)
  })

  await tap.test('Update Note with document', async () => {
    const newNote = Object.assign(noteWithDoc, {
      body: { content: 'something else', motivation: 'test2' }
    })
    let response = await Note.update(newNote)
    await tap.ok(response)
    await tap.ok(response instanceof Note)
    await tap.equal(response.documentUrl, noteWithDocument.documentUrl)
  })

  await tap.test('Try to update a note that does not exist', async () => {
    const newNote = Object.assign(note, {
      target: { new: 'new value' },
      id: '123'
    })
    const response = await Note.update(newNote)
    await tap.notOk(response)
    await tap.equal(response, null)
  })

  await tap.test('Get note by id', async () => {
    const retrievedNote = await Note.byId(urlToId(note2.id))
    await tap.type(retrievedNote, 'object')
    await tap.ok(retrievedNote instanceof Note)
    // eager loading the reader
    await tap.type(retrievedNote.reader, 'object')
    await tap.ok(retrievedNote.reader instanceof Reader)
    // eager loading the body
    await tap.ok(_.isArray(retrievedNote.body))
    await tap.equal(retrievedNote.body.length, 2)
  })

  await tap.test('Try to get a Note that does not exist', async () => {
    const response = await Note.byId('123')
    await tap.equal(response, undefined)
  })

  await tap.test('Note as Ref', async () => {
    const noteRef = note2.asRef()
    await tap.ok(noteRef)
    await tap.type(noteRef, 'string')
    await tap.equal(noteRef, note2.id)
  })

  await tap.test('Delete Note', async () => {
    const res = await Note.delete(urlToId(note2.id))
    await tap.ok(res.deleted)

    // make sure that the NoteBodies are deleted:
    const newNote = await Note.byId(urlToId(note2.id))
    await tap.ok(newNote.body)
    await tap.ok(newNote.body[0].deleted)
    await tap.ok(newNote.body[1].deleted)
  })

  await tap.test('Try to delete a note that does not exist', async () => {
    const res = await Note.delete('123')
    await tap.equal(res, null)
  })

  // --------------------------------------------------------------------------------
  // TODO: move to another file!
  // // Create a valid tag
  // const newTag = await Tag.createTag(createdReader.id, {
  //   type: 'reader:Tag',
  //   tagType: 'reader:Stack',
  //   name: 'mystack'
  // })

  // // Create a valid note
  // const newNote = await Note.createNote(createdReader, noteObject)

  // await tap.test('Add a tag to a note', async () => {
  //   const tagNote = await Note_Tag.addTagToNote(urlToId(newNote.id), newTag.id)

  //   tap.ok(tagNote.noteId)
  //   tap.ok(tagNote.tagId)
  //   tap.equal(tagNote.tagId, newTag.id)
  //   tap.equal(tagNote.noteId, urlToId(newNote.id))
  // })

  // await tap.test('Add a tag to a note with an invalid noteId', async () => {
  //   const tagNote = await Note_Tag.addTagToNote(
  //     newNote.id + 'Blah123',
  //     newTag.id
  //   )

  //   tap.ok(typeof tagNote, Error)
  //   tap.ok(tagNote.message, 'no note')
  // })

  // await tap.test('Add a tag to a note with an invalid tagId', async () => {
  //   const tagNote = await Note_Tag.addTagToNote(
  //     urlToId(newNote.id),
  //     newTag.id + 1222222223
  //   )

  //   tap.ok(typeof tagNote, Error)
  //   tap.equal(tagNote.message, 'no tag')
  // })

  // await tap.test('Delete all Note_Tags associated with a note', async () => {
  //   // Create valid tags
  //   const tag1 = await Tag.createTag(createdReader.id, {
  //     type: 'reader:Tag',
  //     tagType: 'reader:Stack',
  //     name: 'someStack1'
  //   })
  //   const tag2 = await Tag.createTag(createdReader.id, {
  //     type: 'reader:Tag',
  //     tagType: 'reader:Stack',
  //     name: 'someStack2'
  //   })

  //   const anotherNote = await Note.createNote(createdReader, noteObject)

  //   await Note_Tag.addTagToNote(urlToId(anotherNote.id), tag1.id)
  //   await Note_Tag.addTagToNote(urlToId(anotherNote.id), tag2.id)

  //   const noteWithTags = await Note.byId(urlToId(anotherNote.id))

  //   await tap.ok(noteWithTags.tags)
  //   await tap.equal(noteWithTags.tags.length, 2)
  //   await tap.ok(
  //     noteWithTags.tags[0].name === tag1.name ||
  //       noteWithTags.tags[0].name === tag2.name
  //   )
  //   await tap.ok(
  //     noteWithTags.tags[1].name === tag1.name ||
  //       noteWithTags.tags[1].name === tag2.name
  //   )

  //   // Remote the Note_Tag
  //   const numDeleted = await Note_Tag.deleteNoteTagsOfNote(
  //     urlToId(noteWithTags.id)
  //   )

  //   // Fetch the new Note
  //   const noteWithoutTags = await Note.byId(urlToId(noteWithTags.id))

  //   await tap.equal(noteWithoutTags.tags.length, 0)
  //   await tap.equal(numDeleted, 2)
  // })

  // await tap.test(
  //   'Delete Note_Tags of a Note with an id that does not exist',
  //   async () => {
  //     const response = await Note_Tag.deleteNoteTagsOfNote('invalidIdOfNote')

  //     await tap.equal(response, 0)
  //   }
  // )

  // await tap.test('Delete Note_Tags of a Note with an invalid id', async () => {
  //   const response = await Note_Tag.deleteNoteTagsOfNote(null)

  //   await tap.ok(typeof response, Error)
  //   await tap.equal(response.message, 'no note')
  // })

  // await tap.test('Delete all Note_Tags associated with a Tag', async () => {
  //   // Create 1 tag, 2 notes, and add this tag to the notes
  //   const createdTag = await Tag.createTag(createdReader.id, {
  //     type: 'reader:Tag',
  //     tagType: 'reader:Stack',
  //     name: 'another random stack'
  //   })

  //   const anotherNote1 = await Note.createNote(createdReader, noteObject)
  //   const anotherNote2 = await Note.createNote(createdReader, noteObject)

  //   await Note_Tag.addTagToNote(urlToId(anotherNote1.id), createdTag.id)
  //   await Note_Tag.addTagToNote(urlToId(anotherNote2.id), createdTag.id)

  //   // Fetch notes with tags
  //   const note1WithTag = await Note.byId(urlToId(anotherNote1.id))
  //   const note2WithTag = await Note.byId(urlToId(anotherNote2.id))

  //   await tap.equal(note1WithTag.tags.length, 1)
  //   await tap.equal(note2WithTag.tags.length, 1)

  //   const numDeleted = await Note_Tag.deleteNoteTagsOfTag(createdTag.id)

  //   // Fetch the Notes without tags
  //   const note1WithoutTag = await Note.byId(urlToId(anotherNote1.id))
  //   const note2WithoutTag = await Note.byId(urlToId(anotherNote2.id))

  //   await tap.equal(numDeleted, 2)
  //   await tap.equal(note1WithoutTag.tags.length, 0)
  //   await tap.equal(note2WithoutTag.tags.length, 0)
  // })

  // await tap.test('Remove a valid tag from a valid note', async () => {
  //   // Create valid tags
  //   const tag1 = await Tag.createTag(createdReader.id, {
  //     type: 'reader:Tag',
  //     tagType: 'reader:Stack',
  //     name: 'MyStack1'
  //   })
  //   const tag2 = await Tag.createTag(createdReader.id, {
  //     type: 'reader:Tag',
  //     tagType: 'reader:Stack',
  //     name: 'MyStack2'
  //   })

  //   // Create a valid note
  //   const note1 = await Note.createNote(createdReader, noteObject)
  //   const note2 = await Note.createNote(createdReader, simpleNoteObject)

  //   // Add tags to notes
  //   const tagNote1 = await Note_Tag.addTagToNote(urlToId(note1.id), tag1.id)
  //   const tagNote2 = await Note_Tag.addTagToNote(urlToId(note2.id), tag2.id)

  //   const result = await Note_Tag.removeTagFromNote(
  //     urlToId(tagNote1.noteId),
  //     tagNote1.tagId
  //   )

  //   // Check that the spcified entry has been removed
  //   removed = await Note_Tag.query().where({
  //     noteId: tagNote1.noteId,
  //     tagId: tagNote1.tagId
  //   })

  //   // Check that the not specified entry has not been removed
  //   notRemoved = await Note_Tag.query().where({
  //     noteId: tagNote2.noteId,
  //     tagId: tagNote2.tagId
  //   })

  //   // Make sure only 1 is removed
  //   tap.equal(result, 1)
  //   tap.ok(typeof removed, Error)
  //   tap.ok(notRemoved[0] instanceof Note_Tag)
  // })

  // await tap.test('Remove a tag with an invalid noteId', async () => {
  //   const result = await Note_Tag.removeTagFromNote(
  //     newNote.id + 'Blah1233333333333',
  //     newTag.id
  //   )

  //   tap.ok(typeof result, Error)
  //   tap.equal(result.message, 'not found')
  // })

  // await tap.test('Remove a tag with an invalid tagId', async () => {
  //   const result = await Note_Tag.removeTagFromNote(newNote.id, newTag.id + 123)

  //   tap.ok(typeof result, Error)
  //   tap.equal(result.message, 'not found')
  // })

  // await tap.test('Delete a Note', async () => {
  //   const tag = await Tag.createTag(createdReader.id, {
  //     type: 'reader:Tag',
  //     tagType: 'reader:Stack',
  //     name: 'random name for tag'
  //   })

  //   await Note_Tag.addTagToNote(urlToId(newNote.id), tag.id)

  //   // Fetch the note with the new tag
  //   const noteWithTag = await Note.byId(urlToId(newNote.id))

  //   await tap.ok(!noteWithTag.deleted)
  //   await tap.ok(noteWithTag.tags.length !== 0)

  //   // Delete the note
  //   const noteDeleted = await Note.delete(urlToId(noteWithTag.id))

  //   await tap.ok(noteDeleted.deleted)
  //   await tap.ok(!noteDeleted.tags)
  // })

  await destroyDB(app)
}

module.exports = test
