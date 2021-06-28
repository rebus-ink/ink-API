const _ = require('lodash')
const striptags = require('striptags')

// Get starting index for a html tag
const getIndexes = (text, tag) => {
  const indexes = []
  let index = text.indexOf(tag)
  if (index > -1) {
    indexes.push(index)
    while (index < text.length && index > -1) {
      index = text.indexOf(tag, index + 1)
      if (index > -1) {
        indexes.push(index)
      }
    }
  }
  return indexes.map(item => {
    return { index: item, tag }
  })
}

// extract href link
const getHref = text => {
  const index = text.indexOf('href=')
  let string1 = text.substring(index + 'href="'.length)
  let indexEnd
  if (text[index + 'href='.length] === '"') {
    indexEnd = string1.indexOf('"')
  } else {
    indexEnd = string1.indexOf("'")
  }
  return string1.substring(0, indexEnd)
}

const htmlToDocxObject = html => {
  let paragraphs = []
  let blockquoteStarts = getIndexes(html, '<blockquote>')
  let blockquoteEnds = getIndexes(html, '</blockquote>')
  let bulletStarts = getIndexes(html, '<li>')
  let bulletEnds = getIndexes(html, '</li>')
  let cuts = [
    ...blockquoteStarts,
    ...blockquoteEnds,
    ...bulletStarts,
    ...bulletEnds
  ]
  cuts = cuts.sort((a, b) => a.index - b.index)

  if (cuts.length === 0) {
    return [
      {
        sections: styling(html),
        paragraphType: 'paragraph'
      }
    ]
  }
  let paragraphType = 'paragraph'

  // first item
  paragraphs.push({
    text: html.substring(0, cuts[0].index),
    paragraphType
  })

  cuts.forEach((cut, i) => {
    switch (cut.tag) {
      case '<blockquote>':
        paragraphType = 'quote'
        break
      case '</blockquote>':
        paragraphType = 'paragraph'
        break
      case '<li>':
        paragraphType = 'bullet'
        break
      case '</li>':
        paragraphType = 'paragraph'
        break
    }
    let nextIndex = cuts[i + 1] ? cuts[i + 1].index : html.length
    // set the starting point to after the tag
    let startIndex = cut.index + cut.tag.length

    paragraphs.push({
      text: html.substring(startIndex, nextIndex),
      paragraphType
    })
    currentIndex = nextIndex
  })

  paragraphs = paragraphs.map(paragraph => {
    return {
      text: striptags(paragraph.text, ['a', 'b', 'em']),
      paragraphType: paragraph.paragraphType
    }
  })
  paragraphs = paragraphs.filter(object => {
    return object.text.length > 0
  })
  paragraphs = paragraphs.map(object => {
    return {
      sections: styling(object.text),
      paragraphType: object.paragraphType
    }
  })

  return paragraphs
}

const styling = html => {
  let objects = []
  let boldStarts = getIndexes(html, '<b>')
  let boldEnds = getIndexes(html, '</b>')
  let italicsStarts = getIndexes(html, '<em>')
  let italicsEnd = getIndexes(html, '</em>')
  let linkStarts = getIndexes(html, '<a')
  let linkEnds = getIndexes(html, '</a>')
  let cuts = [
    ...boldStarts,
    ...boldEnds,
    ...italicsStarts,
    ...italicsEnd,
    ...linkStarts,
    ...linkEnds
  ]
  cuts = cuts.sort((a, b) => a.index - b.index)

  let currentStyle = {
    bold: false,
    italics: false
  }

  if (cuts.length === 0) {
    return [
      {
        text: striptags(html),
        bold: false,
        italics: false
      }
    ]
  }

  // first item
  objects.push({
    text: html.substring(0, cuts[0].index),
    bold: false,
    italics: false,
    link: null
  })

  cuts.forEach((cut, i) => {
    switch (cut.tag) {
      case '<b>':
        currentStyle.bold = true
        break
      case '</b>':
        currentStyle.bold = false
        break
      case '<em>':
        currentStyle.italics = true
        break
      case '</em>':
        currentStyle.italics = false
        break
      case '<a':
        currentStyle.link = getHref(html.substring(cut.index))
        break
      case '</a>':
        currentStyle.link = null
        break
    }
    let nextIndex = cuts[i + 1] ? cuts[i + 1].index : html.length
    // set the starting point to after the tag
    let startIndex
    if (cut.tag === '<a') {
      startIndex = html.indexOf('>', cut.index) + 1
    } else {
      startIndex = cut.index + cut.tag.length
    }

    objects.push({
      text: html.substring(startIndex, nextIndex),
      bold: currentStyle.bold,
      italics: currentStyle.italics,
      link: currentStyle.link
    })
    currentIndex = nextIndex
  })

  objects = objects.map(object => {
    return {
      text: striptags(object.text),
      bold: object.bold,
      italics: object.italics,
      link: object.link
    }
  })
  objects = objects.filter(object => {
    return object.text.length > 0
  })
  return objects
}

module.exports = { htmlToDocxObject }
