# Models

The actual activity stream JSON object is stored under the `json` property of the model.

The model's `id` property is an automatically generated uuid.

The model's `url` property is it's activity stream id.

## Publication

## Document

Document and Note models have a `type` property which should be that document's _media type_.

## Note

Currently the DB schema allows for notes that are attached to just a Document with no referenced Publication. This may or may not be a problem depending on where we go.

## Activity

When saved the model should have a reference to the resources it acted on to make it easy to track activities (like reading) on a per-publication or per-document basis

## TODO

### Models

* Tag: needed to implement Stacks, Mentions, HashTags and other references in an Activity Stream `tag` property.

### Validation

Objection supports the full JSON-schema specification for validating incoming data. So in theory we could have fairly detailed validation that covers a lot of the activity streams specification if we want to.
