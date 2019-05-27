const { createActivityObject } = require('../../utils/utils')
const { Publication_Tag } = require('../../models/Publications_Tags')
const { Activity } = require('../../models/Activity')
const { Note_Tag } = require('../../models/Note_Tag')
const boom = require('@hapi/boom')

const handleRemove = async (req, res, next, reader) => {
  const body = req.body

  let resultStack

  // Determine where the Tag is removed from
  if (body.target.type === 'Publication') {
    resultStack = await Publication_Tag.removeTagFromPub(
      body.target.id,
      body.object.id
    )
  } else if (body.target.type === 'Note') {
    resultStack = await Note_Tag.removeTagFromNote(
      body.target.id,
      body.object.id
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
            type: 'Tag',
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
        return next(
          boom.badRequest(
            `remove tag from ` + body.target.type + ` error: ${err.message}`
          )
        )
    }
  }

  const activityObjStack = createActivityObject(body, resultStack, reader)
  const activity = await Activity.createActivity(activityObjStack)

  return res
    .status(201)
    .set('Location', activity.url)
    .end()
}

module.exports = { handleRemove }
