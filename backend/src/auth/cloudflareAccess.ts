import { createRemoteJWKSet, jwtVerify } from "jose";
import type { CloudflareAccessConfig } from "../config.js";
import type { AuthVerifier } from "./verifier.js";

const ACCESS_JWT_HEADER = "cf-access-jwt-assertion";

/**
 * Trusts Cloudflare Access's signed JWT assertion rather than the app
 * doing any login of its own. Cloudflare attaches this header to every
 * request that passed its edge-level Access policy (Google/GitHub sign-in
 * happens entirely outside the app, before traffic reaches it).
 */
export function createCloudflareAccessVerifier(config: CloudflareAccessConfig): AuthVerifier {
  const jwks = createRemoteJWKSet(new URL(`https://${config.teamDomain}/cdn-cgi/access/certs`));

  return async (req) => {
    const token = req.header(ACCESS_JWT_HEADER);
    if (!token) return null;

    try {
      const { payload } = await jwtVerify(token, jwks, {
        issuer: `https://${config.teamDomain}`,
        audience: config.audience,
      });
      if (typeof payload.email !== "string") return null;
      return { email: payload.email };
    } catch {
      return null;
    }
  };
}
