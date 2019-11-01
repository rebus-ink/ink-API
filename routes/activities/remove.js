const { createActivityObject } = require('../../utils/utils')
const { Publication_Tag } = require('../../models/Publications_Tags')
const { Activity } = require('../../models/Activity')
const { Note_Tag } = require('../../models/Note_Tag')
const boom = require('@hapi/boom')
const { libraryCacheUpdate } = require('../../utils/cache')

const handleRemove = async (req, res, next, reader) => {
  const body = req.body

  if (!body.object) {
    return next(
      boom.badRequest(`cannot remove without an object`, {
        missingParams: ['object'],
        activity: 'Remove'
      })
    )
  }

  if (!body.object.type) {
    return next(
      boom.badRequest(`cannot remove without an object type`, {
        missingParams: ['object.type'],
        activity: 'Remove'
      })
    )
  }

  if (!body.target) {
    return next(
      boom.badRequest(`cannot remove without a target`, {
        missingParams: ['target'],
        activity: 'Remove'
      })
    )
  }

  if (!body.target.type) {
    return next(
      boom.badRequest(`cannot remove without a target type`, {
        missingParams: ['target.type'],
        activity: 'Remove'
      })
    )
  }

  let resultStack
  if (body.object.type !== 'reader:Tag') {
    return next(
      boom.badRequest(`cannot remove ${body.object.type}`, {
        badParams: ['object.type'],
        activity: 'Remove',
        type: body.object.type
      })
    )
  }

  // Determine where the Tag is removed from
  if (body.target.type === 'Publication') {
    resultStack = await Publication_Tag.removeTagFromPub(
      body.target.id,
      body.object.id
    )
    await libraryCacheUpdate(reader.id)
  } else if (body.target.type === 'Note') {
    resultStack = await Note_Tag.removeTagFromNote(
      body.target.id,
      body.object.id
    )
  } else {
    return next(
      boom.badRequest(`cannot remove ${body.target.type}`, {
        badParams: ['target.type'],
        activity: 'Remove',
        type: body.target.type
      })
    )
  }

  if (resultStack instanceof Error) {
    switch (resultStack.message) {
      case 'no publication':
        return next(
          boom.notFound(`no publication provided`, {
            type: 'Publication',
            activity: 'Remove Tag from Publication'
          })
        )

      case 'no tag':
        return next(
          boom.notFound(`no tag provided`, {
            type: 'reader:Tag',
            activity: `Remove Tag from ${body.target.type}`
          })
        )

      case 'no note':
        return next(
          boom.notFound(`no note provided`, {
            type: 'Note',
            activity: 'Remove Tag from Note'
          })
        )

      case 'not found':
        return next(
          boom.notFound(
            `no relationship found between tag ${body.object.id} and ` +
              body.target.type +
              ` ${body.target.id}`,
            {
              type: `${body.target.type}_Tag`,
              activity: `Remove Tag from ${body.target.type}`
            }
          )
        )

      default:
        return next(err)
    }
  }

  const activityObjStack = createActivityObject(body, resultStack, reader)
  const activity = await Activity.createActivity(activityObjStack)

  return res
    .status(201)
    .set('Location', activity.id)
    .end()
}

module.exports = { handleRemove }
