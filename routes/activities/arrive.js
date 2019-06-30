const { createActivityObject } = require('../../utils/utils')
const { Activity } = require('../../models/Activity')

const handleArrive = async (req, res, next, reader) => {
  const activityObj = createActivityObject(req.body, undefined, reader)
  Activity.createActivity(activityObj)
    .then(activity => {
      res.status(201)
      res.set('Location', activity.id)
      res.end()
    })
    .catch(err => {
      res.status(400).send(`delete publication error: ${err.message}`)
    })
}

module.exports = { handleArrive }
