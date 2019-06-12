# Activity Documentation

The main documentation for the API endpoints can be found [here](https://rebusfoundation.github.io/reader-api). However, since we are using the activityPub standard, the POST /{readerId}/outbox endpoint encompasses a lot of different activities.

This document provides examples for different activities that are implemented at the POST /{readerId}/outbox endpoint.

In all cases, the endpoint will return a 201 status and a Location that is the url of the activity created.

General Errors:
These errors can be thrown on various activities

* 404: 'No reader with id {id}'
* 403: 'Access to reader {id} disallowed'
* 400: 'action {action type} not recognized' - action type should be one of 'Create', 'Add', 'Remove', 'Delete', 'Update', 'Read'
* 400: 'cannot {verb} {type}' e.g. 'cannot delete Document'. Object types can be 'reader:Publication', 'Document', 'Note', 'reader:Tag'. But not all action - object combinations are supported. For example, Update reader:Publication is not supported.

## Publications

### Create a Publication

Example:

```
{
    "@context": [
      "https://www.w3.org/ns/activitystreams",
      { reader: "https://rebus.foundation/ns/reader" }
    ],
    type: "Create",
    object: {
      type: "Publication",
      name: "Publication A",
      author: ['John Smith'],
      editor: 'Jane Doe',
      description: 'Some description here',
      links: [
              {
                '@context': 'https://www.w3.org/ns/activitystreams',
                href: 'http://example.org/abc',
                hreflang: 'en',
                mediaType: 'text/html',
                name: 'An example link'
              }
            ],
      readingOrder: [
              {
                '@context': 'https://www.w3.org/ns/activitystreams',
                href: 'http://example.org/abc',
                hreflang: 'en',
                mediaType: 'text/html',
                name: 'An example reading order object1'
              },
              {
                '@context': 'https://www.w3.org/ns/activitystreams',
                href: 'http://example.org/abc',
                hreflang: 'en',
                mediaType: 'text/html',
                name: 'An example reading order object2'
              },
              {
                '@context': 'https://www.w3.org/ns/activitystreams',
                href: 'http://example.org/abc',
                hreflang: 'en',
                mediaType: 'text/html',
                name: 'An example reading order object3'
              }
            ],
      resources: [
              {
                '@context': 'https://www.w3.org/ns/activitystreams',
                href: 'http://example.org/abc',
                hreflang: 'en',
                mediaType: 'text/html',
                name: 'An example resource'
              }
            ],
      json: { property: 'value' }
    }
  }
```

Required properties:

```
"@context": [
    "https://www.w3.org/ns/activitystreams",
    { "reader": "https://rebus.foundation/ns/reader" }
  ],
  type: "Create",
object: {
  type: "Publication",
  name: <string>,
  readingOrder: Array<LinkObjects>
}
```

Notes:

author and editor are either strings or objects with those properties:
{ name: 'John Smith', type: 'Person' } (type can also be 'Organization'). If only a string is passed, type is assume to be 'Person'.
author and editor can also be an array of strings or objects.
Those are all valid values for either 'author' or 'editor':

* 'John Smith'
* ['John Smith']
* [{name: 'Acme Cie.', type: 'Organization}]
* ['John Smith', 'Jane Doe']
* [{name: 'John Smith', type: 'Person'}, 'Jane Doe']

Links, ReadingOrder and Resources should be arrays of Link objects. See example above.

Possible errors:

* 400 'Validation Error on Create Publication' - see details of error object to find out if missing a required property, using wrong type for a property, etc.

### Update a Publication

It is possible to update the following properties of a publication:

* name
* description
* datePublished
* json
* readingOrder
* resources
* links
* author
* editor
* inLanguage
* keywords

Example:

```
{
  '@context': [
    'https://www.w3.org/ns/activitystreams',
    { reader: 'https://rebus.foundation/ns/reader' }
  ],
  type: 'Update',
  object: {
    type: 'Publication',
    id: <publicationUrl>,
    name: <string>,
    datePublished: <timestamp>,
    description: <string>,
    json: <Object>,
    inLanguage: Array<string>,
    keywords: Array<string>,
    author: Array<LinkObjects>,
    editor: Array<LinkObjects>
  }
}
```

Possible errors:

* 404: 'no publication found with id {id}'
* 400 'Validation error on Update Publication' - see details of error message

### Delete a Publication

Example:

```
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    { reader: "https://rebus.foundation/ns/reader" }
  ],
  type: "Delete",
  object: {
    type: "Publication",
    id: <publicationId>
  }
}
```

Possible errors:

* 404: 'publication with id {id} does not exist or has already been deleted'

### Other

Other activities related to Publications:
create document (see documents section)
assign tag to publication (see tags section)

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
  context: <publicationUrl>,
  'oa:hasSelector': {
    type: 'XPathSelector',
    value: '/html/body/p[2]/table/tr[2]/td[3]/span'
  },
  json: {property: 'value'}
}
```

Required properties:

```
{
  "@context": [
      "https://www.w3.org/ns/activitystreams",
      { "reader": "https://rebus.foundation/ns/reader" }
    ],
    type: "Read",
    context: <publicationId>,
    'oa:hasSelector': <object>
}
```

Possible errors:

* 404 'no publicaiton found with id {id}' - check the context property
* 400 'Validation rror on create ReadActivity' - see details of error

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
    inReplyTo: <documentUrl>,
    noteType: <string>
  }
}
```

Required Properties:

```
"@context": [
    "https://www.w3.org/ns/activitystreams",
    { reader: "https://rebus.foundation/ns/reader" }
  ],
  type: "Create",
  object: {
    type: "Note",
    noteType: <string>
}
```

This will create a note that is (optionally) attached to the document specified in object.inReplyTo, in the context of the publication in object.context (also optional)

The specific location of the annotation within the document is specified by the oa:hasSelector object

Possible errors:

* 404: 'note creation failed: no publication found with id {id}' - publication id in note.context must point to an existing publication
* 404: 'note creation failed: no document found with id {id}' - document id in note.inReplyTo must point to an existing document
* 400: 'Validation Error on Create Note' - see details of error

### Update a Note

It is possible to update the following properties of a note:

* oa:hasSelector
* content
* json

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
    content: <string>
  }
}
```

The API supports changes to either the content or the oa:hasSelector, or both. These properties only need to be included in the object only if they are changed.

Possible errors:

* 404: 'no note found with id {id}'
* 400: 'Validation error on Update Note' - see details of error

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

Possible errors:

* 404: 'note with id {id} does not exist or has already been deleted'

## Tags

Tags of the tagType reader:Stack are used to organize publications into stacks or collections.
It is possible to create tags with other types.

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
    type: 'reader:Tag',
    tagType: <string> // e.g. 'reader:Stack' for collections
    name: <string>,
    json: {object} // optional
  }
}
```

