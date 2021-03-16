
export type ColorSign = 'W' | 'U' | 'B' | 'R' | 'G';
export type CardId = string;

export interface MtgJsonCard extends ExternalCard {
    isAlternative: boolean;
    types: string[];
    convertedManaCost?: number;
}

/**
 * Represents a card retreived from an external source (usually scryfall or mtgjson).
 */
export interface ExternalCard {
    uuid: string;
    name: string;
    type: string;
    manaCost: string;
    color: string;
    colors: ColorSign[];
    cmc: number;
    rarity: 'Basic' | 'Common' | 'Uncommon' | 'Rare' | 'Mythic' | string;
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
    layout: 'flip' | 'split' | 'modal_dfc' | 'double-faced' | 'transform' | 'meld' | string;
    foil?: boolean;
    flippedIsBack: boolean;
    flippedNumber: string;
    flippedCardURL: string;
    colorIdentity: string[];
    faceName?: string;
    frameEffects?: string[];
    otherFaceIds?: string[];
    scryfallId?: string;
}
/**
 * Represents a card within the dr5ft ecosystem.
 */
export interface Card extends ExternalCard {
    cardId: CardId; // TODO: Verify true TODO verify nullable
}

export interface ScryfallCardData {
    card_faces?: ScryfallCardData[];
    name: string;
    set: string;
    collector_number: string;
}