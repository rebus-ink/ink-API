const tap = require('tap')
const { checkNotebookCollaborator } = require('../../utils/utils')
const _ = require('lodash')

const test = async () => {
  const notebook = {
    id: '123',
    name: 'notebook1',
    collaborators: [
      {
        id: '1',
        status: 2, // accepted
        permission: { read: true, comment: true },
        notebookId: '123',
        readerId: '11',
        reader: { id: '11', name: 'John Doe' }
      },
      {
        id: '2',
        notebookId: '123',
        status: 1, // pending
        permission: { read: true },
        readerId: '22',
        reader: { id: '22', name: 'Jane Doe' }
      }
    ]
  }
  const notebook2 = {
    id: '123',
    name: 'notebook2'
  }

  await tap.test(
    'checkNotebookCollaboration should return the permission object',
    async () => {
      const result = checkNotebookCollaborator('11', notebook)
      await tap.ok(result)
      await tap.equal(result.read, true)
      await tap.equal(result.comment, true)
    }
  )

  await tap.test(
    'checkNotebookCollaboration should return empty object if collaborator is not accepted',
    async () => {
      const result = checkNotebookCollaborator('22', notebook)
      await tap.ok(result)
      await tap.ok(_.isEmpty(result))
    }
  )

  await tap.test(
    'checkNotebookCollaboration should return empty object if collaborator does not exist',
    async () => {
      const result = checkNotebookCollaborator('33', notebook)
      await tap.ok(result)
      await tap.ok(_.isEmpty(result))
    }
  )

  await tap.test('should work with an array of notebooks', async () => {
    const result = checkNotebookCollaborator('11', [notebook, notebook2])
    await tap.ok(result)
    await tap.equal(result.read, true)
    await tap.equal(result.comment, true)
  })
}
test()
