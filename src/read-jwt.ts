import { ExtractJwtFromRequestFunction } from '.';

export function fromBearerToken(): ExtractJwtFromRequestFunction {
  return (req) => {
    if (
      req.headers.authorization &&
      typeof req.headers.authorization === 'string' &&
      /^Bearer .+/i.test(req.headers.authorization)
    ) {
      return req.headers.authorization.substring(7).trim();
    }

    return null;
  };
}

export function fromHeader(header: string): ExtractJwtFromRequestFunction {
  return (req) => {
    const token = req.headers[header];

    if (typeof token === 'string' && token.length) {
      return token;
    }

    return null;
  };
}

export function fromSessionCookie(
  cookieNme: string,
): ExtractJwtFromRequestFunction {
  return (req) => {
    const token = req.cookies[cookieNme];
    if (typeof token === 'string' && token.length) {
      return token;
    }

    return null;
  };
}

export function fromExtractFunctions(
  ...extractors: ExtractJwtFromRequestFunction[]
): ExtractJwtFromRequestFunction {
  return (req) => {
    for (const extractor of extractors) {
      const token = extractor(req);
      if (token) return token;
    }

    return null;
  };
}
