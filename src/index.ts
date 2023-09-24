/* eslint-disable @typescript-eslint/no-namespace */
import { RequestHandler, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      /** Set the authentication cookie on the response. */
      setAuthCookie: SetAuthCookieFunction;
    }

    /** Interface representing a user. Extend this inerface with your own properties. */
    interface User {}
  }
}

export type SerializeUserCallback = (
  error: Error | null,
  subject?: string | false,
) => void;
export type SerializeUserFunction = (
  user: Express.User,
  cb: SerializeUserCallback,
) => void;

export type DeserializeUserCallback = (
  error: Error | null,
  user: Express.User | false,
) => void;
export type DeserializeUserFunction = (
  payload: JwtPayload,
  cb: DeserializeUserCallback,
) => void;

export type SetAuthCookieCallback = (error?: Error) => void;
export type SetAuthCookieFunction = (
  user: Express.User,
  cb?: SetAuthCookieCallback,
) => Promise<void> | void;

export type SessionlessOptions = {
  serializeUser: SerializeUserFunction;
  deserializeUser: DeserializeUserFunction;
};

const DefualtOptions: Partial<SessionlessOptions> = {};

function signJwt(options: SessionlessOptions) {
  const payload: JwtPayload = {};
}

export function setAuthCookie(
  res: Response,
  options: SessionlessOptions,
): SetAuthCookieFunction {
  return (user, cb) => {};
}

export function sessionless(options: SessionlessOptions): RequestHandler {
  options = {
    ...DefualtOptions,
    ...options,
  };

  return (req, res, next) => {
    req.setAuthCookie = setAuthCookie(res, options);
    next();
  };
}

export default sessionless;
