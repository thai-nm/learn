import { createApp } from "./app.js";
import { createEmailIdentityVerifier } from "./auth/emailIdentity.js";
import { getSqliteConfig } from "./config.js";
import { SqliteRepository } from "./repositories/sqliteRepository.js";

const repository = new SqliteRepository(getSqliteConfig());
const authVerifier = createEmailIdentityVerifier();

const app = createApp(repository, authVerifier);
const port = Number(process.env.PORT ?? 3000);

app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening at http://0.0.0.0:${port}`);
});
