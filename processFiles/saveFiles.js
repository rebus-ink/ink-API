const { updateJob } = require('./updateJob')
const { Document } = require('../models/Document')

exports.saveFiles = async (book, media, zip, storage, file, jobId) => {
  const bucketName = 'publication-file-storage-test'
  const bucket = storage.bucket(bucketName)

  const uploadFile = (fileName, content) => {
    return new Promise((resolve, reject) => {
      const blob = bucket.file(fileName)
      const stream = blob.createWriteStream()
      stream.on('error', async err => {
        // error on job
        console.log('error moving file', err)
        reject()
      })
      stream.on('finish', () => {
        resolve()
      })
      stream.end(content)
    })
  }

  const promises = []

  media.forEach(async documentFile => {
    if (zip.files[documentFile.documentPath]) {
      // create document
      const name = `https://storage.cloud.google.com/${bucketName}/reader-${
        book.readerId
      }/publication-${book.id}/${documentFile.documentPath}`
      // create document
      try {
        await Document.createDocument({ id: book.readerId }, book.id, {
          mediaType: 'text/html',
          url: name,
          documentPath: documentFile.documentPath
        })
      } catch (err) {
        console.log('error creating document: ', err)
        await updateJob(jobId, err.toString())
      }
      promises.push(
        uploadFile(
          `reader-${book.readerId}/publication-${book.id}/${
            documentFile.documentPath
          }`,
          zip.files[documentFile.documentPath]._data.compressedContent
        )
      )
    }
  })

  // save original file

  promises.push(
    uploadFile(
      `reader-/${book.readerId}/publication-${book.id}/original.epub`,
      file[0]
    )
  )

  promises.push(
    uploadFile(
      `${book.id}/META-INF/container.xml`,
      zip.files['META-INF/container.xml']._data.compressedContent
    )
  )

  await Promise.all(promises)
}