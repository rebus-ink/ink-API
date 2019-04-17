'use strict'
const Model = require('objection').Model
const { BaseModel } = require('./BaseModel.js')
const short = require('short-uuid')
const translator = short()
const _ = require('lodash')
const { Activity } = require('./Activity')

const metadataProps = ['inLanguage', 'keywords']

/**
 * @property {Reader} reader - Returns the reader that owns this publication.
 * @property {Document[]} attachment - Returns the documents attached to this publication.
 * @property {Note[]} replies - Returns the notes associated with this publication.
 * @property {Activity[]} outbox - Returns the activities on this publication. **Question** how should a publication reference its activities?
 * @property {Attribution[]} attributedTo - returns the `Attribution` objects (can be many) attributed with contributing to or creating this document.
 * @property {Tag[]} tag - Returns the publication's `Tag` objects (i.e. links, hashtags, stacks and categories).
 *
 * This class represents an individual publication and holds references to the documents it contains, its creators/contributors, the notes on both the documents and publication itself, the reader who owns it, and the tags used to group it (and its contents) with other publications.
 */
class Publication extends BaseModel {
  static get tableName () /*: string */ {
    return 'Publication'
  }
  get path () /*: string */ {
    return 'publication'
  }
  static get jsonSchema () /*: any */ {
    return {
      type: 'object',
      properties: {
        id: { type: 'string' },
        readerId: { type: 'string' },
        name: { type: 'string' },
        author: { type: 'array' },
        description: { type: 'string' },
        editor: { type: 'array' },
        datePublished: { type: 'string', format: 'date-time' },
        inLanguage: { type: 'array' },
        keywords: { type: 'array' },
        readingOrder: { type: 'string' },
        resources: { type: 'string' },
        links: { type: 'string' },
        json: { type: 'object' },
        updated: { type: 'string', format: 'date-time' },
        published: { type: 'string', format: 'date-time' },
        deleted: { type: 'string', format: 'date-time' }
      },
      required: ['name', 'readerId', 'readingOrder']
    }
  }
  static get relationMappings () /*: any */ {
    const { Reader } = require('./Reader')
    const { Document } = require('./Document.js')
    const { Note } = require('./Note.js')
    const { Attribution } = require('./Attribution.js')
    const { Tag } = require('./Tag.js')
    return {
      reader: {
        relation: Model.BelongsToOneRelation,
        modelClass: Reader,
        join: {
          from: 'Publication.readerId',
          to: 'Reader.id'
        }
      },
      author: {
        relation: Model.HasManyRelation,
        modelClass: Attribution,
        join: {
          from: 'Publication.id',
          to: 'Attribution.publicationId'
        }
      },
      editor: {
        relation: Model.HasManyRelation,
        modelClass: Attribution,
        join: {
          from: 'Publication.id',
          to: 'Attribution.publicationId'
        }
      },
      replies: {
        relation: Model.HasManyRelation,
        modelClass: Note,
        join: {
          from: 'Publication.id',
          to: 'Note.publicationId'
        }
      },
      attachment: {
        relation: Model.HasManyRelation,
        modelClass: Document,
        join: {
          from: 'Publication.id',
          to: 'Document.publicationId'
        }
      },
      tags: {
        relation: Model.ManyToManyRelation,
        modelClass: Tag,
        join: {
          from: 'Publication.id',
          through: {
            from: 'publication_tag.publicationId',
            to: 'publication_tag.tagId'
          },
          to: 'Tag.id'
        }
      }
    }
  }

  asRef () /*: any */ {
    return this
  }

  static async createPublication (
    reader /*: any */,
    publication /*: any */
  ) /*: any */ {
    const metadata = {}
    metadataProps.forEach(property => {
      metadata[property] = publication[property]
    })

    const time = new Date().toISOString()

    const props = _.pick(publication, [
      'id',
      'name',
      'description',
      'datePublished',
      'json',
      'readingOrder',
      'resources',
      'links'
    ])
    props.readerId = reader.id
    props.metadata = metadata
    props.published = time
    props.updated = time
    props.readingOrder = JSON.stringify(props.readingOrder)
    props.links = JSON.stringify(props.links)
    props.resources = JSON.stringify(props.resources)

    const createdPublication = await Publication.query(
      Publication.knex()
    ).insertAndFetch(props)
    // // create attributions
    // if (publication.author) {
    //   createdPublication.author = []
    //   publication.author.forEach(async (author) => {
    //     const createdAuthor = await Attribution.createAttribution(author, 'author')
    //     createdPublication.author.push(createdAuthor)
    //   })
    // }

    // if (publication.editor) {
    //   createdPublication.editor = []
    //   publication.editor.forEach(async (editor) => {
    //     const createdEditor = await Attribution.createAttribution(editor, 'editor')
    //     createdPublication.editor.push(createdEditor)
    //   })
    // }

    return createdPublication
  }

  static async byId (id /*: string */) /*: Promise<any> */ {
    const pub = await Publication.query()
      .findById(id)
      .eager('[reader, replies, tags, author, editor]')

    if (!pub || pub.deleted) return null

    if (pub.metadata) {
      metadataProps.forEach(prop => {
        pub[prop] = pub.metadata[prop]
      })
      pub.metadata = undefined
    }

    return pub
  }

  static async delete (id /*: string */) /*: number */ {
    let publication = await Publication.query().findById(id)
    if (!publication || publication.deleted) {
      return null
    }
    publication.readingOrder = JSON.stringify(publication.readingOrder)
    const date = new Date().toISOString()
    return await Publication.query().patchAndFetchById(id, { deleted: date })
  }
}

module.exports = { Publication }
