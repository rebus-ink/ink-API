const { Job } = require('../models/Job')

exports.updateJob = async (id, error, publicationId) => {
  if (error) {
    return await Job.updateJob(id, {
      finished: new Date().toISOString(),
      error: error
    })
  } else {
    const result = await Job.updateJob(id.toString(), {
      finished: new Date().toISOString(),
      publicationId
    })
    return result
  }
}
