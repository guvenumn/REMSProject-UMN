// Path: /backend/src/types/jsonwebtoken.d.ts
// Consolidated from both jsonwebtoken.d.ts and jwt.d.ts

import * as jwt from "jsonwebtoken";

declare module "jsonwebtoken" {
  // Add our own overload for the sign function
  export function sign(
    payload: string | object | Buffer,
    secretOrPrivateKey: jwt.Secret,
    options?: jwt.SignOptions
  ): string;

  export function verify(
    token: string,
    secretOrPublicKey: string,
    options?: object
  ): any;
}
