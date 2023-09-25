# Express Sessionless

Sessionless middleware for Express.js

## Features

- Works with Promises.
- Typescript-friendly.

## Basic Setup

Install using your favourite package manager.

```bash
npm i @chriscarleton/express-sessionless
yarn add @chriscarleton/express-sessionless
```

Next, register your middleware with Express. Be sure to do this before you register any of your routes!
You want the middleware to verify any JWTs before your route handlers take over!

For more advanced configuration continue reading below.

```javascript
const express = require('express');
const sessionless = require('@chriscarleton/express-sessionless');

const app = express();
app.use(
  sessionless({
    serializeUser: async (user) => JSON.stringify(user),
    deserializeUser: async (subject) => JSON.parse(subject),
    secret: 'super-secret-key',
  }),
);
```

The example above is a very simple implementation. It will store the entire user object (as serialized JSON)
in the JWT as the subject (`sub`) field.
