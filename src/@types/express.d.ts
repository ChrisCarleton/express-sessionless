declare global {
  /* eslint-disable-next-line @typescript-eslint/no-namespace */
  namespace Express {
    /** Interface representing a user. Extend this inerface with your own properties. */
    interface User {}

    interface Request {
      /** Set the authentication cookie on the response. */
      issueAuthCookie: IssueAuthCookieFunction;

      signJwt: SignJwtFunction;

      revokeAuthCookie: RevokeAuthCookieFunction;

      user?: Express.User;
    }
  }
}

export {};
