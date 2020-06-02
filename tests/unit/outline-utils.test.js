const tap = require('tap')
const { notesListToTree } = require('../../utils/outline')

/*
note1
  note4
    note6
  note2
    note7
    note3
    note8
note5
*/

const test = async () => {
  const listOfNotes = [
    {
      id: 'https://reader-api.test/notes/1',
      readerId: 'https://reader-api.test/readers/q3WCuzFju4zaw3AAr3KBoU',
      target: { property: 'something' },
      documentUrl:
        'https://reader-api.test/sources/q3WCuzFju4zaw3AAr3KBoU-2cf84b9e55/path/1',
      sourceId:
        'https://reader-api.test/sources/q3WCuzFju4zaw3AAr3KBoU-2cf84b9e55',
      published: '2020-02-28T13:55:40.345Z',
      updated: '2020-02-28T13:55:40.345Z',
      body: [{ content: 'note content 1', motivation: 'test' }],
      shortId: '1',
      next: '5'
    },
    {
      id: 'https://reader-api.test/notes/2',
      readerId: 'https://reader-api.test/readers/q3WCuzFju4zaw3AAr3KBoU',
      target: { property: 'something' },
      published: '2020-02-28T13:55:40.334Z',
      updated: '2020-02-28T13:55:40.334Z',
      body: [{ content: 'note content 2', motivation: 'test' }],
      type: 'Note',
      shortId: '2',
      parentId: '1',
      previous: '4'
    },
    {
      id: 'https://reader-api.test/notes/3',
      readerId: 'https://reader-api.test/readers/q3WCuzFju4zaw3AAr3KBoU',
      published: '2020-02-28T13:55:40.318Z',
      updated: '2020-02-28T13:55:40.318Z',
      body: [{ content: 'note content 3', motivation: 'test' }],
      type: 'Note',
      shortId: '3',
      parentId: '2',
      previous: '7',
      next: '8'
    },
    {
      id: 'https://reader-api.test/notes/4',
      readerId: 'https://reader-api.test/readers/q3WCuzFju4zaw3AAr3KBoU',
      target: { property: 'something' },
      published: '2020-02-28T13:55:40.382Z',
      updated: '2020-02-28T13:55:40.382Z',
      body: [{ content: 'note content 4', motivation: 'test' }],
      type: 'Note',
      shortId: '4',
      parentId: '1',
      next: '2'
    },
    {
      id: 'https://reader-api.test/notes/5',
      readerId: 'https://reader-api.test/readers/q3WCuzFju4zaw3AAr3KBoU',
      target: { property: 'something' },
      published: '2020-02-28T13:55:40.382Z',
      updated: '2020-02-28T13:55:40.382Z',
      body: [{ content: 'note content 5', motivation: 'test' }],
      type: 'Note',
      shortId: '5',
      previous: '1'
    },
    {
      id: 'https://reader-api.test/notes/6',
      readerId: 'https://reader-api.test/readers/q3WCuzFju4zaw3AAr3KBoU',
      target: { property: 'something' },
      published: '2020-02-28T13:55:40.382Z',
      updated: '2020-02-28T13:55:40.382Z',
      body: [{ content: 'note content 6', motivation: 'test' }],
      type: 'Note',
      shortId: '6',
      parentId: '4'
    },
    {
      id: 'https://reader-api.test/notes/7',
      readerId: 'https://reader-api.test/readers/q3WCuzFju4zaw3AAr3KBoU',
      target: { property: 'something' },
      published: '2020-02-28T13:55:40.382Z',
      updated: '2020-02-28T13:55:40.382Z',
      body: [{ content: 'note content 7', motivation: 'test' }],
      type: 'Note',
      shortId: '7',
      parentId: '2',
      next: '3'
    },
    {
      id: 'https://reader-api.test/notes/8',
      readerId: 'https://reader-api.test/readers/q3WCuzFju4zaw3AAr3KBoU',
      target: { property: 'something' },
      published: '2020-02-28T13:55:40.382Z',
      updated: '2020-02-28T13:55:40.382Z',
      body: [{ content: 'note content 8', motivation: 'test' }],
      type: 'Note',
      shortId: '8',
      parentId: '2',
      previous: '3'
    }
  ]

  await tap.test('should order list of notes into a tree', async () => {
    const result = notesListToTree(listOfNotes)
    await tap.equal(1, 1)

    // first level: 1, 5
    await tap.equal(result.length, 2)
    await tap.equal(result[0].shortId, '1')
    await tap.equal(result[1].shortId, '5')
    // 5 has no children
    await tap.equal(result[1].children.length, 0)
    // children of 1: 4, 2
    await tap.equal(result[0].children.length, 2)
    await tap.equal(result[0].children[0].shortId, '4')
    await tap.equal(result[0].children[1].shortId, '2')
    // children of 4: 6
    await tap.equal(result[0].children[0].children.length, 1)
    await tap.equal(result[0].children[0].children[0].shortId, '6')
    // children of 2: 7, 3 ,8
    await tap.equal(result[0].children[1].children.length, 3)
    await tap.equal(result[0].children[1].children[0].shortId, '7')
    await tap.equal(result[0].children[1].children[1].shortId, '3')
    await tap.equal(result[0].children[1].children[2].shortId, '8')
  })

  const badList = [
    {
      id: 'https://reader-api.test/notes/2',
      readerId: 'https://reader-api.test/readers/q3WCuzFju4zaw3AAr3KBoU',
      target: { property: 'something' },
      published: '2020-02-28T13:55:40.334Z',
      updated: '2020-02-28T13:55:40.334Z',
      body: [{ content: 'note content 2', motivation: 'test' }],
      type: 'Note',
      shortId: '2',
      parentId: '1',
      previous: '4'
    }
  ]

  await tap.test('list without a first item should fail', async () => {
    let error
    try {
      notesListToTree(badList)
    } catch (err) {
      error = err
    }
    await tap.ok(error)
    await tap.equal(error.message, 'Linked list does not have a first item')
  })

  const badList2 = [
    {
      id: 'https://reader-api.test/notes/2',
      readerId: 'https://reader-api.test/readers/q3WCuzFju4zaw3AAr3KBoU',
      target: { property: 'something' },
      published: '2020-02-28T13:55:40.334Z',
      updated: '2020-02-28T13:55:40.334Z',
      body: [{ content: 'note content 2', motivation: 'test' }],
      type: 'Note',
      shortId: '2',
      parentId: '1',
      next: '4'
    }
  ]

  await tap.test(
    'list with next item that cannot be found should fail',
    async () => {
      let error
      try {
        notesListToTree(badList2)
      } catch (err) {
        error = err
      }
      await tap.ok(error)
      await tap.equal(error.message, "cannot find 'next' item with id: 4")
    }
  )

  const badList3 = [
    {
      id: 'https://reader-api.test/notes/1',
      readerId: 'https://reader-api.test/readers/q3WCuzFju4zaw3AAr3KBoU',
      target: { property: 'something' },
      published: '2020-02-28T13:55:40.334Z',
      updated: '2020-02-28T13:55:40.334Z',
      body: [{ content: 'note content 1', motivation: 'test' }],
      type: 'Note',
      shortId: '1',
      next: '2'
    },
    {
      id: 'https://reader-api.test/notes/2',
      readerId: 'https://reader-api.test/readers/q3WCuzFju4zaw3AAr3KBoU',
      target: { property: 'something' },
      published: '2020-02-28T13:55:40.334Z',
      updated: '2020-02-28T13:55:40.334Z',
      body: [{ content: 'note content 2', motivation: 'test' }],
      type: 'Note',
      shortId: '2',
      next: '1'
    }
  ]
  await tap.test('circular linked list should fail', async () => {
    let error
    try {
      notesListToTree(badList3)
    } catch (err) {
      error = err
    }
    await tap.ok(error)
    await tap.equal(error.message, 'circular linked list')
  })
}
test()
