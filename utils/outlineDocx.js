// const _ = require('lodash')
const { Document, Paragraph, HeadingLevel, TextRun } = require('docx')

const sampleOutline = {
  id: 'https://reader-api.test/noteContexts/qXHmtzDveXqGpvKxRbofTf-c39b1e4829',
  name: 'My First Outline',
  description: 'description1',
  type: 'outline',
  json: { property: 'value1' },
  readerId: 'https://reader-api.test/readers/qXHmtzDveXqGpvKxRbofTf',
  published: '2021-06-21T15:20:23.840Z',
  updated: '2021-06-21T15:20:23.840Z',
  reader: {
    id: 'https://reader-api.test/readers/qXHmtzDveXqGpvKxRbofTf',
    name: null,
    preferences: null,
    profile: null,
    json: null,
    published: '2021-06-21T15:20:23.806Z',
    username: null,
    profilePicture: null,
    status: 'active',
    role: 'reader',
    updated: '2021-06-21T15:20:23.806Z',
    shortId: 'qXHmtzDveXqGpvKxRbofTf'
  },
  notes: [
    {
      id: 'https://reader-api.test/notes/hP8yQjvUtXvQx16KvaEN4s-f2e22efbf6',
      readerId: 'https://reader-api.test/readers/hP8yQjvUtXvQx16KvaEN4s',
      canonical: null,
      stylesheet: null,
      target: { property: 'something' },
      metadata: null,
      json: { type: 'header' },
      documentUrl: null,
      document: null,
      sourceId: null,
      original: null,
      contextId: 'hP8yQjvUtXvQx16KvaEN4s-162f7f7072',
      published: '2021-06-21T15:48:48.052Z',
      updated: '2021-06-21T15:48:48.122Z',
      deleted: null,
      relationsFrom: null,
      outlineData: null,
      relationsTo: null,
      body: [
        {
          id: '296f2ee5c3b82a6acc06261d3b6dd69c',
          noteId:
            'https://reader-api.test/notes/hP8yQjvUtXvQx16KvaEN4s-f2e22efbf6',
          content: 'header1',
          language: null,
          motivation: 'commenting',
          readerId: 'https://reader-api.test/readers/hP8yQjvUtXvQx16KvaEN4s',
          published: '2021-06-21T15:48:48.126Z',
          updated: '2021-06-21T15:48:48.127Z',
          deleted: null,
          formattedContent: 'header1'
        }
      ],
      tags: [],
      source: null,
      relations: [],
      shortId: 'hP8yQjvUtXvQx16KvaEN4s-f2e22efbf6',
      next: 'hP8yQjvUtXvQx16KvaEN4s-cc51c7da7b',
      previous: null,
      parentId: null,
      children: []
    },
    {
      id: 'https://reader-api.test/notes/qXHmtzDveXqGpvKxRbofTf-8b00e3cb73',
      readerId: 'https://reader-api.test/readers/qXHmtzDveXqGpvKxRbofTf',
      canonical: null,
      stylesheet: null,
      target: { property: 'something' },
      metadata: null,
      json: null,
      documentUrl: null,
      document: null,
      sourceId:
        'https://reader-api.test/sources/qXHmtzDveXqGpvKxRbofTf-29a107f8e4',
      original: null,
      contextId: 'qXHmtzDveXqGpvKxRbofTf-c39b1e4829',
      published: '2021-06-21T15:20:24.050Z',
      updated: '2021-06-21T15:20:24.090Z',
      deleted: null,
      relationsFrom: null,
      outlineData: null,
      relationsTo: null,
      body: [
        {
          id: 'b7859c46ef4cbee5f31843842a1380cd',
          noteId:
            'https://reader-api.test/notes/qXHmtzDveXqGpvKxRbofTf-8b00e3cb73',
          content:
            "This is a highlight from a source... .... .... making it longer. Why is copy paste not working? I want to copy from a lorem ipsum generator but it doesn't work for some reason. Grrrr. I hate this. So I will just keep typing crap in here. ",
          language: null,
          motivation: 'highlighting',
          readerId: 'https://reader-api.test/readers/qXHmtzDveXqGpvKxRbofTf',
          published: '2021-06-21T15:20:24.093Z',
          updated: '2021-06-21T15:20:24.094Z',
          deleted: null,
          formattedContent: 'This is a highlight from a source... .... .... '
        },
        {
          id: '5cffaf7d824810460ed248fe5e3e6553',
          noteId:
            'https://reader-api.test/notes/qXHmtzDveXqGpvKxRbofTf-8b00e3cb73',
          content:
            'this is a comment on the previous highlight. Once again, typing in some random stuff to make it longer. Blah blah blah. This is boring.',
          language: null,
          motivation: 'commenting',
          readerId: 'https://reader-api.test/readers/qXHmtzDveXqGpvKxRbofTf',
          published: '2021-06-21T15:20:24.095Z',
          updated: '2021-06-21T15:20:24.095Z',
          deleted: null,
          formattedContent: 'this is a comment on the previous highlight'
        }
      ],
      tags: [],
      source: {
        name: 'testSource',
        id:
          'https://reader-api.test/sources/qXHmtzDveXqGpvKxRbofTf-29a107f8e4/',
        shortId: 'qXHmtzDveXqGpvKxRbofTf-29a107f8e4'
      },
      relations: [],
      shortId: 'qXHmtzDveXqGpvKxRbofTf-8b00e3cb73',
      next: 'qXHmtzDveXqGpvKxRbofTf-46e1caefbf',
      previous: null,
      parentId: null,
      children: []
    },
    {
      id: 'https://reader-api.test/notes/qXHmtzDveXqGpvKxRbofTf-46e1caefbf',
      readerId: 'https://reader-api.test/readers/qXHmtzDveXqGpvKxRbofTf',
      canonical: null,
      stylesheet: null,
      target: { property: 'something' },
      metadata: null,
      json: null,
      documentUrl: null,
      document: null,
      sourceId:
        'https://reader-api.test/sources/qXHmtzDveXqGpvKxRbofTf-29a107f8e4',
      original: null,
      contextId: 'qXHmtzDveXqGpvKxRbofTf-c39b1e4829',
      published: '2021-06-21T15:20:24.060Z',
      updated: '2021-06-21T15:20:24.280Z',
      deleted: null,
      relationsFrom: null,
      outlineData: null,
      relationsTo: null,
      body: [
        {
          id: '35fe9daed77a499ae444029ea2317e11',
          noteId:
            'https://reader-api.test/notes/qXHmtzDveXqGpvKxRbofTf-46e1caefbf',
          content:
            'this is a highlight without a comment.... another random typing. Making this quote longer. Not sure how paragraphs work. Will there be html tags? because that could change things. Fun fun. I will have to keep the formatting somehow. ',
          language: null,
          motivation: 'highlighting',
          readerId: 'https://reader-api.test/readers/qXHmtzDveXqGpvKxRbofTf',
          published: '2021-06-21T15:20:24.288Z',
          updated: '2021-06-21T15:20:24.289Z',
          deleted: null,
          formattedContent: 'this is a highlight without a comment.... '
        }
      ],
      tags: [],
      source: {
        name: 'testSource',
        id:
          'https://reader-api.test/sources/qXHmtzDveXqGpvKxRbofTf-29a107f8e4/',
        shortId: 'qXHmtzDveXqGpvKxRbofTf-29a107f8e4'
      },
      relations: [],
      shortId: 'qXHmtzDveXqGpvKxRbofTf-46e1caefbf',
      next: 'qXHmtzDveXqGpvKxRbofTf-ba10bcc1bd',
      previous: 'qXHmtzDveXqGpvKxRbofTf-8b00e3cb73',
      parentId: null,
      children: []
    },
    {
      id: 'https://reader-api.test/notes/qXHmtzDveXqGpvKxRbofTf-ba10bcc1bd',
      readerId: 'https://reader-api.test/readers/qXHmtzDveXqGpvKxRbofTf',
      canonical: null,
      stylesheet: null,
      target: { property: 'something' },
      metadata: null,
      json: null,
      documentUrl: null,
      document: null,
      sourceId:
        'https://reader-api.test/sources/qXHmtzDveXqGpvKxRbofTf-29a107f8e4',
      original: null,
      contextId: 'qXHmtzDveXqGpvKxRbofTf-c39b1e4829',
      published: '2021-06-21T15:20:24.068Z',
      updated: '2021-06-21T15:20:24.374Z',
      deleted: null,
      relationsFrom: null,
      outlineData: null,
      relationsTo: null,
      body: [
        {
          id: 'b2b0d24a5bf74e84bc26065518523c51',
          noteId:
            'https://reader-api.test/notes/qXHmtzDveXqGpvKxRbofTf-ba10bcc1bd',
          content:
            "this is a comment on a source without a highlight.... ... ... making this a longer comment because it is fun. Or is it? Yeah, I'm sure it is. So I will keep typing and typing and typing. Ok, done now. Or am I? Yes, yes I am.",
          language: null,
          motivation: 'commenting',
          readerId: 'https://reader-api.test/readers/qXHmtzDveXqGpvKxRbofTf',
          published: '2021-06-21T15:20:24.385Z',
          updated: '2021-06-21T15:20:24.386Z',
          deleted: null,
          formattedContent:
            'this is a comment on a source without a highlight.... ... ... '
        }
      ],
      tags: [],
      source: {
        name: 'testSource',
        id:
          'https://reader-api.test/sources/qXHmtzDveXqGpvKxRbofTf-29a107f8e4/',
        shortId: 'qXHmtzDveXqGpvKxRbofTf-29a107f8e4'
      },
      relations: [],
      shortId: 'qXHmtzDveXqGpvKxRbofTf-ba10bcc1bd',
      next: 'qXHmtzDveXqGpvKxRbofTf-2168609125',
      previous: 'qXHmtzDveXqGpvKxRbofTf-46e1caefbf',
      parentId: null,
      children: []
    },
    {
      id: 'https://reader-api.test/notes/hP8yQjvUtXvQx16KvaEN4s-f2e22ef6f6',
      readerId: 'https://reader-api.test/readers/hP8yQjvUtXvQx16KvaEN4s',
      canonical: null,
      stylesheet: null,
      target: { property: 'something' },
      metadata: null,
      json: { type: 'header' },
      documentUrl: null,
      document: null,
      sourceId: null,
      original: null,
      contextId: 'hP8yQjvUtXvQx16KvaEN4s-162f7f7072',
      published: '2021-06-21T15:48:48.052Z',
      updated: '2021-06-21T15:48:48.122Z',
      deleted: null,
      relationsFrom: null,
      outlineData: null,
      relationsTo: null,
      body: [
        {
          id: '296f2ee5c3b82a6acc06261d3b6dd69c',
          noteId:
            'https://reader-api.test/notes/hP8yQjvUtXvQx16KvaEN4s-f2e22efbf6',
          content: 'header2',
          language: null,
          motivation: 'commenting',
          readerId: 'https://reader-api.test/readers/hP8yQjvUtXvQx16KvaEN4s',
          published: '2021-06-21T15:48:48.126Z',
          updated: '2021-06-21T15:48:48.127Z',
          deleted: null,
          formattedContent: 'header1'
        }
      ],
      tags: [],
      source: null,
      relations: [],
      shortId: 'hP8yQjvUtXvQx16KvaEN4s-f2e22efbf6',
      next: 'hP8yQjvUtXvQx16KvaEN4s-cc51c7da7b',
      previous: null,
      parentId: null,
      children: []
    },
    {
      id: 'https://reader-api.test/notes/qXHmtzDveXqGpvKxRbofTf-2168609125',
      readerId: 'https://reader-api.test/readers/qXHmtzDveXqGpvKxRbofTf',
      canonical: null,
      stylesheet: null,
      target: { property: 'something' },
      metadata: null,
      json: null,
      documentUrl: null,
      document: null,
      sourceId: null,
      original: null,
      contextId: 'qXHmtzDveXqGpvKxRbofTf-c39b1e4829',
      published: '2021-06-21T15:20:24.076Z',
      updated: '2021-06-21T15:20:24.475Z',
      deleted: null,
      relationsFrom: null,
      outlineData: null,
      relationsTo: null,
      body: [
        {
          id: '5cc0386b927aa1b1fafb152ad8fab9d4',
          noteId:
            'https://reader-api.test/notes/qXHmtzDveXqGpvKxRbofTf-2168609125',
          content:
            '<p>this is a note that does not belong to a <b>source</b>... ... ... </p>',
          language: null,
          motivation: 'commenting',
          readerId: 'https://reader-api.test/readers/qXHmtzDveXqGpvKxRbofTf',
          published: '2021-06-21T15:20:24.483Z',
          updated: '2021-06-21T15:20:24.484Z',
          deleted: null,
          formattedContent:
            'this is a note that does not belong to a source... ... ... '
        }
      ],
      tags: [],
      source: null,
      relations: [],
      shortId: 'qXHmtzDveXqGpvKxRbofTf-2168609125',
      next: null,
      previous: 'qXHmtzDveXqGpvKxRbofTf-ba10bcc1bd',
      parentId: null,
      children: []
    }
  ],
  shortId: 'qXHmtzDveXqGpvKxRbofTf-c39b1e4829'
}

