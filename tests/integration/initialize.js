const app = require('../../server').app

const init = async () => {
  if (process.env.POSTGRE_INSTANCE) {
    await app.initialize()
    console.log('after initialize')
  }
}

init()
