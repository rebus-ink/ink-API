const jsdom = require('jsdom')
const { JSDOM } = jsdom
const URL = require('url').URL

exports.parseOPF = (opf, opfPath) => {
  let book = {
    type: 'Publication',
    links: [],
    resources: [],
    readingOrder: [],
    json: {}
  }
  const dom = new JSDOM(opf, { contentType: 'application/xml' })

  const document = dom.window.document
  // Let's get the language and name
  book.inLanguage = document.querySelector('dc\\:language')
    ? document.querySelector('dc\\:language').textContent
    : null
  // Get the basic title (we'll implement alternate titles and refinements at a later date)
  book.name = document.querySelector('dc\\:title')
    ? document.querySelector('dc\\:title').textContent
    : null
  // Other basics
  const packageElement = document.querySelector('package')
  const idforid = packageElement.getAttribute('unique-identifier')
  book.identifier =
    document.getElementById(idforid) !== null
      ? document.getElementById(idforid).textContent
      : null
  book.json.epubVersion = packageElement.getAttribute('version')
  const ncxId = document.querySelector('spine').getAttribute('toc')

  // The book's resources
  book.resources = Array.from(document.querySelectorAll('item')).map(item => {
    const properties = item.getAttribute('properties') || ''
    const rel = []
    if (properties && properties.indexOf('cover-image') !== -1) {
      rel.push('cover')
    }
    if (properties && properties.indexOf('nav') !== -1) {
      rel.push('contents')
    }
    const id = item.getAttribute('id')
    if (id === ncxId) {
      rel.push('ncx')
    }
    const url = getPath(item.getAttribute('href'), opfPath)
    return {
      url,
      rel,
      id,
      encodingFormat: item.getAttribute('media-type')
    }
  })

  // Often the cover isn't marked up using properties
  const propertiesCover = book.resources.filter(item => {
    return item.rel.indexOf('cover') !== -1
  })[0]
  if (!propertiesCover) {
    const metaCover = document.querySelector('meta[name="cover"]')
    // const guideCover = opfDoc.querySelector('guide reference[type="cover"]')
    if (metaCover) {
      const cover = book.resources.filter(item => {
        return item.id === metaCover.getAttribute('content')
      })[0]
      if (cover) {
        cover.rel.push('cover')
      }
    }
  }

  // Let's get the reading order
  const itemRefs = Array.from(
    document.querySelectorAll('itemref:not([linear="no"])')
  )
  book.readingOrder = itemRefs.map(ref => {
    return book.resources.filter(item => {
      return item.id === ref.getAttribute('idref')
    })[0]
  })

  // And the authors. Roles are not yet implemented
  book.author = Array.from(document.querySelectorAll('creator')).map(
    creator => creator.textContent
  )

  // The id is not needed now and might confuse the API
  book.resources.forEach(item => {
    delete item.id
  })
  return book
}

function getPath (path, opfPath) {
  const opf = new URL(opfPath, 'http://example.com/')
  // Return the full pathname, sans initial '/' as that confuses the zip
  return decodeURIComponent(new URL(path, opf).pathname.replace('/', ''))
}