const titleStyle = {
  id: 'title',
  name: 'Title',
  basedOn: 'Normal',
  next: 'Normal',
  run: {
    size: 18,
    bold: true
  }
}

const headingStyle = {
  id: 'Heading1',
  name: 'Heading 1',
  basedOn: 'Normal',
  quickFormat: true,
  run: {
    size: 24,
    bold: true
  }
}

const highlightStyle = {
  id: 'highlight',
  name: 'Highlight',
  basedOn: 'Normal',
  next: 'Normal',
  run: {
    size: 10
  },
  paragraph: {
    indent: {
      left: 500,
      right: 500
    }
  }
}

const commentStyle = {
  id: 'comment',
  name: 'Comment',
  basedOn: 'Normal',
  quickFormat: true,
  font: {
    size: 22
  }
}

const referenceStyle = {
  id: 'reference',
  name: 'Reference',
  basedOn: 'Normal',
  next: 'Normal',
  run: {
    size: 10
  }
}

const outlineToDocx = outline => {
  outline = sampleOutline

  const children = []
  if (outline.name) {
    children.push(
      new Paragraph({
        text: outline.name,
        heading: HeadingLevel.HEADING_1
      })
    )
  }

  outline.notes.forEach(note => {
    if (note.json && note.json.type === 'header') {
      children.push(
        new Paragraph({
          text: note.body[0].content,
          heading: HeadingLevel.HEADING_2
        })
      )
    } else {
      note.body.forEach(body => {
        if (body.motivation === 'commenting') {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: body.content,
                  font: 'Calibri',
                  size: 24
                })
              ]
            })
          )
        } else if (body.motivation === 'highlighting') {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `"${body.content}"`,
                  font: 'Calibri',
                  size: 20
                })
              ],
              indent: {
                left: 300,
                right: 300
              }
            })
          )
        }
      })
      if (note.source) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `-- ${note.source.name}`,
                font: 'Calibri',
                size: 18
              })
            ],
            indent: {
              left: 300
            }
          })
        )
      }
      children.push(new Paragraph({ text: '' }))
    }
  })

  const outlineDoc = new Document({
    title: outline.name,
    styles: [headingStyle, commentStyle],
    sections: [
      {
        children: children
      }
    ]
  })
  return outlineDoc
}

module.exports = { outlineToDocx }
