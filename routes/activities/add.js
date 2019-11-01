const { createActivityObject } = require('../../utils/utils')
const { Publication_Tag } = require('../../models/Publications_Tags')
const { Note_Tag } = require('../../models/Note_Tag')
const { Activity } = require('../../models/Activity')
// const { urlToId } = require('./utils')
const boom = require('@hapi/boom')
const { libraryCacheUpdate } = require('../../utils/cache')

const handleAdd = async (req, res, next, reader) => {
  const body = req.body

  if (!body.object) {
    return next(
      boom.badRequest(`cannot add without an object`, {
        missingParams: ['object'],
        activity: 'Add'
      })
    )
  }

  if (!body.object.type) {
    return next(
      boom.badRequest(`cannot add without an object type`, {
        missingParams: ['object.type'],
        activity: 'Add'
      })
    )
  }

  if (!body.target) {
    return next(
      boom.badRequest(`cannot add without a target`, {
        missingParams: ['target'],
        activity: 'Add'
      })
    )
  }

  if (!body.target.type) {
    return next(
      boom.badRequest(`cannot add without a target type`, {
        missingParams: ['target.type'],
        activity: 'Add'
      })
    )
  }

  switch (body.object.type) {
    case 'reader:Tag':
      // Determine if the Tag is added to a Publication or a Note
      let resultStack
      if (body.target.type === 'Publication') {
        resultStack = await Publication_Tag.addTagToPub(
          body.target.id,
          body.object.id
        )
        await libraryCacheUpdate(reader.id)
      } else if (body.target.type === 'Note') {
        resultStack = await Note_Tag.addTagToNote(
          body.target.id,
          body.object.id
        )
      } else {
        return next(
          boom.badRequest(`cannot add to ${body.target.type}`, {
            badParams: ['target.type'],
            activity: 'Add',
            type: body.target.type
          })
        )
      }

      // Check for errors
      if (resultStack instanceof Error) {
        switch (resultStack.message) {
          case 'duplicate':
            return next(
              boom.badRequest(
                `duplicate ` +
                  body.target.type +
                  `: ${body.target.id} already asssociated with tag ${
                    body.object.id
                  } (${body.object.name})`,
                {
                  type: `${body.target.type}_Tag`,
                  target: body.target.id,
                  object: body.object.id,
                  activity: `Add Tag to ${body.target.type}`
                }
              )
            )

          case 'no publication':
            return next(
              boom.notFound(`no publication found with id ${body.target.id}`, {
                type: 'Publication',
                id: body.target.id,
                activity: 'Add Tag to Publication'
              })
            )

          case 'no tag':
            return next(
              boom.notFound(`no tag found with id ${body.object.id}`, {
                type: 'reader:Tag',
                id: body.object.id,
                activity: `Add Tag to ${body.target.type}`
              })
            )

          case 'no note':
            return next(
              boom.notFound(`no note found with id ${body.target.id}`, {
                type: 'Note',
                id: body.target.id,
                activity: 'Add Tag to Note'
              })
            )

          default:
            return next(err)
        }
      }

      const activityObjStack = createActivityObject(body, resultStack, reader)
      const tagActivity = await Activity.createActivity(activityObjStack)
      res.status(201)
      res.set('Location', tagActivity.id)
      res.end()

      break

    default:
      return next(
        boom.badRequest(`cannot add ${body.object.type}`, {
          badParams: ['object.type'],
          activity: 'Add',
          type: body.object.type
        })
      )
  }
}

module.exports = { handleAdd }
