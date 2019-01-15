const app = require('../../server').app

const term = async () => {
  if (process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
}

term()
