const { getToken } = require('../../utils/utils')
const app = require('../../../server').app
const request = require('request')
const util = require('util')
const requestGet = util.promisify(request.get)

const createTags = require('../utils/createTags')
const createReader = require('../utils/createReader')
const createPublication = require('../utils/createPublication')

// create token
const test = async () => {
  const token = await getToken()

  const readerUrl = await createReader(token)

  await createPublication(token, readerUrl, 100)

  console.log(token)
  console.log(readerUrl)
  process.exit()
}

test()
