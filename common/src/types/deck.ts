import { Dictionary } from "lodash";
import { Card } from "./card";

export interface DeckRow {
    count: number;
    card: Card;
    sideboard: boolean;
}


export interface Deck<ZoneRep = DeckRow[]> {
    side: ZoneRep;
    main: ZoneRep;
}