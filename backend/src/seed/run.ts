import { getPostgresConfig } from "../config.js";
import { PostgresRepository } from "../repositories/postgresRepository.js";
import { seedStarterDeck } from "./seed.js";

const repository = new PostgresRepository(getPostgresConfig());
const existingDecks = await repository.listDecks();

if (existingDecks.some((deck) => deck.visibility === "shared")) {
  console.log("A shared starter deck already exists — skipping seed.");
  process.exit(0);
}

await seedStarterDeck(repository);
console.log("Starter deck seeded.");
