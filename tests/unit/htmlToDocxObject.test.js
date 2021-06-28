const tap = require('tap')
const { htmlToDocxObject, getHref } = require('../../utils/htmlForDocx')
const _ = require('lodash')

const test = async () => {
  await tap.test('extract bold text', async () => {
    let result = htmlToDocxObject(
      '<p>text here<b> with bold text</b> and then not</p>'
    )
    result = result[0].sections
    await tap.equal(result.length, 3)
    await tap.equal(result[0].text, 'text here')
    await tap.notOk(result[0].bold)
    await tap.equal(result[1].text, ' with bold text')
    await tap.equal(result[1].bold, true)
    await tap.equal(result[2].text, ' and then not')
    await tap.notOk(result[2].bold)
  })
  await tap.test('extract bold text with multiple bold sections', async () => {
    let result = htmlToDocxObject(
      '<p>text here<b> with bold text</b> and then not <b>and then bold again!</b></p>'
    )
    result = result[0].sections
    await tap.equal(result.length, 4)
    await tap.equal(result[0].text, 'text here')
    await tap.notOk(result[0].bold)
    await tap.equal(result[1].text, ' with bold text')
    await tap.equal(result[1].bold, true)
    await tap.equal(result[2].text, ' and then not ')
    await tap.notOk(result[2].bold)
    await tap.equal(result[3].text, 'and then bold again!')
    await tap.equal(result[3].bold, true)
  })
  await tap.test('extract italics text', async () => {
    let result = htmlToDocxObject(
      '<p>text here<em> with italics text</em> and then not</p>'
    )
    result = result[0].sections
    await tap.equal(result.length, 3)
    await tap.equal(result[0].text, 'text here')
    await tap.notOk(result[0].italics)
    await tap.equal(result[1].text, ' with italics text')
    await tap.equal(result[1].italics, true)
    await tap.equal(result[2].text, ' and then not')
    await tap.notOk(result[2].italics)
  })

  await tap.test('extract italics and bold text', async () => {
    let result = htmlToDocxObject(
      '<p>text here<em> with italics text <b>and bold</b></em> and then not</p>'
    )
    result = result[0].sections
    await tap.equal(result.length, 4)
    await tap.equal(result[0].text, 'text here')
    await tap.notOk(result[0].italics)
    await tap.notOk(result[0].bold)
    await tap.equal(result[1].text, ' with italics text ')
    await tap.equal(result[1].italics, true)
    await tap.notOk(result[1].bold, false)
    await tap.equal(result[2].text, 'and bold')
    await tap.equal(result[2].italics, true)
    await tap.equal(result[2].bold, true)
    await tap.equal(result[3].text, ' and then not')
    await tap.notOk(result[3].italics)
    await tap.notOk(result[3].bold)
  })
  await tap.test('extract italics and bold text with overlap', async () => {
    let result = htmlToDocxObject(
      '<p>text here<em> with italics text <b>and bold </em> still bold but no longer italics</b> and then not</p>'
    )
    result = result[0].sections
    await tap.equal(result.length, 5)
    await tap.equal(result[0].text, 'text here')
    await tap.notOk(result[0].italics)
    await tap.notOk(result[0].bold)
    await tap.equal(result[1].text, ' with italics text ')
    await tap.equal(result[1].italics, true)
    await tap.notOk(result[1].bold)
    await tap.equal(result[2].text, 'and bold ')
    await tap.equal(result[2].italics, true)
    await tap.equal(result[2].bold, true)
    await tap.equal(result[3].text, ' still bold but no longer italics')
    await tap.equal(result[3].bold, true)
    await tap.notOk(result[3].italics)
    await tap.equal(result[4].text, ' and then not')
    await tap.notOk(result[4].italics)
    await tap.notOk(result[4].bold)
  })

  await tap.test('extract anchor tag', async () => {
    let result = htmlToDocxObject(
      '<p>some text <a href="http://www.google.ca">link to google!</a></p>'
    )
    result = result[0].sections
    await tap.equal(result.length, 2)
    await tap.equal(result[0].text, 'some text ')
    await tap.notOk(result[0].italics)
    await tap.notOk(result[0].bold)
    await tap.equal(result[1].text, 'link to google!')
    await tap.notOk(result[1].italics)
    await tap.notOk(result[1].bold)
    await tap.equal(result[1].link, 'http://www.google.ca')
  })

  await tap.test('extract two anchor tags', async () => {
    let result = htmlToDocxObject(
      `<p>some text <a href="http://www.google.ca">link to google!</a> and another link: <a href="http://www.something.org">something!</a></p>`
    )
    result = result[0].sections
    await tap.equal(result.length, 4)
    await tap.equal(result[0].text, 'some text ')
    await tap.notOk(result[0].italics)
    await tap.notOk(result[0].bold)
    await tap.equal(result[1].text, 'link to google!')
    await tap.notOk(result[1].italics)
    await tap.notOk(result[1].bold)
    await tap.equal(result[1].link, 'http://www.google.ca')
    await tap.equal(result[2].text, ' and another link: ')
    await tap.notOk(result[2].italics)
    await tap.notOk(result[2].bold)
    await tap.equal(result[3].text, 'something!')
    await tap.notOk(result[3].italics)
    await tap.notOk(result[3].bold)
    await tap.equal(result[3].link, 'http://www.something.org')
  })

  await tap.test('extract anchor tag with bold mixed into it.', async () => {
    let result = htmlToDocxObject(
      '<p>some <b>text <a href="http://www.google.ca">link to </b> google!</a></p>'
    )
    result = result[0].sections
    await tap.equal(result.length, 4)
    await tap.equal(result[0].text, 'some ')
    await tap.notOk(result[0].italics)
    await tap.notOk(result[0].bold)
    await tap.equal(result[1].text, 'text ')
    await tap.equal(result[1].bold, true)
    await tap.notOk(result[1].italics)
    await tap.notOk(result[1].link)
    await tap.equal(result[2].text, 'link to ')
    await tap.notOk(result[2].italics)
    await tap.equal(result[2].bold, true)
    await tap.equal(result[2].link, 'http://www.google.ca')
    await tap.equal(result[3].text, ' google!')
    await tap.notOk(result[3].italics)
    await tap.notOk(result[3].bold)
    await tap.equal(result[3].link, 'http://www.google.ca')
  })
  await tap.test('extract bold text inside a blockquote', async () => {
    let result = htmlToDocxObject(
      '<blockquote>text here<b> with bold text</b> and then not</blockquote>'
    )
    sections = result[0].sections
    await tap.equal(result.length, 1)
    await tap.equal(result[0].paragraphType, 'quote')

    await tap.equal(sections.length, 3)
    await tap.equal(sections[0].text, 'text here')
    await tap.notOk(sections[0].bold)
    await tap.equal(sections[1].text, ' with bold text')
    await tap.equal(sections[1].bold, true)
    await tap.equal(sections[2].text, ' and then not')
    await tap.notOk(sections[2].bold)
  })
  await tap.test('extract paragraph and blockquote', async () => {
    let result = htmlToDocxObject(
      '<p>paragraph 1 is here</p><blockquote>blockquote is here <b>with bold!</b></blockquote><p>and another paragraph</p>'
    )
    sections = result[0].sections
    await tap.equal(result.length, 3)
    await tap.equal(result[0].paragraphType, 'paragraph')
    await tap.equal(result[0].sections.length, 1)
    await tap.equal(result[0].sections[0].text, 'paragraph 1 is here')
    await tap.equal(result[1].paragraphType, 'quote')
    await tap.equal(result[1].sections.length, 2)
    await tap.equal(result[1].sections[0].text, 'blockquote is here ')
    await tap.equal(result[1].sections[1].text, 'with bold!')
    await tap.equal(result[1].sections[1].bold, true)
    await tap.equal(result[2].paragraphType, 'paragraph')
    await tap.equal(result[2].sections.length, 1)
    await tap.equal(result[2].sections[0].text, 'and another paragraph')
  })

  await tap.test('extract list', async () => {
    let result = htmlToDocxObject(
      '<p>list:</p><ul><li><b>bold </b>or not</li><li><em>italics</em></li></ul>'
    )
    sections = result[0].sections
    await tap.equal(result.length, 3)
    await tap.equal(result[0].paragraphType, 'paragraph')
    await tap.equal(result[0].sections.length, 1)
    await tap.equal(result[0].sections[0].text, 'list:')
    await tap.equal(result[1].paragraphType, 'bullet')
    await tap.equal(result[1].sections.length, 2)
    await tap.equal(result[1].sections[0].text, 'bold ')
    await tap.equal(result[1].sections[0].bold, true)
    await tap.equal(result[1].sections[1].text, 'or not')
    await tap.equal(result[2].paragraphType, 'bullet')
    await tap.equal(result[2].sections.length, 1)
    await tap.equal(result[2].sections[0].text, 'italics')
    await tap.equal(result[2].sections[0].italics, true)
  })
}
test()
