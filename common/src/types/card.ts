
export type ColorSign = 'W' | 'U' | 'B' | 'R' | 'G';
export type CardId = string;
export interface Card {
    cardId: CardId; // TODO: Verify true TODO verify nullable
    uuid: string;
    name: string;
    type: string;
    manaCost: string;
    color: string;
    colors: string[];
    cmc: number;
    rarity: string;
    supertypes: string[];
    subtypes: string[];
    power?: string;
    toughness?: string;
    text?: string;
    loyalty?: string;
    isBack?: boolean;
    url: string;
    setCode: string;
    number: string;
    identifiers?: any;
    isDoubleFaced: boolean;
    layout: 'flip' | 'split' | string;
    foil?: boolean;
    flippedIsBack: boolean;
    flippedNumber: string;
    flippedCardURL: string;
    colorIdentity: string[];
}

export interface ScryfallCardData {
    card_faces?: ScryfallCardData[];
    name: string;
    set: string;
    collector_number: string;
}