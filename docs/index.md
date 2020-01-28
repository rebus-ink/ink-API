---
title: Reader API
language_tabs:
  - javascript: Node
toc_footers: []
includes: []
search: false
highlight_theme: darkula
headingLevel: 2

---

<h1 id="reader-api">Reader API v1.0.0</h1>

> Scroll down for code samples, example requests and responses. Select a language for code samples from the tabs above or the mobile navigation menu.

# Authentication

- HTTP Authentication, scheme: bearer 

<h1 id="reader-api-general">general</h1>

## get__

> Code samples

```javascript
var headers = {
  'Accept':'text/html'

};

$.ajax({
  url: '/',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

`GET /`

GET /

> Example responses

<h3 id="get__-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|confirmation that the api is running|None|

<h3 id="get__-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="reader-api-publications">publications</h1>

## post__reader-:id_file-upload-pub

> Code samples

```javascript
var headers = {
  'Content-Type':'multipart/form-data',
  'Authorization':'Bearer {access-token}'

};

$.ajax({
  url: '/reader-:id/file-upload-pub',
  method: 'post',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

`POST /reader-:id/file-upload-pub`

POST /reader-:id/file-upload-pub

> Body parameter

```yaml
file: null
documentPath: string
mediaType: string
json: string

```

<h3 id="post__reader-:id_file-upload-pub-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|the id of the publication|
|body|body|object|false|none|
|» file|body|binary|false|none|
|» documentPath|body|string|false|none|
|» mediaType|body|string|false|none|
|» json|body|string|false|stringified json data|

<h3 id="post__reader-:id_file-upload-pub-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|file created|None|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|No file was included with upload OR Error connecting to google bucket|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Access to publication {id} disallowed|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
Bearer
</aside>

## delete__publications_{pubId}

> Code samples

```javascript
var headers = {
  'Authorization':'Bearer {access-token}'

};

$.ajax({
  url: '/publications/{pubId}',
  method: 'delete',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

`DELETE /publications/{pubId}`

DELETE /publications/pubId

<h3 id="delete__publications_{pubid}-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|pubId|path|string|true|none|

<h3 id="delete__publications_{pubid}-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|Successfully deleted Publication|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Access to publication {pubId} disallowed|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|Publication not found|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
Bearer
</aside>

## get__publications_{pubId}

> Code samples

```javascript
var headers = {
  'Accept':'application/json',
  'Authorization':'Bearer {access-token}'

};

$.ajax({
  url: '/publications/{pubId}',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

`GET /publications/{pubId}`

GET /publications/{pubId}

<h3 id="get__publications_{pubid}-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|pubId|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "id": "string",
  "type": "string",
  "summaryMap": {
    "en": "string"
  },
  "@context": [],
  "author": [
    {
      "name": "string",
      "type": "Person"
    }
  ],
  "editor": [
    {
      "name": "string",
      "type": "Person"
    }
  ],
  "creator": [
    {
      "name": "string",
      "type": "Person"
    }
  ],
  "contributor": [
    {
      "name": "string",
      "type": "Person"
    }
  ],
  "illustrator": [
    {
      "name": "string",
      "type": "Person"
    }
  ],
  "publisher": [
    {
      "name": "string",
      "type": "Person"
    }
  ],
  "translator": [
    {
      "name": "string",
      "type": "Person"
    }
  ],
  "copyrightHolder": [
    {
      "name": "string",
      "type": "Person"
    }
  ],
  "replies": [
    "string"
  ],
  "abstract": "string",
  "datePublished": "string",
  "numberOfPages": 0,
  "encodingFormat": "string",
  "url": "string",
  "dateModified": "string",
  "bookEdition": "string",
  "isbn": "string",
  "copyrightYear": 0,
  "genre": "string",
  "license": "string",
  "wordCount": 0,
  "description": "string",
  "status": "test",
  "inDirection": "ltr",
  "readingOrder": [
    {
      "href": "string",
      "mediaType": "string",
      "rel": "string",
      "name": "string",
      "hreflang": "string",
      "height": 0,
      "width": 0
    }
  ],
  "resources": [
    {
      "href": "string",
      "mediaType": "string",
      "rel": "string",
      "name": "string",
      "hreflang": "string",
      "height": 0,
      "width": 0
    }
  ],
  "links": [
    {
      "href": "string",
      "mediaType": "string",
      "rel": "string",
      "name": "string",
      "hreflang": "string",
      "height": 0,
      "width": 0
    }
  ],
  "position": {},
  "json": {},
  "readerId": "string",
  "reader": {
    "id": "string",
    "type": "Person",
    "summaryMap": {
      "en": "string"
    },
    "@context": [],
    "inbox": "string",
    "outbox": "string",
    "name": "string",
    "profile": {},
    "preferences": {},
    "json": {},
    "published": "2020-01-28T15:50:15Z",
    "updated": "2020-01-28T15:50:15Z"
  },
  "published": "string",
  "updated": "string"
}
```

<h3 id="get__publications_{pubid}-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The publication objects, with a list of document references (document object without the content field)|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Access to publication {pubId} disallowed|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|No Publication with ID {pubId}|None|

<h3 id="get__publications_{pubid}-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(url)|false|read-only|none|
|» type|string|false|none|none|
|» summaryMap|object|false|none|none|
|»» en|string|false|none|none|
|» @context|array|false|none|none|
|» author|[[#/definitions/annotation](#schema#/definitions/annotation)]|false|none|none|
|»» name|string|false|none|none|
|»» type|string|false|none|none|
|» editor|[[#/definitions/annotation](#schema#/definitions/annotation)]|false|none|none|
|» creator|[[#/definitions/annotation](#schema#/definitions/annotation)]|false|none|none|
|» contributor|[[#/definitions/annotation](#schema#/definitions/annotation)]|false|none|none|
|» illustrator|[[#/definitions/annotation](#schema#/definitions/annotation)]|false|none|none|
|» publisher|[[#/definitions/annotation](#schema#/definitions/annotation)]|false|none|none|
|» translator|[[#/definitions/annotation](#schema#/definitions/annotation)]|false|none|none|
|» copyrightHolder|[[#/definitions/annotation](#schema#/definitions/annotation)]|false|none|none|
|» replies|[string]|false|none|none|
|» abstract|string|false|none|none|
|» datePublished|string(timestamp)|false|none|none|
|» numberOfPages|number|false|none|none|
|» encodingFormat|string|false|none|none|
|» url|string|false|none|none|
|» dateModified|string(timestamp)|false|none|none|
|» bookEdition|string|false|none|none|
|» isbn|string|false|none|none|
|» copyrightYear|number|false|none|none|
|» genre|string|false|none|none|
|» license|string|false|none|none|
|» wordCount|number|false|none|none|
|» description|string|false|none|none|
|» status|string|false|none|none|
|» inDirection|string|false|none|none|
|» readingOrder|[[#/definitions/link](#schema#/definitions/link)]|false|none|none|
|»» href|string|false|none|none|
|»» mediaType|string|false|none|none|
|»» rel|string|false|none|none|
|»» name|string|false|none|none|
|»» hreflang|string|false|none|none|
|»» height|integer|false|none|none|
|»» width|integer|false|none|none|
|» resources|[[#/definitions/link](#schema#/definitions/link)]|false|none|none|
|» links|[[#/definitions/link](#schema#/definitions/link)]|false|none|none|
|» position|object|false|none|none|
|» json|object|false|none|none|
|» readerId|string(url)|false|none|none|
|» reader|object|false|none|none|
|»» id|string(url)|false|none|none|
|»» type|string|false|none|none|
|»» summaryMap|object|false|none|none|
|»»» en|string|false|none|none|
|»» @context|array|false|none|none|
|»» inbox|string(url)|false|none|none|
|»» outbox|string(url)|false|none|none|
|»» name|string|false|none|none|
|»» profile|object|false|none|none|
|»» preferences|object|false|none|none|
|»» json|object|false|none|none|
|»» published|string(date-time)|false|none|none|
|»» updated|string(date-time)|false|none|none|
|» published|string(timestamp)|false|none|none|
|» updated|string(timestamp)|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|Person|
|type|Organization|
|status|test|
|inDirection|ltr|
|inDirection|rtl|
|type|Person|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
Bearer
</aside>

## patch__publications_{pubId}

> Code samples

```javascript
var headers = {
  'Content-Type':'application/json',
  'Accept':'application/json',
  'Authorization':'Bearer {access-token}'

};

$.ajax({
  url: '/publications/{pubId}',
  method: 'patch',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

`PATCH /publications/{pubId}`

PATCH /publications/:pubId

> Body parameter

```json
{
  "type": "string",
  "summaryMap": {
    "en": "string"
  },
  "@context": [],
  "author": [
    {
      "name": "string",
      "type": "Person"
    }
  ],
  "editor": [
    {
      "name": "string",
      "type": "Person"
    }
  ],
  "creator": [
    {
      "name": "string",
      "type": "Person"
    }
  ],
  "contributor": [
    {
      "name": "string",
      "type": "Person"
    }
  ],
  "illustrator": [
    {
      "name": "string",
      "type": "Person"
    }
  ],
  "publisher": [
    {
      "name": "string",
      "type": "Person"
    }
  ],
  "translator": [
    {
      "name": "string",
      "type": "Person"
    }
  ],
  "copyrightHolder": [
    {
      "name": "string",
      "type": "Person"
    }
  ],
  "replies": [
    "string"
  ],
  "abstract": "string",
  "datePublished": "string",
  "numberOfPages": 0,
  "encodingFormat": "string",
  "url": "string",
  "dateModified": "string",
  "bookEdition": "string",
  "isbn": "string",
  "copyrightYear": 0,
  "genre": "string",
  "license": "string",
  "wordCount": 0,
  "description": "string",
  "status": "test",
  "inDirection": "ltr",
  "readingOrder": [
    {
      "href": "string",
      "mediaType": "string",
      "rel": "string",
      "name": "string",
      "hreflang": "string",
      "height": 0,
      "width": 0
    }
  ],
  "resources": [
    {
      "href": "string",
      "mediaType": "string",
      "rel": "string",
      "name": "string",
      "hreflang": "string",
      "height": 0,
      "width": 0
    }
  ],
  "links": [
    {
      "href": "string",
      "mediaType": "string",
      "rel": "string",
      "name": "string",
      "hreflang": "string",
      "height": 0,
      "width": 0
    }
  ],
  "position": {},
  "json": {},
  "readerId": "string",
  "reader": {
    "id": "string",
    "type": "Person",
    "summaryMap": {
      "en": "string"
    },
    "@context": [],
    "inbox": "string",
    "outbox": "string",
    "name": "string",
    "profile": {},
    "preferences": {},
    "json": {},
    "published": "2020-01-28T15:50:15Z",
    "updated": "2020-01-28T15:50:15Z"
  },
  "published": "string",
  "updated": "string"
}
```

<h3 id="patch__publications_{pubid}-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|pubId|path|string|true|none|
|body|body|[#/definitions/publication](#schema#/definitions/publication)|false|none|

> Example responses

> 200 Response

```json
{
  "id": "string",
  "type": "string",
  "summaryMap": {
    "en": "string"
  },
  "@context": [],
  "author": [
    {
      "name": "string",
      "type": "Person"
    }
  ],
  "editor": [
    {
      "name": "string",
      "type": "Person"
    }
  ],
  "creator": [
    {
      "name": "string",
      "type": "Person"
    }
  ],
  "contributor": [
    {
      "name": "string",
      "type": "Person"
    }
  ],
  "illustrator": [
    {
      "name": "string",
      "type": "Person"
    }
  ],
  "publisher": [
    {
      "name": "string",
      "type": "Person"
    }
  ],
  "translator": [
    {
      "name": "string",
      "type": "Person"
    }
  ],
  "copyrightHolder": [
    {
      "name": "string",
      "type": "Person"
    }
  ],
  "replies": [
    "string"
  ],
  "abstract": "string",
  "datePublished": "string",
  "numberOfPages": 0,
  "encodingFormat": "string",
  "url": "string",
  "dateModified": "string",
  "bookEdition": "string",
  "isbn": "string",
  "copyrightYear": 0,
  "genre": "string",
  "license": "string",
  "wordCount": 0,
  "description": "string",
  "status": "test",
  "inDirection": "ltr",
  "readingOrder": [
    {
      "href": "string",
      "mediaType": "string",
      "rel": "string",
      "name": "string",
      "hreflang": "string",
      "height": 0,
      "width": 0
    }
  ],
  "resources": [
    {
      "href": "string",
      "mediaType": "string",
      "rel": "string",
      "name": "string",
      "hreflang": "string",
      "height": 0,
      "width": 0
    }
  ],
  "links": [
    {
      "href": "string",
      "mediaType": "string",
      "rel": "string",
      "name": "string",
      "hreflang": "string",
      "height": 0,
      "width": 0
    }
  ],
  "position": {},
  "json": {},
  "readerId": "string",
  "reader": {
    "id": "string",
    "type": "Person",
    "summaryMap": {
      "en": "string"
    },
    "@context": [],
    "inbox": "string",
    "outbox": "string",
    "name": "string",
    "profile": {},
    "preferences": {},
    "json": {},
    "published": "2020-01-28T15:50:15Z",
    "updated": "2020-01-28T15:50:15Z"
  },
  "published": "string",
  "updated": "string"
}
```

<h3 id="patch__publications_{pubid}-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successfully updated Publication|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Validation error|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Access to publication {id} disallowed|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|Publication not found|None|

<h3 id="patch__publications_{pubid}-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(url)|false|read-only|none|
|» type|string|false|none|none|
|» summaryMap|object|false|none|none|
|»» en|string|false|none|none|
|» @context|array|false|none|none|
|» author|[[#/definitions/annotation](#schema#/definitions/annotation)]|false|none|none|
|»» name|string|false|none|none|
|»» type|string|false|none|none|
|» editor|[[#/definitions/annotation](#schema#/definitions/annotation)]|false|none|none|
|» creator|[[#/definitions/annotation](#schema#/definitions/annotation)]|false|none|none|
|» contributor|[[#/definitions/annotation](#schema#/definitions/annotation)]|false|none|none|
|» illustrator|[[#/definitions/annotation](#schema#/definitions/annotation)]|false|none|none|
|» publisher|[[#/definitions/annotation](#schema#/definitions/annotation)]|false|none|none|
|» translator|[[#/definitions/annotation](#schema#/definitions/annotation)]|false|none|none|
|» copyrightHolder|[[#/definitions/annotation](#schema#/definitions/annotation)]|false|none|none|
|» replies|[string]|false|none|none|
|» abstract|string|false|none|none|
|» datePublished|string(timestamp)|false|none|none|
|» numberOfPages|number|false|none|none|
|» encodingFormat|string|false|none|none|
|» url|string|false|none|none|
|» dateModified|string(timestamp)|false|none|none|
|» bookEdition|string|false|none|none|
|» isbn|string|false|none|none|
|» copyrightYear|number|false|none|none|
|» genre|string|false|none|none|
|» license|string|false|none|none|
|» wordCount|number|false|none|none|
|» description|string|false|none|none|
|» status|string|false|none|none|
|» inDirection|string|false|none|none|
|» readingOrder|[[#/definitions/link](#schema#/definitions/link)]|false|none|none|
|»» href|string|false|none|none|
|»» mediaType|string|false|none|none|
|»» rel|string|false|none|none|
|»» name|string|false|none|none|
|»» hreflang|string|false|none|none|
|»» height|integer|false|none|none|
|»» width|integer|false|none|none|
|» resources|[[#/definitions/link](#schema#/definitions/link)]|false|none|none|
|» links|[[#/definitions/link](#schema#/definitions/link)]|false|none|none|
|» position|object|false|none|none|
|» json|object|false|none|none|
|» readerId|string(url)|false|none|none|
|» reader|object|false|none|none|
|»» id|string(url)|false|none|none|
|»» type|string|false|none|none|
|»» summaryMap|object|false|none|none|
|»»» en|string|false|none|none|
|»» @context|array|false|none|none|
|»» inbox|string(url)|false|none|none|
|»» outbox|string(url)|false|none|none|
|»» name|string|false|none|none|
|»» profile|object|false|none|none|
|»» preferences|object|false|none|none|
|»» json|object|false|none|none|
|»» published|string(date-time)|false|none|none|
|»» updated|string(date-time)|false|none|none|
|» published|string(timestamp)|false|none|none|
|» updated|string(timestamp)|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|Person|
|type|Organization|
|status|test|
|inDirection|ltr|
|inDirection|rtl|
|type|Person|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
Bearer
</aside>

## get__publication-{id}_{path}

> Code samples

```javascript
var headers = {
  'Authorization':'Bearer {access-token}'

};

$.ajax({
  url: '/publication-{id}/{path}',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

`GET /publication-{id}/{path}`

GET /publication-:id/:path

<h3 id="get__publication-{id}_{path}-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|the short id of the publication|
|path|path|string|true|the relative path to the document within the publication|

<h3 id="get__publication-{id}_{path}-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|302|[Found](https://tools.ietf.org/html/rfc7231#section-6.4.3)|none|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|none|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|none|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
Bearer
</aside>

## post__publications

> Code samples

```javascript
var headers = {
  'Content-Type':'application/json',
  'Accept':'application/json',
  'Authorization':'Bearer {access-token}'

};

$.ajax({
  url: '/publications',
  method: 'post',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

`POST /publications`

POST /publications

> Body parameter

```json
{
  "type": "string",
  "summaryMap": {
    "en": "string"
  },
  "@context": [],
  "author": [
    {
      "name": "string",
      "type": "Person"
    }
  ],
  "editor": [
    {
      "name": "string",
      "type": "Person"
    }
  ],
  "creator": [
    {
      "name": "string",
      "type": "Person"
    }
  ],
  "contributor": [
    {
      "name": "string",
      "type": "Person"
    }
  ],
  "illustrator": [
    {
      "name": "string",
      "type": "Person"
    }
  ],
  "publisher": [
    {
      "name": "string",
      "type": "Person"
    }
  ],
  "translator": [
    {
      "name": "string",
      "type": "Person"
    }
  ],
  "copyrightHolder": [
    {
      "name": "string",
      "type": "Person"
    }
  ],
  "replies": [
    "string"
  ],
  "abstract": "string",
  "datePublished": "string",
  "numberOfPages": 0,
  "encodingFormat": "string",
  "url": "string",
  "dateModified": "string",
  "bookEdition": "string",
  "isbn": "string",
  "copyrightYear": 0,
  "genre": "string",
  "license": "string",
  "wordCount": 0,
  "description": "string",
  "status": "test",
  "inDirection": "ltr",
  "readingOrder": [
    {
      "href": "string",
      "mediaType": "string",
      "rel": "string",
      "name": "string",
      "hreflang": "string",
      "height": 0,
      "width": 0
    }
  ],
  "resources": [
    {
      "href": "string",
      "mediaType": "string",
      "rel": "string",
      "name": "string",
      "hreflang": "string",
      "height": 0,
      "width": 0
    }
  ],
  "links": [
    {
      "href": "string",
      "mediaType": "string",
      "rel": "string",
      "name": "string",
      "hreflang": "string",
      "height": 0,
      "width": 0
    }
  ],
  "position": {},
  "json": {},
  "readerId": "string",
  "reader": {
    "id": "string",
    "type": "Person",
    "summaryMap": {
      "en": "string"
    },
    "@context": [],
    "inbox": "string",
    "outbox": "string",
    "name": "string",
    "profile": {},
    "preferences": {},
    "json": {},
    "published": "2020-01-28T15:50:15Z",
    "updated": "2020-01-28T15:50:15Z"
  },
  "published": "string",
  "updated": "string"
}
```

<h3 id="post__publications-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[#/definitions/publication](#schema#/definitions/publication)|false|none|

> Example responses

> 201 Response

```json
{
  "id": "string",
  "type": "string",
  "summaryMap": {
    "en": "string"
  },
  "@context": [],
  "author": [
    {
      "name": "string",
      "type": "Person"
    }
  ],
  "editor": [
    {
      "name": "string",
      "type": "Person"
    }
  ],
  "creator": [
    {
      "name": "string",
      "type": "Person"
    }
  ],
  "contributor": [
    {
      "name": "string",
      "type": "Person"
    }
  ],
  "illustrator": [
    {
      "name": "string",
      "type": "Person"
    }
  ],
  "publisher": [
    {
      "name": "string",
      "type": "Person"
    }
  ],
  "translator": [
    {
      "name": "string",
      "type": "Person"
    }
  ],
  "copyrightHolder": [
    {
      "name": "string",
      "type": "Person"
    }
  ],
  "replies": [
    "string"
  ],
  "abstract": "string",
  "datePublished": "string",
  "numberOfPages": 0,
  "encodingFormat": "string",
  "url": "string",
  "dateModified": "string",
  "bookEdition": "string",
  "isbn": "string",
  "copyrightYear": 0,
  "genre": "string",
  "license": "string",
  "wordCount": 0,
  "description": "string",
  "status": "test",
  "inDirection": "ltr",
  "readingOrder": [
    {
      "href": "string",
      "mediaType": "string",
      "rel": "string",
      "name": "string",
      "hreflang": "string",
      "height": 0,
      "width": 0
    }
  ],
  "resources": [
    {
      "href": "string",
      "mediaType": "string",
      "rel": "string",
      "name": "string",
      "hreflang": "string",
      "height": 0,
      "width": 0
    }
  ],
  "links": [
    {
      "href": "string",
      "mediaType": "string",
      "rel": "string",
      "name": "string",
      "hreflang": "string",
      "height": 0,
      "width": 0
    }
  ],
  "position": {},
  "json": {},
  "readerId": "string",
  "reader": {
    "id": "string",
    "type": "Person",
    "summaryMap": {
      "en": "string"
    },
    "@context": [],
    "inbox": "string",
    "outbox": "string",
    "name": "string",
    "profile": {},
    "preferences": {},
    "json": {},
    "published": "2020-01-28T15:50:15Z",
    "updated": "2020-01-28T15:50:15Z"
  },
  "published": "string",
  "updated": "string"
}
```

<h3 id="post__publications-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|Successfully created Publication|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Validation error|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Access to reader {id} disallowed|None|

<h3 id="post__publications-responseschema">Response Schema</h3>

Status Code **201**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(url)|false|read-only|none|
|» type|string|false|none|none|
|» summaryMap|object|false|none|none|
|»» en|string|false|none|none|
|» @context|array|false|none|none|
|» author|[[#/definitions/annotation](#schema#/definitions/annotation)]|false|none|none|
|»» name|string|false|none|none|
|»» type|string|false|none|none|
|» editor|[[#/definitions/annotation](#schema#/definitions/annotation)]|false|none|none|
|» creator|[[#/definitions/annotation](#schema#/definitions/annotation)]|false|none|none|
|» contributor|[[#/definitions/annotation](#schema#/definitions/annotation)]|false|none|none|
|» illustrator|[[#/definitions/annotation](#schema#/definitions/annotation)]|false|none|none|
|» publisher|[[#/definitions/annotation](#schema#/definitions/annotation)]|false|none|none|
|» translator|[[#/definitions/annotation](#schema#/definitions/annotation)]|false|none|none|
|» copyrightHolder|[[#/definitions/annotation](#schema#/definitions/annotation)]|false|none|none|
|» replies|[string]|false|none|none|
|» abstract|string|false|none|none|
|» datePublished|string(timestamp)|false|none|none|
|» numberOfPages|number|false|none|none|
|» encodingFormat|string|false|none|none|
|» url|string|false|none|none|
|» dateModified|string(timestamp)|false|none|none|
|» bookEdition|string|false|none|none|
|» isbn|string|false|none|none|
|» copyrightYear|number|false|none|none|
|» genre|string|false|none|none|
|» license|string|false|none|none|
|» wordCount|number|false|none|none|
|» description|string|false|none|none|
|» status|string|false|none|none|
|» inDirection|string|false|none|none|
|» readingOrder|[[#/definitions/link](#schema#/definitions/link)]|false|none|none|
|»» href|string|false|none|none|
|»» mediaType|string|false|none|none|
|»» rel|string|false|none|none|
|»» name|string|false|none|none|
|»» hreflang|string|false|none|none|
|»» height|integer|false|none|none|
|»» width|integer|false|none|none|
|» resources|[[#/definitions/link](#schema#/definitions/link)]|false|none|none|
|» links|[[#/definitions/link](#schema#/definitions/link)]|false|none|none|
|» position|object|false|none|none|
|» json|object|false|none|none|
|» readerId|string(url)|false|none|none|
|» reader|object|false|none|none|
|»» id|string(url)|false|none|none|
|»» type|string|false|none|none|
|»» summaryMap|object|false|none|none|
|»»» en|string|false|none|none|
|»» @context|array|false|none|none|
|»» inbox|string(url)|false|none|none|
|»» outbox|string(url)|false|none|none|
|»» name|string|false|none|none|
|»» profile|object|false|none|none|
|»» preferences|object|false|none|none|
|»» json|object|false|none|none|
|»» published|string(date-time)|false|none|none|
|»» updated|string(date-time)|false|none|none|
|» published|string(timestamp)|false|none|none|
|» updated|string(timestamp)|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|Person|
|type|Organization|
|status|test|
|inDirection|ltr|
|inDirection|rtl|
|type|Person|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
Bearer
</aside>

## post__publications_{pubId}_readActivity

> Code samples

```javascript
var headers = {
  'Content-Type':'application/json',
  'Accept':'application/json',
  'Authorization':'Bearer {access-token}'

};

$.ajax({
  url: '/publications/{pubId}/readActivity',
  method: 'post',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

`POST /publications/{pubId}/readActivity`

POST /publications/:pubId/readActivity

> Body parameter

```json
{
  "oa:hasSelector": {},
  "json": {}
}
```

<h3 id="post__publications_{pubid}_readactivity-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|pubId|path|string|true|none|
|body|body|[#/definitions/readActivity](#schema#/definitions/readactivity)|false|none|

> Example responses

> 201 Response

```json
{
  "oa:hasSelector": {},
  "json": {}
}
```

<h3 id="post__publications_{pubid}_readactivity-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|Successfully created readActivity|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Validation error|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Access to publication {pubId} disallowed|None|

<h3 id="post__publications_{pubid}_readactivity-responseschema">Response Schema</h3>

Status Code **201**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» oa:hasSelector|object|false|none|none|
|» json|object|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
Bearer
</aside>

<h1 id="reader-api-readers">readers</h1>

## post__reader-{id}_file-upload

> Code samples

```javascript
var headers = {
  'Content-Type':'multipart/form-data',
  'Authorization':'Bearer {access-token}'

};

$.ajax({
  url: '/reader-{id}/file-upload',
  method: 'post',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

`POST /reader-{id}/file-upload`

POST /reader-:id/file-upload

> Body parameter

```yaml
files:
  - null

```

<h3 id="post__reader-{id}_file-upload-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|the id of the reader|
|body|body|object|false|none|
|» files|body|[binary]|false|none|

<h3 id="post__reader-{id}_file-upload-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|file created|None|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|No file was included with upload OR Error connecting to google bucket|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Access to reader {id} disallowed|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|No reader with ID {id}|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
Bearer
</aside>

## get__library

> Code samples

```javascript
var headers = {
  'Accept':'application/json',
  'Authorization':'Bearer {access-token}'

};

$.ajax({
  url: '/library',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

`GET /library`

GET /library

<h3 id="get__library-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|the short id of the reader|
|limit|query|number|false|the number of library items to return|
|page|query|number|false|none|
|attribution|query|string|false|a search in the attribution field. Will also return partial matches.|
|role|query|string|false|a modifier for attribution to specify the type of attribution|
|author|query|string|false|will return only exact matches.|
|language|query|string|false|none|
|type|query|string|false|none|
|keyword|query|string|false|none|
|orderBy|query|string|false|used to order either alphabetically by title or by date published (most recent first)|
|reverse|query|boolean|false|a modifier to use with orderBy to reverse the order|

#### Enumerated Values

|Parameter|Value|
|---|---|
|role|author|
|role|editor|
|role|contributor|
|role|creator|
|role|illustrator|
|role|publisher|
|role|translator|
|orderBy|title|
|orderBy|datePublished|

> Example responses

> 200 Response

```json
{
  "id": "string",
  "type": "Collection",
  "summaryMap": {
    "en": "string"
  },
  "@context": [],
  "tags": [
    {
      "id": "string",
      "type": "reader:Tag",
      "name": "string",
      "tagType": "string",
      "published": "string",
      "updated": "string"
    }
  ],
  "totalItems": 0,
  "items": [
    {
      "id": "string",
      "type": "string",
      "summaryMap": {
        "en": "string"
      },
      "@context": [],
      "author": [
        {
          "name": "string",
          "type": "Person"
        }
      ],
      "editor": [
        {
          "name": "string",
          "type": "Person"
        }
      ],
      "creator": [
        {
          "name": "string",
          "type": "Person"
        }
      ],
      "contributor": [
        {
          "name": "string",
          "type": "Person"
        }
      ],
      "illustrator": [
        {
          "name": "string",
          "type": "Person"
        }
      ],
      "publisher": [
        {
          "name": "string",
          "type": "Person"
        }
      ],
      "translator": [
        {
          "name": "string",
          "type": "Person"
        }
      ],
      "replies": [
        "string"
      ],
      "json": {},
      "numberOfPages": 0,
      "encodingFormat": "string",
      "url": "string",
      "dateModified": "string",
      "bookEdition": "string",
      "isbn": "string",
      "copyrightYear": 0,
      "genre": "string",
      "license": "string",
      "wordCount": 0,
      "description": "string",
      "status": "test",
      "inDirection": "ltr",
      "resources": [
        {
          "href": "string",
          "mediaType": "string",
          "rel": "string",
          "name": "string",
          "hreflang": "string",
          "height": 0,
          "width": 0
        }
      ],
      "abstract": "string",
      "datePublished": "string",
      "readerId": "string",
      "published": "string",
      "updated": "string"
    }
  ]
}
```

<h3 id="get__library-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A list of publications for the reader|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Access to reader {id} disallowed|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|No Reader with ID {id}|None|

<h3 id="get__library-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(url)|false|none|none|
|» type|string|false|none|none|
|» summaryMap|object|false|none|none|
|»» en|string|false|none|none|
|» @context|array|false|none|none|
|» tags|[[#/definitions/tag](#schema#/definitions/tag)]|false|none|none|
|»» id|string(url)|false|none|none|
|»» type|string|false|none|none|
|»» name|string|false|none|none|
|»» tagType|string|false|none|none|
|»» published|string(timestamp)|false|none|none|
|»» updated|string(timestamp)|false|none|none|
|» totalItems|integer|false|none|none|
|» items|[[#/definitions/publication-ref](#schema#/definitions/publication-ref)]|false|none|none|
|»» id|string(url)|false|none|none|
|»» type|string|false|none|none|
|»» summaryMap|object|false|none|none|
|»»» en|string|false|none|none|
|»» @context|array|false|none|none|
|»» author|[[#/definitions/annotation](#schema#/definitions/annotation)]|false|none|none|
|»»» name|string|false|none|none|
|»»» type|string|false|none|none|
|»» editor|[[#/definitions/annotation](#schema#/definitions/annotation)]|false|none|none|
|»» creator|[[#/definitions/annotation](#schema#/definitions/annotation)]|false|none|none|
|»» contributor|[[#/definitions/annotation](#schema#/definitions/annotation)]|false|none|none|
|»» illustrator|[[#/definitions/annotation](#schema#/definitions/annotation)]|false|none|none|
|»» publisher|[[#/definitions/annotation](#schema#/definitions/annotation)]|false|none|none|
|»» translator|[[#/definitions/annotation](#schema#/definitions/annotation)]|false|none|none|
|»» replies|[string]|false|none|none|
|»» json|object|false|none|none|
|»» numberOfPages|number|false|none|none|
|»» encodingFormat|string|false|none|none|
|»» url|string|false|none|none|
|»» dateModified|string(timestamp)|false|none|none|
|»» bookEdition|string|false|none|none|
|»» isbn|string|false|none|none|
|»» copyrightYear|number|false|none|none|
|»» genre|string|false|none|none|
|»» license|string|false|none|none|
|»» wordCount|number|false|none|none|
|»» description|string|false|none|none|
|»» status|string|false|none|none|
|»» inDirection|string|false|none|none|
|»» resources|[[#/definitions/link](#schema#/definitions/link)]|false|none|none|
|»»» href|string|false|none|none|
|»»» mediaType|string|false|none|none|
|»»» rel|string|false|none|none|
|»»» name|string|false|none|none|
|»»» hreflang|string|false|none|none|
|»»» height|integer|false|none|none|
|»»» width|integer|false|none|none|
|»» abstract|string|false|none|none|
|»» datePublished|string(timestamp)|false|none|none|
|»» readerId|string(url)|false|none|none|
|»» published|string(timestamp)|false|none|none|
|»» updated|string(timestamp)|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|Collection|
|type|reader:Tag|
|type|Person|
|type|Organization|
|status|test|
|inDirection|ltr|
|inDirection|rtl|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
Bearer
</aside>

## get__notes

> Code samples

```javascript
var headers = {
  'Accept':'application/json',
  'Authorization':'Bearer {access-token}'

};

$.ajax({
  url: '/notes',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

`GET /notes`

GET /notes

<h3 id="get__notes-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|limit|query|number|false|the number of library items to return|
|page|query|number|false|none|
|document|query|string|false|the url of the document the note is associated with. When this filter is used, will not paginate. Will return all results.|
|publication|query|string|false|the id of the publication the note is associated with|
|motivation|query|string|false|none|
|search|query|string|false|keyword to search for in the content of notes. Not case sensitive.|
|stack|query|string|false|the collection (tag with type 'reader:Stack')|
|orderBy|query|string|false|the property to be used to order the notes. By default will return most recent first.|
|reverse|query|boolean|false|modifier for the orderBy query to return the oldest notes first.|

#### Enumerated Values

|Parameter|Value|
|---|---|
|orderBy|created|
|orderBy|updated|

> Example responses

> 200 Response

```json
{
  "id": "string",
  "totalItems": 0,
  "items": [
    {
      "id": "string",
      "canonical": "string",
      "target": {},
      "body": {
        "motivation": "string",
        "content": "string",
        "language": "string"
      },
      "published": "2020-01-28T15:50:15Z",
      "updated": "2020-01-28T15:50:15Z",
      "publication": {
        "id": "string",
        "author": [
          {
            "name": "string",
            "type": "Person"
          }
        ],
        "editor": [
          {
            "name": "string",
            "type": "Person"
          }
        ],
        "description": "string",
        "datePublished": "string"
      },
      "json": {}
    }
  ]
}
```

<h3 id="get__notes-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A list of notes for the reader|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|No Reader with auth token|None|

<h3 id="get__notes-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(url)|false|none|none|
|» totalItems|integer|false|none|none|
|» items|[[#/definitions/noteWithPub](#schema#/definitions/notewithpub)]|false|none|none|
|»» id|string(url)|false|none|none|
|»» canonical|string|false|none|none|
|»» target|object|false|none|none|
|»» body|object|false|none|none|
|»»» motivation|string|false|none|none|
|»»» content|string|false|none|none|
|»»» language|string|false|none|none|
|»» published|string(date-time)|false|none|none|
|»» updated|string(date-time)|false|none|none|
|»» publication|object|false|none|none|
|»»» id|string(url)|false|none|none|
|»»» author|[[#/definitions/annotation](#schema#/definitions/annotation)]|false|none|none|
|»»»» name|string|false|none|none|
|»»»» type|string|false|none|none|
|»»» editor|[[#/definitions/annotation](#schema#/definitions/annotation)]|false|none|none|
|»»» description|string|false|none|none|
|»»» datePublished|string(timestamp)|false|none|none|
|»» json|object|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|Person|
|type|Organization|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
Bearer
</aside>

## get__readers_{id}

> Code samples

```javascript
var headers = {
  'Accept':'application/json',
  'Authorization':'Bearer {access-token}'

};

$.ajax({
  url: '/readers/{id}',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

`GET /readers/{id}`

GET /readers/:id

<h3 id="get__readers_{id}-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|the id of the reader|

> Example responses

> 200 Response

```json
{
  "id": "string",
  "type": "Person",
  "summaryMap": {
    "en": "string"
  },
  "@context": [],
  "inbox": "string",
  "outbox": "string",
  "name": "string",
  "profile": {},
  "preferences": {},
  "json": {},
  "published": "2020-01-28T15:50:15Z",
  "updated": "2020-01-28T15:50:15Z"
}
```

<h3 id="get__readers_{id}-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A reader object|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Access to reader {id} disallowed|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|No Reader with ID {id}|None|

<h3 id="get__readers_{id}-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(url)|false|none|none|
|» type|string|false|none|none|
|» summaryMap|object|false|none|none|
|»» en|string|false|none|none|
|» @context|array|false|none|none|
|» inbox|string(url)|false|none|none|
|» outbox|string(url)|false|none|none|
|» name|string|false|none|none|
|» profile|object|false|none|none|
|» preferences|object|false|none|none|
|» json|object|false|none|none|
|» published|string(date-time)|false|none|none|
|» updated|string(date-time)|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|Person|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
Bearer
</aside>

## post__readers

> Code samples

```javascript
var headers = {
  'Content-Type':'application/json',
  'Authorization':'Bearer {access-token}'

};

$.ajax({
  url: '/readers',
  method: 'post',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

`POST /readers`

POST /readers

> Body parameter

```json
{
  "name": "string",
  "@context": [],
  "profile": {},
  "preferences": null,
  "json": {}
}
```

<h3 id="post__readers-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[#/definitions/readers-request](#schema#/definitions/readers-request)|false|none|

<h3 id="post__readers-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|Created|None|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Reader already exists|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
Bearer
</aside>

## get__reader-{id}_search

> Code samples

```javascript
var headers = {
  'Accept':'application/json',
  'Authorization':'Bearer {access-token}'

};

$.ajax({
  url: '/reader-{id}/search',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

`GET /reader-{id}/search`

GET /reader-:id/search

<h3 id="get__reader-{id}_search-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|the short id of the reader|
|search|query|string|false|the string to search against|
|exact|query|string|false|none|
|publication|query|string|false|the id of the publication to search. Should not be used with a collection filter.|
|collection|query|string|false|the name of the collection. Should not be used with a publication filter.|

#### Enumerated Values

|Parameter|Value|
|---|---|
|exact|true|
|exact|false|

> Example responses

> 200 Response

```json
{
  "items": [
    {
      "id": "string",
      "documentId": "string",
      "documentUrl": "string",
      "@context": [],
      "highlights": [
        "string"
      ]
    }
  ]
}
```

<h3 id="get__reader-{id}_search-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A list search results|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Access to reader {id} disallowed|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|No Reader with ID {id}|None|

<h3 id="get__reader-{id}_search-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» items|[[#/definitions/search-result](#schema#/definitions/search-result)]|false|none|none|
|»» id|string|false|none|none|
|»» documentId|string|false|none|none|
|»» documentUrl|string(url)|false|none|none|
|»» @context|array|false|none|none|
|»» highlights|[string]|false|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
Bearer
</aside>

## get__whoami

> Code samples

```javascript
var headers = {
  'Accept':'application/json',
  'Authorization':'Bearer {access-token}'

};

$.ajax({
  url: '/whoami',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

`GET /whoami`

GET /whoami

> Example responses

> 200 Response

```json
{
  "id": "string",
  "type": "Person",
  "summaryMap": {
    "en": "string"
  },
  "@context": [],
  "inbox": "string",
  "outbox": "string",
  "name": "string",
  "profile": {},
  "preferences": {},
  "json": {},
  "published": "2020-01-28T15:50:15Z",
  "updated": "2020-01-28T15:50:15Z"
}
```

<h3 id="get__whoami-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The reader object for the reader currently logged in|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|No Reader with ID {shortId}|None|

<h3 id="get__whoami-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(url)|false|none|none|
|» type|string|false|none|none|
|» summaryMap|object|false|none|none|
|»» en|string|false|none|none|
|» @context|array|false|none|none|
|» inbox|string(url)|false|none|none|
|» outbox|string(url)|false|none|none|
|» name|string|false|none|none|
|» profile|object|false|none|none|
|» preferences|object|false|none|none|
|» json|object|false|none|none|
|» published|string(date-time)|false|none|none|
|» updated|string(date-time)|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|Person|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
Bearer
</aside>

<h1 id="reader-api-jobs">jobs</h1>

## get__jobs_{id}

> Code samples

```javascript
var headers = {
  'Accept':'application/json',
  'Authorization':'Bearer {access-token}'

};

$.ajax({
  url: '/jobs/{id}',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

`GET /jobs/{id}`

GET /jobs/:id

<h3 id="get__jobs_{id}-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|the id of the job|

> Example responses

> 200 Response

```json
{
  "id": 0,
  "type": "epub",
  "published": "2020-01-28T15:50:15Z",
  "finished": "2020-01-28T15:50:15Z",
  "error": "string",
  "publicationId": "string",
  "status": 302
}
```

<h3 id="get__jobs_{id}-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A Job Object|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|No Job with ID {id}|None|

<h3 id="get__jobs_{id}-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|integer|false|none|none|
|» type|string|false|none|none|
|» published|string(date-time)|false|none|none|
|» finished|string(date-time)|false|none|none|
|» error|string|false|none|none|
|» publicationId|string|false|none|none|
|» status|integer|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|epub|
|status|302|
|status|304|
|status|500|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
Bearer
</aside>

<h1 id="reader-api-tags">tags</h1>

## delete__notes_{noteId}_tags_{tagId}

> Code samples

```javascript
var headers = {
  'Authorization':'Bearer {access-token}'

};

$.ajax({
  url: '/notes/{noteId}/tags/{tagId}',
  method: 'delete',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

`DELETE /notes/{noteId}/tags/{tagId}`

DELETE /notes/:noteId/tags/:tagId

<h3 id="delete__notes_{noteid}_tags_{tagid}-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|noteId|path|string|true|none|
|tagId|path|string|true|none|

<h3 id="delete__notes_{noteid}_tags_{tagid}-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|Successfully removed Tag from Note|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Access to tag or note disallowed|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|note, tag or note-tag relation not found|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
Bearer
</aside>

## put__notes_{noteId}_tags_{tagId}

> Code samples

```javascript
var headers = {
  'Authorization':'Bearer {access-token}'

};

$.ajax({
  url: '/notes/{noteId}/tags/{tagId}',
  method: 'put',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

`PUT /notes/{noteId}/tags/{tagId}`

PUT /notes/:noteId/tags/:tagId

<h3 id="put__notes_{noteid}_tags_{tagid}-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|noteId|path|string|true|none|
|tagId|path|string|true|none|

<h3 id="put__notes_{noteid}_tags_{tagid}-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|Successfully added Tag to Note|None|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Cannot assign the same tag twice|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Access to tag or note disallowed|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|note or tag not found|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
Bearer
</aside>

## delete__publications_{pubId}_tags_{tagId}

> Code samples

```javascript
var headers = {
  'Authorization':'Bearer {access-token}'

};

$.ajax({
  url: '/publications/{pubId}/tags/{tagId}',
  method: 'delete',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

`DELETE /publications/{pubId}/tags/{tagId}`

DELETE /publications/:pubId/tags/:tagId

<h3 id="delete__publications_{pubid}_tags_{tagid}-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|pubId|path|string|true|none|
|tagId|path|string|true|none|

<h3 id="delete__publications_{pubid}_tags_{tagid}-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|Successfully removed Tag from Publication|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Access to tag or publication disallowed|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|publication, tag or pub-tag relation not found|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
Bearer
</aside>

## put__publications_{pubId}_tags_{tagId}

> Code samples

```javascript
var headers = {
  'Authorization':'Bearer {access-token}'

};

$.ajax({
  url: '/publications/{pubId}/tags/{tagId}',
  method: 'put',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

`PUT /publications/{pubId}/tags/{tagId}`

PUT /publications/:pubId/tags/:tagId

<h3 id="put__publications_{pubid}_tags_{tagid}-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|pubId|path|string|true|none|
|tagId|path|string|true|none|

<h3 id="put__publications_{pubid}_tags_{tagid}-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|Successfully added Tag to Publication|None|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Cannot assign the same tag twice|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Access to tag or publication disallowed|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|publication or tag not found|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
Bearer
</aside>

## delete__tags_{tagId}

> Code samples

```javascript
var headers = {
  'Authorization':'Bearer {access-token}'

};

$.ajax({
  url: '/tags/{tagId}',
  method: 'delete',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

`DELETE /tags/{tagId}`

DELETE /tags/:tagId

<h3 id="delete__tags_{tagid}-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|tagId|path|string|true|none|

<h3 id="delete__tags_{tagid}-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|Successfully deleted Tag|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Access to tag {id} disallowed|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|Tag not found|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
Bearer
</aside>

## patch__tags_{tagId}

> Code samples

```javascript
var headers = {
  'Content-Type':'application/json',
  'Accept':'application/json',
  'Authorization':'Bearer {access-token}'

};

$.ajax({
  url: '/tags/{tagId}',
  method: 'patch',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

`PATCH /tags/{tagId}`

PATCH /tags/:tagId

> Body parameter

```json
{
  "id": "string",
  "type": "reader:Tag",
  "name": "string",
  "tagType": "string",
  "published": "string",
  "updated": "string"
}
```

<h3 id="patch__tags_{tagid}-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|tagId|path|string|true|none|
|body|body|[#/definitions/tag](#schema#/definitions/tag)|false|none|

> Example responses

> 200 Response

```json
{
  "id": "string",
  "type": "reader:Tag",
  "name": "string",
  "tagType": "string",
  "published": "string",
  "updated": "string"
}
```

<h3 id="patch__tags_{tagid}-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successfully updated Tag|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Validation error|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Access to tag {id} disallowed|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|Tag not found|None|

<h3 id="patch__tags_{tagid}-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(url)|false|none|none|
|» type|string|false|none|none|
|» name|string|false|none|none|
|» tagType|string|false|none|none|
|» published|string(timestamp)|false|none|none|
|» updated|string(timestamp)|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|reader:Tag|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
Bearer
</aside>

## post__tags

> Code samples

```javascript
var headers = {
  'Content-Type':'application/json',
  'Accept':'application/json',
  'Authorization':'Bearer {access-token}'

};

$.ajax({
  url: '/tags',
  method: 'post',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

`POST /tags`

POST /tags

> Body parameter

```json
{
  "id": "string",
  "type": "reader:Tag",
  "name": "string",
  "tagType": "string",
  "published": "string",
  "updated": "string"
}
```

<h3 id="post__tags-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[#/definitions/tag](#schema#/definitions/tag)|false|none|

> Example responses

> 201 Response

```json
{
  "id": "string",
  "type": "reader:Tag",
  "name": "string",
  "tagType": "string",
  "published": "string",
  "updated": "string"
}
```

<h3 id="post__tags-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|Successfully created Tag|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Validation error|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Access to reader {id} disallowed|None|

<h3 id="post__tags-responseschema">Response Schema</h3>

Status Code **201**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(url)|false|none|none|
|» type|string|false|none|none|
|» name|string|false|none|none|
|» tagType|string|false|none|none|
|» published|string(timestamp)|false|none|none|
|» updated|string(timestamp)|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|reader:Tag|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
Bearer
</aside>

## get__tags

> Code samples

```javascript
var headers = {
  'Accept':'application/json',
  'Authorization':'Bearer {access-token}'

};

$.ajax({
  url: '/tags',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

`GET /tags`

GET /tags

> Example responses

> 200 Response

```json
[
  {
    "id": "string",
    "type": "reader:Tag",
    "name": "string",
    "tagType": "string",
    "published": "string",
    "updated": "string"
  }
]
```

<h3 id="get__tags-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|An array of tags for the reader (based on the validation token)|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|No Reader found|None|

<h3 id="get__tags-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[#/definitions/tag](#schema#/definitions/tag)]|false|none|none|
|» id|string(url)|false|none|none|
|» type|string|false|none|none|
|» name|string|false|none|none|
|» tagType|string|false|none|none|
|» published|string(timestamp)|false|none|none|
|» updated|string(timestamp)|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|reader:Tag|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
Bearer
</aside>

<h1 id="reader-api-notes">notes</h1>

## delete__notes_{noteId}

> Code samples

```javascript
var headers = {
  'Authorization':'Bearer {access-token}'

};

$.ajax({
  url: '/notes/{noteId}',
  method: 'delete',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

`DELETE /notes/{noteId}`

DELETE /notes/:noteId

<h3 id="delete__notes_{noteid}-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|noteId|path|string|true|none|

<h3 id="delete__notes_{noteid}-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|Successfully deleted Note|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Access to publication {noteId} disallowed|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|Note not found|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
Bearer
</aside>

## put__notes_{noteId}

> Code samples

```javascript
var headers = {
  'Accept':'application/json',
  'Authorization':'Bearer {access-token}'

};

$.ajax({
  url: '/notes/{noteId}',
  method: 'put',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

`PUT /notes/{noteId}`

PUT /notes/:noteId

<h3 id="put__notes_{noteid}-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|noteId|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "id": "string",
  "type": "Note",
  "noteType": "string",
  "oa:hasSelector": {},
  "content": "string",
  "@context": [],
  "published": "2020-01-28T15:50:15Z",
  "updated": "2020-01-28T15:50:15Z",
  "inReplyTo": "string",
  "context": "string",
  "json": {}
}
```

<h3 id="put__notes_{noteid}-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successfully updated Note|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Access to publication {noteId} disallowed|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|Note not found|None|

<h3 id="put__notes_{noteid}-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(url)|false|none|none|
|» type|string|false|none|none|
|» noteType|string|false|none|none|
|» oa:hasSelector|object|false|none|none|
|» content|string|false|none|none|
|» @context|array|false|none|none|
|» published|string(date-time)|false|none|none|
|» updated|string(date-time)|false|none|none|
|» inReplyTo|string(url)|false|none|The url of the document|
|» context|string(url)|false|none|The url of the publication|
|» json|object|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|Note|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
Bearer
</aside>

## get__notes_{id}

> Code samples

```javascript
var headers = {
  'Accept':'application/json',
  'Authorization':'Bearer {access-token}'

};

$.ajax({
  url: '/notes/{id}',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

`GET /notes/{id}`

GET /notes/:id

<h3 id="get__notes_{id}-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|the short id of the note|

> Example responses

> 200 Response

```json
{
  "id": "string",
  "type": "Note",
  "noteType": "string",
  "oa:hasSelector": {},
  "content": "string",
  "@context": [],
  "published": "2020-01-28T15:50:15Z",
  "updated": "2020-01-28T15:50:15Z",
  "inReplyTo": "string",
  "context": "string",
  "json": {}
}
```

<h3 id="get__notes_{id}-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A Note Object|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Access to note {id} disallowed|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|No Note with ID {id}|None|

<h3 id="get__notes_{id}-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(url)|false|none|none|
|» type|string|false|none|none|
|» noteType|string|false|none|none|
|» oa:hasSelector|object|false|none|none|
|» content|string|false|none|none|
|» @context|array|false|none|none|
|» published|string(date-time)|false|none|none|
|» updated|string(date-time)|false|none|none|
|» inReplyTo|string(url)|false|none|The url of the document|
|» context|string(url)|false|none|The url of the publication|
|» json|object|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|Note|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
Bearer
</aside>

## post__notes

> Code samples

```javascript
var headers = {
  'Content-Type':'application/json',
  'Accept':'application/json',
  'Authorization':'Bearer {access-token}'

};

$.ajax({
  url: '/notes',
  method: 'post',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

`POST /notes`

POST /notes

> Body parameter

```json
{
  "id": "string",
  "type": "Note",
  "noteType": "string",
  "oa:hasSelector": {},
  "content": "string",
  "@context": [],
  "published": "2020-01-28T15:50:15Z",
  "updated": "2020-01-28T15:50:15Z",
  "inReplyTo": "string",
  "context": "string",
  "json": {}
}
```

<h3 id="post__notes-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[#/definitions/note](#schema#/definitions/note)|false|none|

> Example responses

> 201 Response

```json
{
  "id": "string",
  "type": "Note",
  "noteType": "string",
  "oa:hasSelector": {},
  "content": "string",
  "@context": [],
  "published": "2020-01-28T15:50:15Z",
  "updated": "2020-01-28T15:50:15Z",
  "inReplyTo": "string",
  "context": "string",
  "json": {}
}
```

<h3 id="post__notes-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|Successfully created Note|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Validation error|None|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Access to reader {id} disallowed|None|

<h3 id="post__notes-responseschema">Response Schema</h3>

Status Code **201**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string(url)|false|none|none|
|» type|string|false|none|none|
|» noteType|string|false|none|none|
|» oa:hasSelector|object|false|none|none|
|» content|string|false|none|none|
|» @context|array|false|none|none|
|» published|string(date-time)|false|none|none|
|» updated|string(date-time)|false|none|none|
|» inReplyTo|string(url)|false|none|The url of the document|
|» context|string(url)|false|none|The url of the publication|
|» json|object|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|Note|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
Bearer
</aside>

