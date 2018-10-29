const { BaseModel } = require('./BaseModel.js')

class Reader extends BaseModel {
  static get tableName () {
    return 'Reader'
  }
  get path () {
    return 'reader'
  }
  $formatJson (json) {
    const reader = super.$formatJson(json)
    json = reader.json || {}
    json.id = reader.url
    json.published = reader.published
    json.updated = reader.updated
    return json
  }
  static get jsonSchema () {
    return {
      type: 'object',
      title: 'User Profile',
      properties: {
        id: { type: 'string', format: 'uuid' },
        userId: { type: 'string' },
        url: { type: 'string', format: 'url' },
        published: { type: 'string', format: 'date-time' },
        updated: { type: 'string', format: 'date-time' },
        json: {
          type: 'object',
          properties: {
            content: { type: 'string' },
            summary: { type: 'string' }
          },
          additionalProperties: true
        }
      },
      required: ['userId'],
      additionalProperties: true
    }
  }
}

module.exports = { Reader }
