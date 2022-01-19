# Activity Documentation

The main documentation for the API endpoints can be found
[here](https://rebusfoundation.github.io/reader-api). However, since we are using the activityPub
standard, the `POST /{readerId}/outbox` endpoint encompasses a lot of different activities.

This document provides examples for different activities that are implemented at the `POST /{readerId}/outbox` endpoint.

In all cases, the endpoint will return a `201` status and a Location that is the url of the activity
created.

## General Errors

These errors can be thrown on various activities:

| Status Code | Message                            | Values                                                                             | Notes                                                                                                                                                  |
| ----------- | ---------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 404         | No reader with id `{id}`           |                                                                                    |                                                                                                                                                        |
| 403         | Access to reader `{id}` disallowed | `action_type` must be one of `Create`, `Add`, `Remove`, `Delete`, `Update`, `Read` |                                                                                                                                                        |
| 400         | Action `{action}` not recognized   |                                                                                    |                                                                                                                                                        |
| 400         | Cannot `{action}` `{object_type}`  | `object_type` can be `reader:Publication`, `Document`, `Note`, `reader:Stack`.     | e.g "Cannot delete Document"; Not all `action` - `object_types` combinations are supported. For example, `Update reader:Publication` is not supported. |

## Publications

### Create a Publication

Example:

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    { reader: "https://rebus.foundation/ns/reader" }
  ],
  type: "Create",
  object: {
    type: "Publication",
    name: "Publication A",
    author: ["John Smith"],
    editor: "Jane Doe",
    description: "Some description here",
    links: [
      {
        "@context": "https://www.w3.org/ns/activitystreams",
        href: "http://example.org/abc",
        hreflang: "en",
        mediaType: "text/html",
        name: "An example link"
      }
    ],
    readingOrder: [
      {
        "@context": "https://www.w3.org/ns/activitystreams",
        href: "http://example.org/abc",
        hreflang: "en",
        mediaType: "text/html",
        name: "An example reading order object1"
      },
      {
        "@context": "https://www.w3.org/ns/activitystreams",
        href: "http://example.org/abc",
        hreflang: "en",
        mediaType: "text/html",
        name: "An example reading order object2"
      },
      {
        "@context": "https://www.w3.org/ns/activitystreams",
        href: "http://example.org/abc",
        hreflang: "en",
        mediaType: "text/html",
        name: "An example reading order object3"
      }
    ],
    resources: [
      {
        "@context": "https://www.w3.org/ns/activitystreams",
        href: "http://example.org/abc",
        hreflang: "en",
        mediaType: "text/html",
        name: "An example resource"
      }
    ],
    json: { property: "value" }
  }
}
```

Required properties:

```json
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

Possible errors:

| Status Code | Message                             | Description                                                                         |
| ----------- | ----------------------------------- | ----------------------------------------------------------------------------------- |
| 400         | create publication error: {message} | generic error that occured on createPublication. Refer to message for more details. |
| 400         | create activity error: {message}    | generic error that occured on createActivity. Refer to message for more details.    |

### Delete a Publication

Example:

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    { reader: "https://rebus.foundation/ns/reader" }
  ],
  type: "Delete",
  object: {
    type: "Publication",
    id: <publicationUrl>
  }
}
```

Possible errors:

| Status Code | Message                             | Description                                                                         |
| ----------- | ----------------------------------- | ----------------------------------------------------------------------------------- |
| 403         | publication with id {id}            | does not exist or has already been deleted                                          |
| 400         | delete publication error: {message} | generic error that occured on deletePublication. Refer to message for more details. |
| 400         | create activity error: {message}    | generic error that occured on createActivity. Refer to message for more details.    |

### Other

Other activities related to Publications:

* create document (see documents section)
* assign tag to publication (see tags section)

## Documents

### Create a Document

Example:

```json
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

Possible errors:

| Status Code | Message                                                                                  | Description                                                                      |
| ----------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 404         | no publication found for {publicaitonId} Document must belong to an existing publication |                                                                                  |
| 400         | create document error: {message}                                                         | generic error that occured on createDocument. Refer to message for more details. |
| 400         | create activity error: {message}                                                         | generic error that occured on createActivity. Refer to message for more details. |

### Read Activity

Example:

```json
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
  }
}
```

Required properties:

```json
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

A user will be able to select the latest Read Activities providing the ID of a publication.

Possible errors:

| Status Code | Message                          | Description                                                                      |
| ----------- | -------------------------------- | -------------------------------------------------------------------------------- |
| 400         | create activity error: {message} | generic error that occured on createActivity. Refer to message for more details. |

## Notes

Also known as annotations.

### Create a Note

Example:

```json
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

```json
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

* This will create a note that is attached to the document specified in object.inReplyTo, in the
  context of the publication in object.context.
* The specific location of the annotation within the document is specified by the oa:hasSelector
  object.

Possible errors:

| Status Code | Message                                                                 | Description                                                                      |
| ----------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 404         | note creation failed: no publication found with id {id}                 | publication id in note.context must point to an existing publication             |
| 404         | note creation failed: no document found with id {id}                    | document id in note.inReplyTo must point to an existing document                 |
| 400         | note creation failed: document {id} does not belong to publication {id} | the document id in note.inReplyTo must belong to the publication in note.context |
| 400         | create note error: {message}                                            | generic error that occured on createNote. Refer to message for more details.     |
| 400         | create activity error: {message}                                        | generic error that occured on createActivity. Refer to message for more details. |

### Edit a Note

Example:

```json
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

