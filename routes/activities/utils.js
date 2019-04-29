const { urlToId } = require('../../routes/utils')

const createActivityObject = (body, result, reader) => {
  let props = Object.assign(body, {
    actor: {
      type: 'Person',
      id: urlToId(reader.id)
    },
    readerId: urlToId(reader.id)
  })
  if (result) {
    props = Object.assign(props, {
      object: {
        type: result.type,
        id: result.id
      }
    })
  }
  return props
}

module.exports = { createActivityObject }
