import { createApp } from "./app.js";
import { InMemoryRepository } from "./repositories/inMemoryRepository.js";
import { seedStarterDeck } from "./seed/seed.js";

// In-memory repository for now; swap for a Supabase-backed implementation
// once Phase 2's schema/migrations land (docs/PLAN.md Section 5).
const repository = new InMemoryRepository();
await seedStarterDeck(repository);

const app = createApp(repository);
const port = Number(process.env.PORT ?? 3000);

app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening at http://0.0.0.0:${port}`);
});
