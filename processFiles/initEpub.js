const JSZip = require('jszip')
const { parseOPF } = require('./parseOPF')

exports.initEpub = async file => {
  // Should check for src prop and download epub if file is not present.
  // Should also check for activity prop in case we have an id for annotations
  // Need to figure out a way to handle three scenarios: import file, import URL, read from url cached in file: file, src, activity. Set during init. initAsync only called during import preview or during book read.
  // Book object only created during import or read. Listings are still activities.
  //  const { file, zip } = context
  const zip = await JSZip.loadAsync(file, {
    base64: false
  })

  const container = await zip.file('META-INF/container.xml').async('string')
  const result = container.match(/full-path="([^"]+)"/)

  // We save the full path to the opf
  const opfPath = result[1]
  const opf = await zip.file(opfPath).async('string')
  const book = parseOPF(opf, opfPath)
  const media = book.resources.map(resource => {
    return {
      documentPath: resource.url,
      mediaType: resource.encodingFormat,
      json: {}
    }
  })
  book.resources = book.resources.concat(
    {
      type: 'LinkedResource',
      rel: ['alternate'],
      url: 'original.epub',
      encodingFormat: 'application/epub+zip'
    },
    {
      type: 'LinkedResource',
      rel: ['alternate'],
      url: opfPath,
      encodingFormat: 'application/oebps-package+xml'
    }
  )
  // Process resources to build media array of callbacks for upload
  // media.push({
  //   file,
  //   documentPath: 'original.epub',
  //   mediaType: 'application/epub+zip',
  //   json: {}
  // })
  // media.push({
  //   file: new global.File([opf], 'original.opf', {
  //     type: 'application/oebps-package+xml'
  //   }),
  //   documentPath: 'original.opf',
  //   mediaType: 'application/oebps-package+xml',
  //   json: {}
  // })
  return { book, media, zip, fileName: file.name }
}
