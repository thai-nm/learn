import { createApp } from "./app.js";
import { createCloudflareAccessVerifier } from "./auth/cloudflareAccess.js";
import { createDevVerifier } from "./auth/devVerifier.js";
import type { AuthVerifier } from "./auth/verifier.js";
import { getCloudflareAccessConfig, getPostgresConfig } from "./config.js";
import { PostgresRepository } from "./repositories/postgresRepository.js";

const repository = new PostgresRepository(getPostgresConfig());

// DEV_USER_EMAIL is only ever set locally (backend/.env) — a real
// Cloudflare-signed assertion can't be produced outside Cloudflare's own
// infrastructure, so local dev authenticates as a fixed identity instead.
// The deployed environment never sets this var, so it can't fall back to
// the dev verifier by accident.
const authVerifier: AuthVerifier = process.env.DEV_USER_EMAIL
  ? createDevVerifier(process.env.DEV_USER_EMAIL)
  : createCloudflareAccessVerifier(getCloudflareAccessConfig());

const app = createApp(repository, authVerifier);
const port = Number(process.env.PORT ?? 3000);

app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening at http://0.0.0.0:${port}`);
});
