import { getSupabaseConfig } from "../config.js";
import { SupabaseRepository } from "../repositories/supabaseRepository.js";
import { seedStarterDeck } from "./seed.js";

const repository = new SupabaseRepository(getSupabaseConfig());
const existingDecks = await repository.listDecks();

if (existingDecks.some((deck) => deck.visibility === "shared")) {
  console.log("A shared starter deck already exists — skipping seed.");
  process.exit(0);
}

await seedStarterDeck(repository);
console.log("Starter deck seeded.");
