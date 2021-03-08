import { Deck } from "./deck";

export type ExportFormat = 'cockatrice' | 'mtgo' | 'mtga' | 'text' | 'json';

export interface ExportStrategy {
    name: string;
    downloadExtension: string;
    download?: (fileName: string, deck: Deck) => string;
    copy?: (name: string, deck: Deck) => string;
}