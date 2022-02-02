# Overview Guide

## Authorization

The server uses [OAuth 2.0](https://oauth.net/2/) for authorization, with [JWT](https://jwt.io/)
tokens. The JWT tokens should use the same secret value as defined by the `SECRETORKEY`
configuration variable (see below). It should also use the audience and issuer defined by `AUDIENCE`
and `ISSUER`.

Tokens are passed to the server as [bearer tokens](https://oauth.net/2/bearer-tokens/). A typical
example:

```
GET /924WWrqtc2dbZMF2NQRiHp/library HTTP/1.1
Host: api.rebus.foundation
Date: Fri, 19 Oct 2018 16:25:55 GMT
Authorization: Bearer <token>
```

...where `<token>` is the JWT token.

Typically only the owner of a resource can access a resource.

### Errors

Requests without a JWT token will fail with a 401 status code. Requests with a valid JWT token for
access to another user's resources will fail with a 403 status code.

## Documentation

The documentation for the routes is available at https://rebusfoundation.github.io/reader-api.

Note for developers: inline swagger documentation should be updated whenever you make changes to the
routes. The hosted documentation will be updated automatically once a pull request is merged on
master.
