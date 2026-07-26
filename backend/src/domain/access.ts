import type { Deck } from "./types.js";

/** Whether `email` can view `deck` — its owner, or anyone if it's shared. */
export function canReadDeck(deck: Deck, email: string): boolean {
  return deck.ownerEmail === email || deck.visibility === "shared";
}

/** Whether `email` can create/edit/delete cards in `deck` — owner only, even if shared. */
export function canWriteDeck(deck: Deck, email: string): boolean {
  return deck.ownerEmail === email;
}
