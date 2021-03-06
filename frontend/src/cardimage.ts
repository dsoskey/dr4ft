import { app } from "./router";
import { Card } from "common/src/types/card";

/**
 *
 * @param {string} setCode the setCode of the card
 * @param {(string|number)} number the number of the card
 * @return {string} the
 *
 * @example
 *  getScryfallImage("XLN", 1)
 *  getScryfallImage("XLN", "10a")
 *  getScryfallImage("XLN", "10b")
 */
const getScryfallImage = (setCode: string, number: string | number): string => (
  `https://api.scryfall.com/cards/${setCode.toLowerCase()}/${number}?format=image&version=${app.state.cardSize}`
);

/**
 *
 * @description returns a cards image URL with the lang selected in the app
 * @param {string} setCode the setCode of the card
 * @param {(string|number)} number the number of the card
 * @return {string} the
 *
 * @example
 *  getScryfallImage("XLN", 1)
 *  getScryfallImage("XLN", "10a")
 *  getScryfallImage("XLN", "10b")
 */
const getScryfallImageWithLang = (setCode: string, number: string | number): string => (
  `https://api.scryfall.com/cards/${setCode.toLowerCase()}/${number}/${app.state.cardLang}?format=image&version=${app.state.cardSize}`
);

/**
 * @description builds an event function that returns an image url
 * @param {Card} param0
 */
export const getFallbackSrc = ({setCode, number}: Card) => {
  const url = getScryfallImage(setCode, number);
  return (ev: any) => {
    if (url !== ev.target.src) {
      ev.target.src = url;
    }
  };
};
/**
 * @description builds an image url based on the card properties
 * @param {Card} card
 * @returns {string} the image url to display
 */
export const getCardSrc = ({identifiers, url, setCode, number, isBack}: Card): string => (
  identifiers && identifiers.scryfallId !== ""
    ? `${getScryfallImageWithLang(setCode, number)}${isBack ? "&face=back" : ""}`
    : url
);
