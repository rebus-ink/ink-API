# Activity Documentation

The main documentation for the API endpoints can be found [here](https://rebusfoundation.github.io/reader-api). However, since we are using the activityPub standard, the POST /{readerId}/outbox endpoint encompasses a lot of different activities.

This document provides examples for different activities that are implemented at the POST /{readerId}/outbox endpoint.

In all cases, the endpoint will return a 201 status and a Location that is the url of the activity created.

## Publications

### Create a Publication

Example:

```
{
    "@context": [
      "https://www.w3.org/ns/activitystreams",
      { "reader": "https://rebus.foundation/ns/reader" }
    ],
    "type": "Create",
    "object": {
      "type": "reader:Publication",
      "name": "Publication A",
      "attributedTo": [
        {
          "type": "Person",
          "name": "Sample Author"
        }
      ],
      "attachment": [
        {
          "type": "Document",
          "name": "Chapter 9",
          "position": 1,
          "content": "Sample document content 1"
        },
        {
          "type": "Document",
          "name": "Chapter 2",
          "position": 0,
          "content": "Sample document content 2"
        }
      ]
    }
  }
```

Required properties:

```
"@context": [
    "https://www.w3.org/ns/activitystreams",
    { "reader": "https://rebus.foundation/ns/reader" }
  ],
  "type": "Create",
"object": {
  "type": "reader:Publication",
  "name": <string>
}
```

Documents attached to a publication will also be created and will belong to the publication. Alternatively, they can be created separately through the Create Document activity (see below)

### Delete a Publication

Example:

```
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    { "reader": "https://rebus.foundation/ns/reader" }
  ],
  "type": "Delete",
  "object": {
    "type": "reader:Publication",
    "id": <publicationUrl>
  }
}
```

### Other

Other activities related to Publications:
create document (see documents section)
assign tag to publication (see tags section)

## Documents

### Create a Document

Example:

```
{
  '@context': [
    'https://www.w3.org/ns/activitystreams',
    { reader: 'https://rebus.foundation/ns/reader' }
  ],
  type: 'Create',
  object: {
    type: 'Document',
    name: 'Document A',
    content: 'This is the content of document A.',
    context: <PublicationUrl>
  }
}
```

This will create a document that will be attached to the publication specified in object.context

### Read Activity

Example:

```
{
  '@context': [
    'https://www.w3.org/ns/activitystreams',
    { reader: 'https://rebus.foundation/ns/reader' },
    { oa: 'http://www.w3.org/ns/oa#' }
  ],
  type: 'Read',
  object: { type: 'Document', id: <documentUrl> },
  context: <publicationUrl>,
  'oa:hasSelector': {
    type: 'XPathSelector',
    value: '/html/body/p[2]/table/tr[2]/td[3]/span'
  }
}
```

Once read activity is attached to a document, getting that document will return the latest read activity for that document position in the 'position' property
Similarly, getting the publication will return the latest read activity attached to any of its documents.

## Notes

Also known as annotations

### Create a Note

Example:

```
{
  '@context': [
    'https://www.w3.org/ns/activitystreams',
    { reader: 'https://rebus.foundation/ns/reader' }
  ],
  type: 'Create',
  object: {
    type: 'Note',
    content: <string>,
    'oa:hasSelector': {},
    context: <publicationUrl>,
    inReplyTo: <documentUrl>
  }
}
```

This will create a note that is attached to the document specified in object.inReplyTo, in the context of the publication in object.context

The specific location of the annotation within the document is specified by the oa:hasSelector object
ADD LINK

### Edit a Note

Example:

```
{
  '@context': [
    'https://www.w3.org/ns/activitystreams',
    { reader: 'https://rebus.foundation/ns/reader' }
  ],
  type: 'Update',
  object: {
    type: 'Note',
    id: <noteUrl>,
    content: <string>,
    'oa:hasSelector': {}
  }
}
```

The API supports changes to either the content or the oa:hasSelector, or both. These properties only need to be included in the object only if they are changed.

### Delete a Note

Example:

```
{
  '@context': [
    'https://www.w3.org/ns/activitystreams',
    { reader: 'https://rebus.foundation/ns/reader' }
  ],
  type: 'Delete',
  object: {
    type: 'Note',
    id: <noteUrl>
  }
}
```

## Tags

Currently, only tags of the type reader:Stack are supported by the API. Those are used to organize publications into stacks or collections.

### Create a Tag

Example:

```
{
  '@context': [
    'https://www.w3.org/ns/activitystreams',
    { reader: 'https://rebus.foundation/ns/reader' }
  ],
  type: 'Create',
  object: {
    type: 'reader:Stack',
    name: <string>
  }
}
```

### Asssign a Tag to a Publication

Example:

```
{
  '@context': [
    'https://www.w3.org/ns/activitystreams',
    { reader: 'https://rebus.foundation/ns/reader' }
  ],
  type: 'Add',
  object: {
    id: <noteId>
    type: 'reader:Stack'
  },
  target: {
    id: <publicationId>
  }
}
```

If the tag was already assigned to the publication, the API will return error 400: 'publication {publicationId} already associated with tag {tagId} ({tag name})'

object can contain the entire note object, as returned as a reply to the GET document route. But only the id and the type are required.

Similarly, target can contain the entire publication object, but only the id proeprty is required.

### Remove Tag from Publication

```
{
  '@context': [
    'https://www.w3.org/ns/activitystreams',
    { reader: 'https://rebus.foundation/ns/reader' }
  ],
  type: 'Remove',
  object: {
    id: <noteId>
    type: 'reader:Stack'
  },
  target: {
    id: <publicationId>
  }
}
```
