const { ReadActivity } = require('../../models/ReadActivity')
const boom = require('@hapi/boom')

const handleRead = async (req, res, next, reader) => {
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
      if (err.message === 'no publication') {
        return next(
          boom.notFound(`no publication found with id ${body.context}`, {
            type: 'Publication',
            id: body.context,
            activity: 'Read'
          })
        )
      }
      return next(boom.badRequest(`create read activity error: ${err.message}`))
    })
}

module.exports = { handleRead }
