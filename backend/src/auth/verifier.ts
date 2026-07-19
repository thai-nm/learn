/** Returns true if the given bearer token is a valid session for the fixed account. */
export type AuthVerifier = (token: string) => Promise<boolean>;
