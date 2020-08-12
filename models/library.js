const { Source } = require('./Source')
const { Attribution } = require('./Attribution')
const { Reader } = require('./Reader')
const debug = require('debug')('ink:models:library')
const _ = require('lodash')

class Library {
  static async getLibraryCount (readerId, filter) {
    debug('**getLibraryCount**')
    debug('readerId: ', readerId)
    debug('filters: ', filter)
    let author, attribution, type
    if (filter.author) author = Attribution.normalizeName(filter.author)
    if (filter.attribution) {
      attribution = Attribution.normalizeName(filter.attribution)
    }
    if (filter.type) {
      type =
        filter.type.charAt(0).toUpperCase() +
        filter.type.substring(1).toLowerCase()
    }

    let builder = Source.query(Source.knex())
      .select('Source.id')
      .from('Source')
    builder.distinct('Source.id')
    builder.whereNull('Source.deleted')
    builder.where('Source.readerId', '=', readerId)
    if (filter.title) {
      const title = filter.title.toLowerCase()
      builder.where('Source.name', 'ilike', `%${title}%`)
    }
    if (filter.language) {
      builder.whereJsonSupersetOf('Source.metadata:inLanguage', [
        filter.language
      ])
    }
    if (filter.keyword) {
      builder.whereJsonSupersetOf('Source.metadata:keywords', [
        filter.keyword.toLowerCase()
      ])
    }
    if (filter.type) {
      builder.where('Source.type', '=', type)
    }
    builder.leftJoin('Attribution', 'Attribution.sourceId', '=', 'Source.id')

    if (filter.author) {
      builder
        .where('Attribution.normalizedName', '=', author)
        .andWhere('Attribution.role', '=', 'author')
    }
    if (filter.attribution) {
      builder.where('Attribution.normalizedName', 'like', `%${attribution}%`)
      if (filter.role) {
        builder.andWhere('Attribution.role', '=', filter.role)
      }
    }
    let stacks
    if (filter.stack) {
      if (_.isArray(filter.stack)) {
        stacks = filter.stack
      } else {
        stacks = [filter.stack]
      }
    }
    let tags
    if (filter.tag) {
      if (_.isArray(filter.tag)) {
        tags = filter.tag
      } else {
        tags = [filter.tag]
      }
    }

    builder.withGraphFetched('notebooks')
    if (filter.notebook) {
      builder.leftJoin(
        'notebook_source',
        'notebook_source.sourceId',
        '=',
        'Source.id'
      )
      builder.leftJoin(
        'Notebook',
        'notebook_source.notebookId',
        '=',
        'Notebook.id'
      )
      builder.whereNull('Notebook.deleted')
      builder.where('Notebook.id', '=', filter.notebook)
    }

    builder.withGraphFetched('[tags, attributions]')
    if (stacks) {
      stacks.forEach(stack => {
        builder.leftJoin(
          `source_tag as source_tag_${stack}`,
          `source_tag_${stack}.sourceId`,
          '=',
          'Source.id'
        )
        builder.leftJoin(
          `Tag as Tag_${stack}`,
          `source_tag_${stack}.tagId`,
          '=',
          `Tag_${stack}.id`
        )
        builder.whereNull(`Tag_${stack}.deleted`)
        builder
          .where(`Tag_${stack}.name`, '=', stack)
          .andWhere(`Tag_${stack}.type`, '=', 'stack')
      })
    }
    if (tags) {
      tags.forEach(tag => {
        builder.leftJoin(
          `source_tag as source_tag_${tag}`,
          `source_tag_${tag}.sourceId`,
          '=',
          'Source.id'
        )
        builder.leftJoin(
          `Tag as Tag_${tag}`,
          `source_tag_${tag}.tagId`,
          '=',
          `Tag_${tag}.id`
        )
        builder.whereNull(`Tag_${tag}.deleted`)
        builder.where(`Tag_${tag}.id`, '=', tag)
      })
    }

    if (filter.search) {
      const search = filter.search.toLowerCase()
      builder.where(nestedBuilder => {
        nestedBuilder
          .where('Source.name', 'ilike', `%${search}%`)
          .orWhere('Attribution.normalizedName', 'ilike', `%${search}%`)
          .orWhere('Source.abstract', 'ilike', `%${search}%`)
          .orWhere('Source.description', 'ilike', `%${search}%`)
          .orWhereJsonSupersetOf('Source.metadata:keywords', [search])
      })
    }

    const result = await builder
    return result.length
  }

