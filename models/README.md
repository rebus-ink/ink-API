# Models

The actual activity stream JSON object is stored under the `json` property of the model.

The model's `id` property is an automatically generated uuid.

The model's `url` property is it's activity stream id.

## Publication

## Document

Document and Note models have a `type` property which should be that document's _media type_.

## Note

Currently the DB schema allows for notes that are attached to just a Document with no referenced Publication. This may or may not be a problem depending on where we go.
