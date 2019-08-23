const libraryTests = require('./library.test')
const createPublicationTests = require('./createPublications.test')
const readerProfileTests = require('./getReaderProfile.test')
const createNotesTests = require('./createNotes.test')
const createTagsTests = require('./createTags.test')
const addPubToCollectionTests = require('./addPubToCollection.test')
const getReaderNotesTests = require('./getReaderNotes.test')

require('dotenv').config()

const allTests = async () => {
  await libraryTests()
  await readerProfileTests()
  await createPublicationTests()
  await createNotesTests()
  await createTagsTests()
  await addPubToCollectionTests()
  await getReaderNotesTests()
}

allTests()