Possible errors:

* 400: 'duplicate error: stack {message}' - generic error that occurs on createTag when you try to create a stack that already exists.
* 400 'Validation error on create Tag' - see details of error

### Assign a Tag to a Publication

Example:

```
{
  '@context': [
    'https://www.w3.org/ns/activitystreams',
    { reader: 'https://rebus.foundation/ns/reader' }
  ],
  type: 'Add',
  object: {
    id: <tagId>
    type: 'reader:Tag'
  },
  target: {
    id: <publicationId>
    type: 'Publication'
  }
}
```

object can contain the entire tag object. But only the id and the type are required.

target contains the id of the publication, as well as a property 'type' with value 'Publication' that indicates that the Tag is assigned to a Publication.

Possible errors:

* 400 'cannot add without an object' - missing body.object
* 400 'cannot add without a target' - missing body.target
* 400 'cannot add without a target type' - missing body.target.type
* 400 'cannot add without an object type' - missing body.object.type
* 404 'no publiation found with id {id}'
* 404 'no tag found with id {id}'
* 400 'publication {publicationId} already associated with tag {tagId} ({tag name})'

### Assign a Tag to a Note

Example:

```
{
  '@context': [
    'https://www.w3.org/ns/activitystreams',
    { reader: 'https://rebus.foundation/ns/reader' }
  ],
  type: 'Add',
  object: {
    id: <tagId>
    type: 'reader:Tag'
  },
  target: {
    id: <noteId>
    type: 'Note'
  }
}
```

object can contain the entire tag object, as returned as a reply to the GET document route. But only the id and the type are required.

target contains the id of the note, as well as a property 'type' with value 'Note' that indicates that the Tag is assigned to a Publication.

Possible errors:

* 400 'cannot add without an object' - missing body.object
* 400 'cannot add without a target' - missing body.target
* 400 'cannot add without a target type' - missing body.target.type
* 400 'cannot add without an object type' - missing body.object.type
* 404 'no note found with id {id}'
* 404 'no tag found with id {id}'
* 400 'note {noteid} already associated with tag {tagId} ({tag name})'

### Remove Tag from Publication

```
{
  '@context': [
    'https://www.w3.org/ns/activitystreams',
    { reader: 'https://rebus.foundation/ns/reader' }
  ],
  type: 'Remove',
  object: {
    id: <tagId>
    type: 'reader:Tag'
  },
  target: {
    id: <publicationId>
    type: 'Publication'
  }
}
```

Possible errors:

* 400 'cannot remove without an object' - missing body.object
* 400 'cannot remove without an object type' - missing body.object.type
* 400 'cannot remove without a target' - missing body.target
* 400 'cannot remove without a target type' - missing body.target.type
* 404 'no publication provided'
* 404 'no tag provided'
* 404 'no relationship found between tag {tag} and publication {id}'

### Remove Tag from Note

```
{
  '@context': [
    'https://www.w3.org/ns/activitystreams',
    { reader: 'https://rebus.foundation/ns/reader' }
  ],
  type: 'Remove',
  object: {
    id: <tagId>
    type: 'reader:Tag'
  },
  target: {
    id: <noteId>
    type: 'Note'
  }
}
```

Possible errors:

* 400 'cannot remove without an object' - missing body.object
* 400 'cannot remove without an object type' - missing body.object.type
* 400 'cannot remove without a target' - missing body.target
* 400 'cannot remove without a target type' - missing body.target.type
* 404 'no note provided'
* 404 'no tag provided'
* 404 'no relationship found between tag {tag} and note {id}'

### Delete a Tag

Example:

```
{
  '@context': [
    'https://www.w3.org/ns/activitystreams',
    { reader: 'https://rebus.foundation/ns/reader' }
  ],
  type: 'Delete',
  object: {
    type: 'reader:Tag',
    id: <tagUrl>
  }
}
```

Possible errors:

* 404: 'tag with id {id} does not exist or has already been deleted'
