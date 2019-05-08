const { ReadActivity } = require('../../models/ReadActivity')

const handleRead = async (req, res, reader) => {
  const body = req.body

  const object = {
    selector: body['oa:hasSelector'],
    json: body.json
  }

  ReadActivity.createReadActivity(reader.id, body.context, object)
    .then(activity => {
      res.status(201)
      res.set('Location', activity.id)
      res.end()
    })
    .catch(err => {
      res.status(400).send(`create read activity error: ${err.message}`)
    })
}

module.exports = { handleRead }
