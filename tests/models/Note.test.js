const tap = require('tap')
const { destroyDB } = require('../integration/utils')
const { Reader } = require('../../models/Reader')
const { Note } = require('../../models/Note')
const { Publication } = require('../../models/Publication')
const { Document } = require('../../models/Document')
const short = require('short-uuid')
const translator = short()
const { urlToId } = require('../../routes/utils')
const crypto = require('crypto')

const test = async app => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

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
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Link',
        href: 'http://example.org/abc',
        hreflang: 'en',
        mediaType: 'text/html',
        name: 'An example link'
      },
      {
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Link',
        href: 'http://example.org/abc2',
        hreflang: 'en',
        mediaType: 'text/html',
        name: 'An example link2'
      }
    ]
  }

  const publication = await Publication.createPublication(
    createdReader,
    simplePublication
  )

  const documentObject = {
    mediaType: 'txt',
    url: 'http://google-bucket/somewhere/file1234.txt',
    documentPath: '/inside/the/book.txt',
    json: { property1: 'value1' }
  }

  const document = await Document.createDocument(
    createdReader,
    publication.id,
    documentObject
  )

  const noteObject = {
    noteType: 'highlight',
    content: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem donec massa sapien faucibus et molestie. Turpis tincidunt id aliquet risus feugiat in ante metus. Quis vel eros donec ac odio tempor orci dapibus ultrices. Vulputate eu scelerisque felis imperdiet proin fermentum leo vel. Nunc aliquet bibendum enim facilisis gravida neque. Diam phasellus vestibulum lorem sed risus. Habitasse platea dictumst quisque sagittis purus. Ut venenatis tellus in metus. Ornare arcu dui vivamus arcu felis. Dignissim enim sit amet venenatis urna cursus. Et egestas quis ipsum suspendisse ultrices gravida. Etiam erat velit scelerisque in dictum non consectetur. Consectetur libero id faucibus nisl. Pretium lectus quam id leo in vitae turpis massa. Sem viverra aliquet eget sit amet tellus cras adipiscing.

    Ultrices tincidunt arcu non sodales neque. Lorem donec massa sapien faucibus et molestie ac feugiat sed. Eget magna fermentum iaculis eu non diam phasellus. Nibh venenatis cras sed felis eget. Netus et malesuada fames ac turpis egestas maecenas pharetra. Sed viverra ipsum nunc aliquet bibendum enim facilisis. Elit scelerisque mauris pellentesque pulvinar pellentesque habitant. Leo integer malesuada nunc vel risus commodo. In ante metus dictum at. Massa tincidunt nunc pulvinar sapien et ligula ullamcorper malesuada.
    
    Massa id neque aliquam vestibulum morbi blandit cursus risus. Pretium aenean pharetra magna ac placerat. Lorem sed risus ultricies tristique nulla aliquet. Maecenas volutpat blandit aliquam etiam erat. Vel pharetra vel turpis nunc eget lorem dolor. Luctus venenatis lectus magna fringilla urna porttitor rhoncus. Nunc sed velit dignissim sodales ut eu sem integer. Metus dictum at tempor commodo ullamcorper a. Sed tempus urna et pharetra pharetra. Aenean et tortor at risus viverra. Consectetur a erat nam at lectus. Donec adipiscing tristique risus nec feugiat in. Nulla aliquet porttitor lacus luctus accumsan tortor. Quis auctor elit sed vulputate mi sit amet. Tellus cras adipiscing enim eu turpis egestas pretium aenean. Nunc aliquet bibendum enim facilisis gravida neque convallis a cras.
    
    Mattis rhoncus urna neque viverra justo nec ultrices. Convallis a cras semper auctor neque vitae tempus quam pellentesque. Tempus urna et pharetra pharetra massa massa. Arcu bibendum at varius vel pharetra. Nulla aliquet enim tortor at. Tellus molestie nunc non blandit massa. Sed libero enim sed faucibus turpis. Id ornare arcu odio ut sem nulla pharetra diam sit. Volutpat est velit egestas dui id ornare arcu. Quam quisque id diam vel quam elementum pulvinar. Enim nulla aliquet porttitor lacus. Orci eu lobortis elementum nibh tellus molestie nunc. Aenean vel elit scelerisque mauris. Proin libero nunc consequat interdum varius sit amet. Nulla facilisi etiam dignissim diam quis enim. Sed viverra ipsum nunc aliquet. Adipiscing at in tellus integer feugiat. Turpis in eu mi bibendum neque egestas congue.
    
    Gravida quis blandit turpis cursus in. Metus aliquam eleifend mi in. Lacus sed viverra tellus in hac habitasse platea dictumst vestibulum. Feugiat in fermentum posuere urna nec tincidunt praesent semper. Sed egestas egestas fringilla phasellus faucibus scelerisque eleifend donec pretium. Nec ullamcorper sit amet risus nullam eget felis. Hac habitasse platea dictumst quisque sagittis purus sit. Tellus orci ac auctor augue mauris augue neque. Donec ac odio tempor orci dapibus. Amet mattis vulputate enim nulla. Ut sem viverra aliquet eget sit amet tellus cras. Pellentesque habitant morbi tristique senectus et netus. Mauris commodo quis imperdiet massa tincidunt nunc pulvinar.`,
    selector: { property: 'value' },
    json: { anotherProperty: 3 },
    documentId: document.id,
    publicationId: publication.id
  }

  const simpleNoteObject = {
    noteType: 'something',
    selector: { property: 'value' }
  }

  let note

  await tap.test('Create Note', async () => {
    let response = await Note.createNote(createdReader, noteObject)
    await tap.ok(response)
    await tap.ok(response instanceof Note)
    await tap.equal(response.readerId, createdReader.id)

    note = response
  })

  await tap.test('Create Simple Note', async () => {
    let response = await Note.createNote(createdReader, simpleNoteObject)
    await tap.ok(response)
    await tap.ok(response instanceof Note)
    await tap.equal(response.readerId, createdReader.id)
  })

  await tap.test('Get note by id', async () => {
    note = await Note.byId(urlToId(note.id))
    await tap.type(note, 'object')
    await tap.equal(note.noteType, 'highlight')
    await tap.ok(note instanceof Note)
    // eager loading the reader
    await tap.type(note.reader, 'object')
    await tap.ok(note.reader instanceof Reader)
  })

  await tap.test('Note as Ref', async () => {
    const noteRef = note.asRef()
    await tap.ok(noteRef)
    await tap.type(noteRef, 'string')
    await tap.equal(noteRef, note.id)
  })

  await tap.test('Update Note', async () => {
    const res = await Note.update({ id: note.id, content: 'new content' })
    await tap.ok(res)
    await tap.equal(res.content, 'new content')
  })

  await tap.test('Try to update a note that does not exist', async () => {
    const res = await Note.update({
      id: note.id + '123',
      content: 'new content'
    })
    await tap.equal(res, null)
  })

  await tap.test('Delete Note', async () => {
    const res = await Note.delete(urlToId(note.id))
    await tap.ok(res.deleted)
  })

  await tap.test('Try to delete a note that does not exist', async () => {
    const res = await Note.delete('123')
    await tap.equal(res, null)
  })

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
