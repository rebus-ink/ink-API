const { Document } = require('../models/Document')
const elasticsearchQueue = require('./searchQueue')

exports.saveFiles = async (book, media, zip, storage, file) => {
  const bucketName = 'publication-file-storage-test'
  const bucket = storage.bucket(bucketName)

  const uploadFile = (fileName, content, type) => {
    return new Promise((resolve, reject) => {
      const blob = bucket.file(fileName)
      const stream = blob.createWriteStream({
        metadata: {
          contentType: type
        }
      })
      stream.on('error', async err => {
        // error on job
        console.log('error moving file', err)
        reject()
      })
      stream.on('finish', async () => {
        await blob.makePublic()
        resolve()
      })
      stream.end(content)
    })
  }

  const filesToIndex = [] // {fileName, document, publicationId}

  const promisesUpload = []

  for (index in media) {
    const documentFile = media[index]
    if (zip.files[documentFile.documentPath]) {
      // create document
      const name = `https://storage.googleapis.com/${bucketName}/reader-${
        book.readerId
      }/publication-${book.id}/${documentFile.documentPath}`
      const fileName = `reader-${book.readerId}/publication-${book.id}/${
        documentFile.documentPath
      }`
      // create document
      let document
      try {
        document = await Document.createDocument(
          { id: book.readerId },
          book.id,
          {
            mediaType: documentFile.mediaType,
            url: name,
            documentPath: documentFile.documentPath
          }
        )
      } catch (err) {
        throw new Error(err)
      }
      const content = await zip
        .file(documentFile.documentPath)
        .async('nodebuffer')
      promisesUpload.push(uploadFile(fileName, content, documentFile.mediaType))

      // add to elasticsearch queue
      if (
        (documentFile.mediaType === 'text/html' ||
          documentFile.mediaType === 'application/xhtml+xml') &&
        elasticsearchQueue
      ) {
        filesToIndex.push({
          fileName,
          document,
          pubId: book.id
        })
      }
    }
  }

  // save original file

  promisesUpload.push(
    uploadFile(
      `reader-/${book.readerId}/publication-${book.id}/original.epub`,
      file[0]
    )
  )

  promisesUpload.push(
    uploadFile(
      `${book.id}/META-INF/container.xml`,
      zip.files['META-INF/container.xml']._data.compressedContent
    )
  )
  await Promise.all(promisesUpload)

  for (index in filesToIndex) {
    const fileObject = filesToIndex[index]
    await elasticsearchQueue.add({
      type: 'add',
      fileName: fileObject.fileName,
      bucketName: bucketName,
      document: fileObject.document,
      pubId: fileObject.pubId
    })
  }
}
