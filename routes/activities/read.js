const { ReadActivity } = require('../../models/ReadActivity')
const boom = require('@hapi/boom')
const { ValidationError } = require('objection')

const handleRead = async (req, res, next, reader) => {
  const body = req.body
  const object = {
    selector: body['oa:hasSelector'],
    json: body.json
  }

  const result = await ReadActivity.createReadActivity(
    reader.id,
    body.context,
    object
  )

  if (!result || result instanceof Error) {
    if (result && result.message === 'no publication') {
      return next(
        boom.notFound(`no publication found with id ${body.context}`, {
          type: 'Publication',
          id: body.context,
          activity: 'Read'
        })
      )
    }
    if (result instanceof ValidationError) {
      // rename selector to oa:hasSelector
      if (result.data && result.data.selector) {
        result.data['oa:hasSelector'] = result.data.selector
        result.data['oa:hasSelector'][0].params.missingProperty =
          'oa:hasSelector'
        delete result.data.selector
      }
      return next(
        boom.badRequest('Validation error on create ReadActivity: ', {
          type: 'Publication',
          activity: 'Read',
          validation: result.data
        })
      )
    }

    return next(result)
  }

  if (result instanceof ReadActivity) {
    return res
      .status(201)
      .set('Location', result.id)
      .end()
  }
}

module.exports = { handleRead }
