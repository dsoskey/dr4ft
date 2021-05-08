import { Card, ColorSign } from 'common/src/types/card';
import _range from 'lodash/range';

const colors: ColorSign[] = ['W', 'U', 'B', 'R', 'G'];
const colorRegex = /{[^}]+}/g;
export const getLandSuggestion = (main: Card[], targetDeckSize: number): Record<ColorSign, number> => {
    // Algorithm: count the number of mana symbols appearing in the costs of
    // the cards in the pool, then assign lands roughly commensurately.

    const manaSymbols: { [key: string]: number } = {};
    colors.forEach(x => manaSymbols[x] = 0);

    // Count the number of mana symbols of each type.
    main.forEach((card) => {
        if (!card.manaCost)
        return;
        const cardManaSymbols = card.manaCost.match(colorRegex);

        if (cardManaSymbols) {
        colors.forEach((color) => {
            Object.values(cardManaSymbols).forEach((symbol) => {
            // Test to see if '{U}' contains 'U'. This also handles things like
            // '{G/U}' triggering both 'G' and 'U'.
            if (symbol.indexOf(color) !== -1)
                manaSymbols[color] += 1;
            });
        });
        }
    });

    const mainColors = colors.filter(x => manaSymbols[x] > 0);
    mainColors.forEach(x => manaSymbols[x] = Math.max(3, manaSymbols[x]));
    mainColors.sort((a, b) => manaSymbols[b] - manaSymbols[a]);

    // Round-robin choose the lands to go into the deck. For example, if the
    // mana symbol counts are W: 2, U: 2, B: 1, cycle through the sequence
    // [Plains, Island, Swamp, Plains, Island] infinitely until the deck is
    // finished.
    //
    // This has a few nice effects:
    //
    //   * Colors with greater mana symbol counts get more lands.
    //
    //   * When in a typical two color deck adding 17 lands, the 9/8 split will
    //   be in favor of the color with slightly more mana symbols of that
    //   color.
    //
    //   * Every color in the deck is represented, if it is possible to do so
    //   in the remaining number of cards.
    //
    //   * Because of the minimum mana symbol count for each represented color,
    //   splashing cards doesn't add exactly one land of the given type
    //   (although the land count may still be low for that color).
    //
    //   * The problem of deciding how to round land counts is now easy to
    //   solve.
    const manaSymbolsToAdd = mainColors.map(color => manaSymbols[color]);
    const colorsToAdd: ColorSign[] = [];
    const emptyManaSymbols = () => !manaSymbolsToAdd.every(x => x === 0);

    for (let i = 0; emptyManaSymbols(); i = (i + 1) % mainColors.length) {
        if (manaSymbolsToAdd[i] === 0) {
        continue;
        }
        colorsToAdd.push(mainColors[i]);
        manaSymbolsToAdd[i]--;
    }

    const basicLandsMap: Record<ColorSign, number> = {
        W: 0,
        U: 0,
        B: 0,
        R: 0,
        G: 0,
    };
    if (colorsToAdd.length > 0) {
        const mainDeckSize = main.length;

        let j = 0;

        _range(targetDeckSize - mainDeckSize).forEach(() => {
            const color = colorsToAdd[j];
            basicLandsMap[color] = ++basicLandsMap[color] || 1;
            j = (j + 1) % colorsToAdd.length;
        });
    }
    return basicLandsMap;
}