function idToUrl (id /*: string */, type /*: string */) /*: string */ {
  return `${process.env.DOMAIN}/${type}-${id}`
}

module.exports = { idToUrl }
