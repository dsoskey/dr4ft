export enum Zone {
  main = 'main',
  side = 'side',
  pack = 'pack',
  junk = 'junk'
}

const ZONE_NAMES = {
  [Zone.pack]: "Pack",
  [Zone.main]: "Main Deck",
  [Zone.side]: "Sideboard",
  [Zone.junk]: "Junk"
};

export const getZoneDisplayName = (zoneName: Zone) => ZONE_NAMES[zoneName];
