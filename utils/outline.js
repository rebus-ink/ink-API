const { arrayToTree } = require('performant-array-to-tree')
const _ = require('lodash')
const { urlToId } = require('./utils')

const orderLinkedList = list => {
  const orderedList = []

  const firstOfLists = list.filter(item => !item.previous)
  if (firstOfLists.length === 0) {
    throw new Error('Linked list does not have a first item')
  }
  firstOfLists.forEach(first => {
    orderedList.push(first)
    let current = first
    while (current.next) {
      let next = _.find(list, { shortId: current.next })
      if (!next) {
        throw new Error(`cannot find 'next' item with id: ${current.next}`)
      }
      orderedList.push(next)
      if (orderedList.length > list.length) {
        throw new Error('circular linked list')
      }
      current = next
    }
  })

  return orderedList
}

const notesListToTree = notes => {
  if (notes.length === 0) return notes
  notes = notes.map(note => {
    note.shortId = urlToId(note.id)
    return note
  })

  const orderedList = orderLinkedList(notes)
  if (orderedList.length !== notes.length) {
    throw new Error('Invalid linked list')
  }

  let tree = arrayToTree(orderedList, {
    id: 'shortId',
    dataField: null
    // throwIfOrphans: true
  })

  return tree
}

module.exports = { notesListToTree }
