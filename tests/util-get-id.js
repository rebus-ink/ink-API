// The id of each resource depends on the domain as well as other factors (such as prefix)
// The `id` util function should standardise id generation
// Also, id generation _should not_ be based on the current host as that can vary while the id should be fixed.
const tap = require('tap')
const { getId } = require('../utils/get-id.js')

process.env.NODE_ENV = 'development'
process.env.DOMAIN = 'https://example.com'

tap.test('test basic id', test => {
  const result = getId('nickname/publication/1')
  test.equals(result, 'https://example.com/nickname/publication/1')
  test.end()
})

tap.test('test id with prefix and normalisation', test => {
  process.env.DOMAIN = 'https://example.com/api'
  const result = getId('//nickname/publication//1/')
  test.equals(result, 'https://example.com/api/nickname/publication/1/')
  test.end()
})
