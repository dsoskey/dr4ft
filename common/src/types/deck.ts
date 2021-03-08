import { Card } from "./card";

export interface DeckRow {
    count: number;
    card: Card;
    sideboard: boolean;
}

export interface Deck {
    side: DeckRow[];
    main: DeckRow[];
}