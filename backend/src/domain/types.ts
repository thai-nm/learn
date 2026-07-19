export type Visibility = "personal" | "shared";

export interface Deck {
  id: string;
  title: string;
  description: string;
  topics: string[];
  visibility: Visibility;
}

export interface Card {
  id: string;
  deckId: string;
  front: string;
  back: string;
  why?: string;
  topic: string;
}

export interface ReviewState {
  cardId: string;
  userId: string;
  intervalDays: number;
  easeFactor: number;
  nextReviewDate: Date;
  lastReviewedAt: Date | null;
  reviewCount: number;
}

export interface DueCard {
  card: Card;
  reviewState: ReviewState;
}
