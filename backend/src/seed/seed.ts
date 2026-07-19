import type { Repository } from "../domain/repository.js";
import { STARTER_CARDS, STARTER_DECK } from "./starterDeck.js";

/** Loads the starter deck into any Repository implementation (in-memory now, Supabase later). */
export async function seedStarterDeck(repository: Repository): Promise<void> {
  const deck = await repository.createDeck(STARTER_DECK);
  for (const card of STARTER_CARDS) {
    await repository.createCard({ ...card, deckId: deck.id });
  }
}
