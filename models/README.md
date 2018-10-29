# Models

The actual activity stream JSON object is stored under the `json` property of the model.

The model's `id` property is an automatically generated uuid.

The model's `url` property is it's activity stream id.

The models expect input resources to be activity streams objects which are parsed using the `$parseJson` method on the Base Model.

Stringifying a model to JSON should automatically convert it from the internal model to an activity streams document.

All of the models except the Reader model require a `bto` property to indicate the reader whose library the resource belongs to which translates to an internal `readerId` property. This is almost definitely not quite 'kosher' user of activity streams but should work. The Reader model does not need that property (obviously) so requires a little bit different processing. (We almost certainly need a `getProfile` POST endpoint that is called by the sign-up/sign-in process to either get or create a profile. Will file an issue.)

We also aren't trying to discover roles and 'isContributor' status for Attributions at all. We need to reconsider how we handle publication-specific metadata. Might be best handled with a specific schema.org JSON file. (Will file an issue.)

## Publication

## Document

Document and Note models have a `type` property which should be that document's _media type_.

## Note

Currently the DB schema allows for notes that are attached to just a Document with no referenced Publication. This may or may not be a problem depending on where we go.

## Activity

When saved the model should have a reference to the resources it acted on to make it easy to track activities (like reading) on a per-publication or per-document basis

## TODO

### Validation

Objection supports the full JSON-schema specification for validating incoming data. So in theory we could have fairly detailed validation that covers a lot of the activity streams specification if we want to. We don't at the moment.
