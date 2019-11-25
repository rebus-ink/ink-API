const { Tag } = require('../../models/Tag')
const { Activity } = require('../../models/Activity')
const { Note } = require('../../models/Note')
const { createActivityObject } = require('../../utils/utils')
const boom = require('@hapi/boom')
const { ValidationError } = require('objection')
const { libraryCacheUpdate } = require('../../utils/cache')

const handleCreate = async (req, res, next, reader) => {
  const body = req.body

  if (!body.object) {
    return next(
      boom.badRequest(`cannot create without an object`, {
        missingParams: ['object'],
        activity: 'Create'
      })
    )
  }

  if (!body.object.type) {
    return next(
      boom.badRequest(`cannot create without an object type`, {
        missingParams: ['object.type'],
        activity: 'Create'
      })
    )
  }

  switch (body.object.type) {
    case 'Note':
      let resultNote
      try {
        resultNote = await Note.createNote(reader, body.object)
      } catch (err) {
        if (err.message === 'no document') {
          return next(
            boom.notFound(
              `note creation failed: no document found with url ${
                body.object.inReplyTo
              }`,
              {
                type: 'Document',
                id: body.object.inReplyTo,
                activity: 'Create Note'
              }
            )
          )
        } else if (err.message === 'no publication') {
          return next(
            boom.notFound(
              `note creation failed: no publication found with id ${
                body.object.context
              }`,
              {
                type: 'Publication',
                id: body.object.context,
                activity: 'Create Note'
              }
            )
          )
        } else if (err instanceof ValidationError) {
          // rename selector to oa:hasSelector
          if (err.data && err.data.selector) {
            err.data['oa:hasSelector'] = err.data.selector
            err.data['oa:hasSelector'][0].params.missingProperty =
              'oa:hasSelector'
            delete err.data.selector
          }
          return next(
            boom.badRequest('Validation Error on Create Note: ', {
              activity: 'Create Note',
              type: 'Note',
              validation: err.data
            })
          )
        } else {
          return next(err)
        }
      }

      const activityObjNote = createActivityObject(body, resultNote, reader)
      const noteActivity = await Activity.createActivity(activityObjNote)
      res.status(201)
      res.set('Location', noteActivity.id)
      res.end()

      break

    case 'reader:Tag':
      const resultStack = await Tag.createTag(reader.id, body.object)

      if (resultStack instanceof Error || !resultStack) {
        if (resultStack.message === 'duplicate') {
          return next(
            boom.badRequest(
              `duplicate error: stack ${body.object.name} already exists`,
              { activity: 'Create Tag', type: 'reader:Tag' }
            )
          )
        }

        if (resultStack instanceof ValidationError) {
          return next(
            boom.badRequest('Validation error on create Tag: ', {
              type: 'reader:Tag',
              activity: 'Create Tag',
              validation: resultStack.data
            })
          )
        }

        return next(err)
      }

      // update cache - TODO: make this conditional to the type of tag??
      await libraryCacheUpdate(reader.id)

      const activityObjStack = createActivityObject(body, resultStack, reader)

      const tagActivity = await Activity.createActivity(activityObjStack)
      res.status(201)
      res.set('Location', tagActivity.id)
      res.end()

      break

    default:
      return next(
        boom.badRequest(`cannot create ${body.object.type}`, {
          badParams: ['object.type'],
          type: body.object.type,
          activity: 'Create'
        })
      )
  }
}

module.exports = { handleCreate }
