const { Source } = require('./Source')
const { Attribution } = require('./Attribution')
const { Reader } = require('./Reader')
const _ = require('lodash')

class Library {
  static applyFilters (builder, filters) {
    let author, attribution, type
    if (filters.author) author = Attribution.normalizeName(filters.author)
    if (filters.attribution) {
      attribution = Attribution.normalizeName(filters.attribution)
    }
    if (filters.type) {
      type =
        filters.type.charAt(0).toUpperCase() +
        filters.type.substring(1).toLowerCase()
    }

    if (filters.title) {
      const title = filters.title.toLowerCase()
      builder.where('Source.name', 'ilike', `%${title}%`)
    }
    if (filters.language) {
      builder.whereJsonSupersetOf('Source.metadata:inLanguage', [
        filters.language
      ])
    }
    if (filters.keyword) {
      builder.whereJsonSupersetOf('Source.metadata:keywords', [
        filters.keyword.toLowerCase()
      ])
    }
    if (filters.type) {
      builder.where('Source.type', '=', type)
    }
    builder.leftJoin('Attribution', 'Attribution.sourceId', '=', 'Source.id')

    if (filters.author) {
      builder
        .where('Attribution.normalizedName', '=', author)
        .andWhere('Attribution.role', '=', 'author')
    }
    if (filters.attribution) {
      builder.where('Attribution.normalizedName', 'like', `%${attribution}%`)
      if (filters.role) {
        builder.andWhere('Attribution.role', '=', filters.role)
      }
    }
    let stacks
    if (filters.stack) {
      if (_.isArray(filters.stack)) {
        stacks = filters.stack
      } else {
        stacks = [filters.stack]
      }
    }
    let tags
    if (filters.tag) {
      if (_.isArray(filters.tag)) {
        tags = filters.tag
      } else {
        tags = [filters.tag]
      }
    }

    builder.withGraphFetched('notebooks')
    if (filters.notebook) {
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
      builder.where('Notebook.id', '=', filters.notebook)
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

    if (filters.search) {
      const search = filters.search.toLowerCase()
      builder.where(nestedBuilder => {
        nestedBuilder
          .where('Source.name', 'ilike', `%${search}%`)
          .orWhere('Attribution.normalizedName', 'ilike', `%${search}%`)
          .orWhere('Source.abstract', 'ilike', `%${search}%`)
          .orWhere('Source.description', 'ilike', `%${search}%`)
          .orWhereJsonSupersetOf('Source.metadata:keywords', [search])
      })
    }
  }

  static async getLibraryCount (readerId, filters) {
    let builder = Source.query(Source.knex())
      .select('Source.id')
      .from('Source')
    builder.distinct('Source.id')
    builder.whereNull('Source.deleted')
    builder.whereNull('Source.referenced')
    builder.where('Source.readerId', '=', readerId)

    this.applyFilters(builder, filters)

    const result = await builder
    return result.length
  }

  static async getLibrary (
    readerAuthId /*: string */,
    limit /*: number */,
    offset /*: number */,
    filters /*: any */
  ) {
    offset = !offset ? 0 : offset

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
        builder.whereNull('Source.referenced')

        this.applyFilters(builder, filters)

        builder
          .withGraphFetched(
            '[tags(selectTags, notDeleted), attributions(selectAttributions, notDeleted), readActivities(latestFirst)]'
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
            },
            latestFirst (modifierBuilder) {
              modifierBuilder.orderBy('published', 'desc')
            }
          })

        if (filters.orderBy === 'title') {
          if (filters.reverse) {
            builder.orderBy('Source.name', 'desc')
          } else {
            builder.orderBy('Source.name')
          }
        } else if (filters.orderBy === 'datePublished') {
          if (filters.reverse) {
            builder.orderByRaw('"datePublished" NULLS FIRST')
          } else {
            builder.orderByRaw('"datePublished" DESC NULLS LAST')
          }
        } else if (filters.orderBy === 'type') {
          if (filters.reverse) {
            builder.orderByRaw('"type" DESC NULLS FIRST')
          } else {
            builder.orderByRaw('"type" NULLS LAST')
          }
        } else {
          if (filters.reverse) {
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
