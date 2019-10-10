const { Job } = require('../models/Job')

exports.updateJob = async (id, error, publicationId) => {
  if (error) {
    console.log('updateJob with error: ', id, error)
    return await Job.updateJob(id, {
      finished: new Date().toISOString(),
      error: error
    })
  } else {
    console.log('updateJob', id, publicationId)
    const result = await Job.updateJob(id.toString(), {
      finished: new Date().toISOString(),
      publicationId
    })
    return result
  }
}
