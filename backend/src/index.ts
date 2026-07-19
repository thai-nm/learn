import { createApp } from "./app.js";
import { getSupabaseConfig } from "./config.js";
import { SupabaseRepository } from "./repositories/supabaseRepository.js";

const repository = new SupabaseRepository(getSupabaseConfig());

const app = createApp(repository);
const port = Number(process.env.PORT ?? 3000);

app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening at http://0.0.0.0:${port}`);
});
