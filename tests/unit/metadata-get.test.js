const tap = require('tap')
const { getMetadata } = require('../../utils/metadata-get')
const _ = require('lodash')

const test = async () => {
  await tap.test('get metadata', async () => {
    await getMetadata('Optically+manipulating+superconductors', {
      crossref: true,
      doaj: true,
      loc: true
    })
  })
}
test()
