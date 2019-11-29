const { Activity } = require('../../models/Activity')
const { Publication } = require('../../models/Publication')
const { createActivityObject } = require('../../utils/utils')
const { Note } = require('../../models/Note')
const { Tag } = require('../../models/Tag')
const boom = require('@hapi/boom')
const { ValidationError } = require('objection')
const { libraryCacheUpdate } = require('../../utils/cache')

const handleUpdate = async (req, res, next, reader) => {
  const body = req.body
  if (!body.object) {
    return next(
      boom.badRequest(`cannot update without an object`, {
        missingParams: ['object'],
        activity: 'Update'
      })
    )
  }

  if (!body.object.type) {
    return next(
      boom.badRequest(`cannot update without an object type`, {
        missingParams: ['object.type'],
        activity: 'Update'
      })
    )
  }

  switch (body.object.type) {
    case 'Note':
      const resultNote = await Note.update(body.object)
      if (resultNote === null) {
        return next(
          boom.notFound(`no note found with id ${body.object.id}`, {
            type: 'Note',
            id: body.object.id,
            activity: 'Update Note'
          })
        )
      }
      if (resultNote instanceof ValidationError) {
        // rename selector to oa:hasSelector
        if (resultNote.data && resultNote.data.selector) {
          resultNote.data['oa:hasSelector'] = resultNote.data.selector
          resultNote.data['oa:hasSelector'][0].params.missingProperty =
            'oa:hasSelector'
          delete resultNote.data.selector
        }
        return next(
          boom.badRequest('Validation error on Update Note: ', {
            type: 'Note',
            activity: 'Update Note',
            validation: resultNote.data
          })
        )
      }

      const activityObjNote = createActivityObject(body, resultNote, reader)
      const noteActivity = await Activity.createActivity(activityObjNote)
      res.status(201)
      res.set('Location', noteActivity.id)
      res.end()
      break

    case 'Publication':
      const resultPub = await Publication.update(body.object)
      if (resultPub === null) {
        return next(
          boom.notFound(`no publication found with id ${body.object.id}`, {
            type: 'Publication',
            id: body.object.id,
            activity: 'Update Publication'
          })
        )
      }
      if (resultPub instanceof ValidationError) {
        return next(
          boom.badRequest('Validation error on Update Publication: ', {
            type: 'Publication',
            activity: 'Update Publication',
            validation: resultPub.data
          })
        )
      }
      if (resultPub instanceof Error) {
        return next(
          boom.badRequest(resultPub.message, {
            type: 'Publication',
            activity: 'Update Publication'
          })
        )
      }

      const activityObjPub = createActivityObject(body, resultPub, reader)
      const pubActivity = await Activity.createActivity(activityObjPub)

      await libraryCacheUpdate(reader.id)

      res.status(201)
      res.set('Location', pubActivity.id)
      res.end()

      break

    case 'reader:Tag':
      const resultTag = await Tag.update(body.object)
      if (resultTag === null) {
        return next(
          boom.notFound(`no tag found with id ${body.object.id}`, {
            type: 'reader:Tag',
            id: body.object.id,
            activity: 'Update Tag'
          })
        )
      }
      if (resultTag instanceof ValidationError) {
        return next(
          boom.badRequest('Validation error on Update Tag: ', {
            type: 'reader:Tag',
            activity: 'Update Tag',
            validation: resultTag.data
          })
        )
      }

      const activityObjTag = createActivityObject(body, resultTag, reader)
      const tagActivity = await Activity.createActivity(activityObjTag)

      await libraryCacheUpdate(reader.id)

      res.status(201)
      res.set('Location', tagActivity.id)
      res.end()

      break

    default:
      return next(
        boom.badRequest(`cannot update ${body.object.type}`, {
          type: body.object.type,
          activity: 'Update',
          badParams: ['object.type']
        })
      )
  }
}

module.exports = { handleUpdate }
