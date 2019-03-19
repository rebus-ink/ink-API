const { createActivityObject } = require('./utils')
const { Publications_Tags } = require('../../models/Publications_Tags')
const { Activity } = require('../../models/Activity')

const handleRemove = async (req, res, reader) => {
  const body = req.body
  switch (body.object.type) {
    case 'reader:Stack':
      const resultStack = await Publications_Tags.removeTagFromPub(
        body.target.id,
        body.object.id
      )
      if (resultStack instanceof Error) {
        switch (resultStack.message) {
          case 'no publication':
            res.status(404).send(`no publication provided`)
            break

          case 'no tag':
            res.status(404).send(`no tag provided`)
            break

          case 'not found':
            res
              .status(404)
              .send(
                `no relationship found between tag ${
                  body.object.id
                } and publication ${body.target.id}`
              )
            break

          default:
            res
              .status(400)
              .send(`remove tag from publication error: ${err.message}`)
            break
        }
        break
      }
      const activityObjStack = createActivityObject(body, resultStack, reader)
      Activity.createActivity(activityObjStack)
        .then(activity => {
          res.status(201)
          res.set('Location', activity.url)
          res.end()
        })
        .catch(err => {
          res.status(400).send(`create activity error: ${err.message}`)
        })
      break

    default:
      res.status(400).send(`cannot remove ${body.object.type}`)
      break
  }
}

module.exports = { handleRemove }
