/* eslint-disable @typescript-eslint/no-namespace */
import { CookieParseOptions } from 'cookie-parser';
import { RequestHandler } from 'express';
import { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      blah: string;
    }

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

export type SessionlessOptions = {
  serializeUser: SerializeUserFunction;
  deserializeUser: DeserializeUserFunction;
};

const DefualtOptions: Partial<SessionlessOptions> = {};

export function sessionless(options: SessionlessOptions): RequestHandler {
  options = {
    ...DefualtOptions,
    ...options,
  };

  return (req, res, next) => {};
}

export default sessionless;