The API supports changes to either the content or the oa:hasSelector, or both. These properties only
need to be included in the object only if they are changed.

Possible errors:

| Status Code | Message                          | Description                                                                      |
| ----------- | -------------------------------- | -------------------------------------------------------------------------------- |
| 404         | no note found with id {id}       |                                                                                  |
| 400         | create activity error: {message} | generic error that occured on createActivity. Refer to message for more details. |
| 400         | cannot update {note}             | generic default error.                                                           |

### Delete a Note

Example:

```json
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

| Status Code | Message                                                      | Description                                                                      |
| ----------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| 404         | note with id {id} does not exist or has already been deleted |                                                                                  |
| 400         | delete note error: {message}                                 | generic error taht occured on deleteNote. Refer to message for more details      |
| 400         | create activity error: {message}                             | generic error that occured on createActivity. Refer to message for more details. |

## Tags

Currently, only tags of the type reader:Stack are supported by the API. Those are used to organize
publications into stacks or collections.

### Create a Tag

Example:

```json
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

Possible errors:

| Status Code | Message                          | Description                                                                                |
| ----------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| 400         | create stack error: {message}    | generic error that occured on createTag. Refer to message for more details.                |
| 400         | duplicate error: stack {message} | generic error that occurs on createTag when you try to create a stack that already exists. |
| 400         | create activity error: {message} | generic error that occured on createActivity. Refer to message for more details.           |

### Assign a Tag to a Publication

Example:

```json
{
  '@context': [
    'https://www.w3.org/ns/activitystreams',
    { reader: 'https://rebus.foundation/ns/reader' }
  ],
  type: 'Add',
  object: {
    id: <tagId>
    type: 'reader:Stack'
  },
  target: {
    id: <publicationId>
    type: 'Publication'
  }
}
```

* `object` can contain the entire tag object, as returned as a reply to the GET document route. But
  only the id and the type are required.
* `target` contains the id of the publication, as well as a property 'type' with value 'Publication'
  that indicates that the Tag is assigned to a Publication.

Possible errors:

| Status Code | Message                                                                      | Description                                                                              |
| ----------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 404         | no publiation found with id {id}                                             |                                                                                          |
| 404         | no tag found with id {id}                                                    |                                                                                          |
| 400         | publication {publicationId} already associated with tag {tagId} ({tag name}) |                                                                                          |
| 400         | 'add tag to publication error: {message}                                     | generic error that occured on add tag to publication. Refer to message for more details. |
| 400         | create activity error: {message}                                             | generic error that occured on createActivity. Refer to message for more details.         |

### Assign a Tag to a Note

Example:

```json
{
  '@context': [
    'https://www.w3.org/ns/activitystreams',
    { reader: 'https://rebus.foundation/ns/reader' }
  ],
  type: 'Add',
  object: {
    id: <tagId>
    type: 'reader:Stack'
  },
  target: {
    id: <noteId>
    type: 'Note'
  }
}
```

* `object` can contain the entire tag object, as returned as a reply to the GET document route. But
  only the id and the type are required.
* `target` contains the id of the note, as well as a property 'type' with value 'Note' that
  indicates that the Tag is assigned to a Publication.

Possible errors:

| Status Code | Message                                                        | Description                                                                       |
| ----------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 404         | no note found with id {id}                                     |                                                                                   |
| 404         | no tag found with id {id}                                      |                                                                                   |
| 400         | note {noteid} already associated with tag {tagId} ({tag name}) |                                                                                   |
| 400         | add tag to note error: {message}                               | generic error that occured on add tag to note. Refer to message for more details. |
| 400         | create activity error: {message}                               | generic error that occured on createActivity. Refer to message for more details.  |

### Remove Tag from Publication

```json
{
  '@context': [
    'https://www.w3.org/ns/activitystreams',
    { reader: 'https://rebus.foundation/ns/reader' }
  ],
  type: 'Remove',
  object: {
    id: <tagId>
    type: 'reader:Stack'
  },
  target: {
    id: <publicationId>
    type: 'Publication'
  }
}
```

Possible errors:

| Status Code | Message                                      | Description                                                                                   |
| ----------- | -------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 404         | no publication found with id {id}            |                                                                                               |
| 404         | no tag found with id {id}                    |                                                                                               |
| 400         | remove tag from publication error: {message} | generic error that occured on remove tag from publication. Refer to message for more details. |
| 400         | create activity error: {message}             | generic error that occured on createActivity. Refer to message for more details.              |

### Remove Tag from Note

```json
{
  '@context': [
    'https://www.w3.org/ns/activitystreams',
    { reader: 'https://rebus.foundation/ns/reader' }
  ],
  type: 'Remove',
  object: {
    id: <tagId>
    type: 'reader:Stack'
  },
  target: {
    id: <noteId>
    type: 'Note'
  }
}
```

Possible errors:

| Status Code | Message                               | Description                                                                            |
| ----------- | ------------------------------------- | -------------------------------------------------------------------------------------- |
| 404         | no note found with id {id}            |                                                                                        |
| 404         | no tag found with id {id}             |                                                                                        |
| 400         | remove tag from note error: {message} | generic error that occured on remove tag from note. Refer to message for more details. |
| 400         | create activity error: {message}      | generic error that occured on createActivity. Refer to message for more details.       |
