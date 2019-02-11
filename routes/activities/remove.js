const { createActivityObject } = require('./utils')
const { Publications_Tags } = require('../../models/Publications_Tags')
const { Activity } = require('../../models/Activity')

const handleRemove = async (req, res, reader) => {
  const body = req.body
  switch (body.object.type) {
    case 'reader:Stack':
      const resultStack = Publications_Tags.removeTagFromPub(
        body.target.id,
        body.object.id
      )
      const activityObjStack = createActivityObject(body, resultStack, reader)
      Activity.createActivity(activityObjStack)
        .then(activity => {
          res.status(204)
          res.set('Location', activity.url)
          res.end()
        })
        .catch(err => {
          res
            .status(400)
            .send(`remove tag from publication error: ${err.message}`)
        })
      break

    default:
      res.status(400).send(`cannot remove ${body.object.type}`)
      break
  }
}

module.exports = { handleRemove }
