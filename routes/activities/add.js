const { createActivityObject } = require('./utils')
const { Publications_Tags } = require('../../models/Publications_Tags')
const { Activity } = require('../../models/Activity')

const handleAdd = async (req, res, reader) => {
  const body = req.body
  switch (body.object.type) {
    case 'reader:Stack':
      const resultStack = await Publications_Tags.addTagToPub(
        body.target.id,
        body.object.id
      )
      if (resultStack instanceof Error) {
        switch (resultStack.message) {
          case 'duplicate':
            res
              .status(400)
              .send(
                `publication ${body.target.id} already asssociated with tag ${
                  body.object.id
                } (${body.object.name})`
              )
            break

          case 'no publication':
            res
              .status(404)
              .send(`no publication found with id ${body.target.id}`)
            break

          case 'no tag':
            res.status(404).send(`no tag found with id ${body.object.id}`)
            break

          default:
            res.status(400).send(`add tag to publication error: ${err.message}`)
            break
        }
        break
      }

      const activityObjStack = createActivityObject(body, resultStack, reader)
      Activity.createActivity(activityObjStack)
        .then(activity => {
          res.status(204)
          res.set('Location', activity.url)
          res.end()
        })
        .catch(err => {
          res.status(400).send(`create activity error: ${err.message}`)
        })
      break

    default:
      res.status(400).send(`cannot add ${body.object.type}`)
      break
  }
}

module.exports = { handleAdd }
