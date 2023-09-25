import {
  CookieOptions,
  ErrorRequestHandler,
  Request,
  RequestHandler,
  Response,
} from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

import {
  fromBearerToken,
  fromExtractFunctions,
  fromSessionCookie,
} from './read-jwt';

export const DefaultCookieName = 'auth.sessionless';

/**
 * A function to sign a JWT. Use this to generate the token directly if you would prefer use to not use a session cookie.
 *
 * @param user Any user object you prefer.
 * @returns Returns a Promise to return a string containing the signed JSON Web Token.
 */
export type SignJwtFunction = (user: Express.User) => Promise<string>;
export type IssueAuthCookieFunction = (user: Express.User) => Promise<void>;
export type RevokeAuthCookieFunction = () => void;

export type SerializeUserFunction = (user: Express.User) => Promise<string>;
export type DeserializeUserFunction = (
  req: Request,
  subject: string,
) => Promise<Express.User>;

export type ExtractJwtFromRequestFunction = (req: Request) => string | null;

export type SessionlessOptions = {
  /** A callback to serialize the user. */
  serializeUser: SerializeUserFunction;

  /** A callback to deserialize the user.  */
  deserializeUser: DeserializeUserFunction;

  /** The secret string used to sign the JWT. A long string of random characters is the most secure option in production. */
  secret: string;

  /** The audience to set in the JWT. */
  audience?: string;

  /**
   * How long the token should live for (in milliseconds). This will be used to calculate the expiration time of the JWT.
   * If omitted, the JWT will not expire.
   */
  ttl?: number;

  /**
   * An optional function to extract the JWT from the request object. Default behaviour is to look for a Bearer token in
   * the Authorization header and then look for a session cookie if it is not found.
   */
  extractJwtFromRequest?: ExtractJwtFromRequestFunction;

  /**
   * Indicates to express-serverless how to handle errors that occur while verifying JWT tokens.
   *  - If falsy the error will not be handled (an exception will be thrown.)
   *  - If `true`, the error will be caught and quietly suppressed. (Use only if you don't care when JWT tokens are rejected.)
   *  - You may also pass in a custom callback to handle the error yourself.
   */
  handleVerificationError?: boolean | ErrorRequestHandler;

  /**
   * Options for the cookie issued to the browser containing the JWT.
   */
  cookie?: {
    /** Name of the cookie as it should appear in the browser. */
    name: string;
  } & Omit<CookieOptions, 'expires'>;
};

function signJwt(options: SessionlessOptions): SignJwtFunction {
  return async (user: Express.User): Promise<string> => {
    const now = Date.now();
    const payload: JwtPayload = {
      aud: options.audience,
      iat: now,
      sub: await options.serializeUser(user),
    };

    if (options.ttl) {
      payload.exp = now + options.ttl;
    }

    const token = await new Promise<string>((resolve, reject) => {
      jwt.sign(payload, options.secret, {}, (error, token) => {
        if (error) reject(error);
        else resolve(token!);
      });
    });

    return token;
  };
}

function issueAuthCookie(
  options: SessionlessOptions,
  req: Request,
  res: Response,
): IssueAuthCookieFunction {
  return async (user): Promise<void> => {
    const jwt = await req.signJwt(user);
    if (options.cookie) {
      res.cookie(options.cookie.name, jwt, {
        ...options.cookie,
        ...(options.ttl ? { expires: new Date(Date.now() + options.ttl) } : {}),
      });
    } else {
      res.cookie(DefaultCookieName, jwt, {
        httpOnly: true,
        ...(options.ttl ? { expires: new Date(Date.now() + options.ttl) } : {}),
      });
    }
  };
}

function revokeAuthCookie(
  options: SessionlessOptions,
  res: Response,
): RevokeAuthCookieFunction {
  return () => {
    res.clearCookie(options.cookie?.name ?? DefaultCookieName);
  };
}

/**
 * Use express-sessionless with your Express.js app.
 * @param options A {@link SessionlessOptions} object. Required to configure express-sessionless.
 * @returns Returns an Express.js middleware that you can use in your application.
 */
function expressSessionless(options: SessionlessOptions): RequestHandler {
  options = {
    cookie: {
      name: DefaultCookieName,
      httpOnly: true,
    },
    ...options,
  };

  return async (req, res, next): Promise<void> => {
    const extractJwt =
      options.extractJwtFromRequest ??
      fromExtractFunctions(
        fromBearerToken(),
        fromSessionCookie(options.cookie?.name ?? DefaultCookieName),
      );

    // Add functions to request object.
    req.signJwt = signJwt(options);
    req.issueAuthCookie = issueAuthCookie(options, req, res);
    req.revokeAuthCookie = revokeAuthCookie(options, res);

    const token = extractJwt(req);
    if (!token) return next();

    const payload = await new Promise<JwtPayload | null>((resolve, reject) => {
      jwt.verify(token, options.secret, {}, (error, payload) => {
        if (error) {
          if (!options.handleVerificationError) {
            return reject(error);
          } else if (typeof options.handleVerificationError === 'function') {
            options.handleVerificationError(error, req, res, next);
          }
          return resolve(null);
        } else if (payload && typeof payload === 'object') {
          resolve(payload);
        }

        return resolve(null);
      });
    });
    if (!payload || !payload.sub) return next();

    const user = await options.deserializeUser(req, payload.sub);
    if (user) req.user = user;

    next();
  };
}

export default expressSessionless;
