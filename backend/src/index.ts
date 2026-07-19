import { createApp } from "./app.js";
import { createSupabaseAuthVerifier } from "./auth/supabaseAuth.js";
import { getAuthConfig, getSupabaseConfig } from "./config.js";
import { SupabaseRepository } from "./repositories/supabaseRepository.js";

const repository = new SupabaseRepository(getSupabaseConfig());
const authConfig = getAuthConfig();
const authVerifier = createSupabaseAuthVerifier(authConfig);

const app = createApp(repository, authConfig, authVerifier);
const port = Number(process.env.PORT ?? 3000);

app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening at http://0.0.0.0:${port}`);
});