  static async getLibrary (
    readerAuthId /*: string */,
    limit /*: number */,
    offset /*: number */,
    filter /*: any */
  ) {
    debug('**getLibrary**')
    debug('readerAuthId: ', readerAuthId)
    debug('limit: ', limit, 'offset: ', offset)
    debug('filters: ', filter)
    offset = !offset ? 0 : offset
    let author, attribution, type
    if (filter.author) author = Attribution.normalizeName(filter.author)
    if (filter.attribution) {
      attribution = Attribution.normalizeName(filter.attribution)
    }
    if (filter.type) {
      type =
        filter.type.charAt(0).toUpperCase() +
        filter.type.substring(1).toLowerCase()
    }
    let stacks
    if (filter.stack) {
      if (_.isArray(filter.stack)) {
        stacks = filter.stack
      } else {
        stacks = [filter.stack]
      }
    }

    let tags
    if (filter.tag) {
      if (_.isArray(filter.tag)) {
        tags = filter.tag
      } else {
        tags = [filter.tag]
      }
    }

    const readers = await Reader.query(Reader.knex())
      .where('Reader.authId', '=', readerAuthId)
      .skipUndefined()
      .withGraphFetched('[tags(selectTags), sources]')
      .modifiers({
        selectTags (modifierBuilder) {
          modifierBuilder.select(
            'Tag.id',
            'type',
            'name',
            'published',
            'updated',
            'Tag.json'
          )
        }
      })

      .modifyGraph('sources', builder => {
        builder
          .select(
            'Source.id',
            'Source.metadata',
            'Source.name',
            'Source.datePublished',
            'Source.status',
            'Source.type',
            'Source.encodingFormat',
            'Source.published',
            'Source.updated',
            'Source.deleted',
            'Source.resources',
            'Source.links'
          )
          .from('Source')
        builder.distinct('Source.id')
        builder.whereNull('Source.deleted')
        if (filter.title) {
          const title = filter.title.toLowerCase()
          builder.where('Source.name', 'ilike', `%${title}%`)
        }
        if (filter.language) {
          builder.whereJsonSupersetOf('Source.metadata:inLanguage', [
            filter.language
          ])
        }
        if (filter.keyword) {
          builder.whereJsonSupersetOf('Source.metadata:keywords', [
            filter.keyword.toLowerCase()
          ])
        }
        if (filter.type) {
          builder.where('Source.type', '=', type)
        }
        builder.leftJoin(
          'Attribution',
          'Attribution.sourceId',
          '=',
          'Source.id'
        )

        if (filter.author) {
          builder
            .where('Attribution.normalizedName', '=', author)
            .andWhere('Attribution.role', '=', 'author')
        }
        if (filter.attribution) {
          builder.where(
            'Attribution.normalizedName',
            'like',
            `%${attribution}%`
          )
          if (filter.role) {
            builder.andWhere('Attribution.role', '=', filter.role)
          }
        }

        builder.withGraphFetched('notebooks')
        if (filter.notebook) {
          builder.leftJoin(
            'notebook_source',
            'notebook_source.sourceId',
            '=',
            'Source.id'
          )
          builder.leftJoin(
            'Notebook',
            'notebook_source.notebookId',
            '=',
            'Notebook.id'
          )
          builder.whereNull('Notebook.deleted')
          builder.where('Notebook.id', '=', filter.notebook)
        }

        builder
          .withGraphFetched(
            '[tags(selectTags, notDeleted), attributions(selectAttributions, notDeleted)]'
          )
          .modifiers({
            selectAttributions (modifierBuilder) {
              modifierBuilder.select(
                'id',
                'role',
                'isContributor',
                'name',
                'type',
                'published'
              )
            },
            notDeleted (modifierBuilder) {
              modifierBuilder.whereNull('deleted')
            },
            selectTags (modifierBuilder) {
              modifierBuilder.select(
                'Tag.id',
                'type',
                'name',
                'published',
                'updated',
                'Tag.json'
              )
            }
          })
        if (stacks) {
          stacks.forEach(stack => {
            builder.leftJoin(
              `source_tag as source_tag_${stack}`,
              `source_tag_${stack}.sourceId`,
              '=',
              'Source.id'
            )
            builder.leftJoin(
              `Tag as Tag_${stack}`,
              `source_tag_${stack}.tagId`,
              '=',
              `Tag_${stack}.id`
            )
            builder.whereNull(`Tag_${stack}.deleted`)
            builder
              .where(`Tag_${stack}.name`, '=', stack)
              .andWhere(`Tag_${stack}.type`, '=', 'stack')
          })
        }

        if (tags) {
          tags.forEach(tag => {
            builder.leftJoin(
              `source_tag as source_tag_${tag}`,
              `source_tag_${tag}.sourceId`,
              '=',
              'Source.id'
            )
            builder.leftJoin(
              `Tag as Tag_${tag}`,
              `source_tag_${tag}.tagId`,
              '=',
              `Tag_${tag}.id`
            )
            builder.whereNull(`Tag_${tag}.deleted`)
            builder.where(`Tag_${tag}.id`, '=', tag)
          })
        }

        if (filter.search) {
          const search = filter.search.toLowerCase()
          builder.where(nestedBuilder => {
            nestedBuilder
              .where('Source.name', 'ilike', `%${search}%`)
              .orWhere('Attribution.normalizedName', 'ilike', `%${search}%`)
              .orWhere('Source.abstract', 'ilike', `%${search}%`)
              .orWhere('Source.description', 'ilike', `%${search}%`)
              .orWhereJsonSupersetOf('Source.metadata:keywords', [search])
          })
        }
        if (filter.orderBy === 'title') {
          if (filter.reverse) {
            builder.orderBy('Source.name', 'desc')
          } else {
            builder.orderBy('Source.name')
          }
        } else if (filter.orderBy === 'datePublished') {
          if (filter.reverse) {
            builder.orderByRaw('"datePublished" NULLS FIRST')
          } else {
            builder.orderByRaw('"datePublished" DESC NULLS LAST')
          }
        } else if (filter.orderBy === 'type') {
          if (filter.reverse) {
            builder.orderByRaw('"type" DESC NULLS FIRST')
          } else {
            builder.orderByRaw('"type" NULLS LAST')
          }
        } else {
          if (filter.reverse) {
            builder.orderBy('Source.updated')
          } else {
            builder.orderBy('Source.updated', 'desc')
          }
        }
        builder.limit(limit)
        builder.offset(offset)
      })
    return readers[0]
  }
}

module.exports = { Library }
