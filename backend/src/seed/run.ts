import { getSqliteConfig } from "../config.js";
import { SqliteRepository } from "../repositories/sqliteRepository.js";
import { seedStarterDeck } from "./seed.js";
import { SEED_OWNER_EMAIL } from "./starterDeck.js";

const repository = new SqliteRepository(getSqliteConfig());
const existingDecks = await repository.listDecks(SEED_OWNER_EMAIL);

if (existingDecks.some((deck) => deck.visibility === "shared")) {
  console.log("A shared starter deck already exists — skipping seed.");
  process.exit(0);
}

await seedStarterDeck(repository);
console.log("Starter deck seeded.");
