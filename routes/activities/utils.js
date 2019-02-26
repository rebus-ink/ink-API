const createActivityObject = (body, result, reader) => {
  let props = Object.assign(body, {
    actor: {
      type: 'Person',
      id: reader.url
    }
  })
  if (result) {
    props = Object.assign(props, {
      object: {
        type: result.json ? result.json.type : result.type,
        id: result.url || result.id
      }
    })
  }
  return props
}

module.exports = { createActivityObject }
