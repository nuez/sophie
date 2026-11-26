export type Slot = 'cabeza' | 'cuello' | 'cara' | 'cama' | 'pared' | 'alfombra' | 'juguete';

export interface Item {
  id: string;
  name: string;
  /** In cents. */
  price: number;
  slot: Slot;
}

/** Things to buy in the shop. Pet slots: cabeza, cuello, cara. Room slots: the rest. */
export const ITEMS: Item[] = [
  { id: 'lazo-rosa', name: 'Lazo rosa', price: 130, slot: 'cabeza' },
  { id: 'gorro-lana', name: 'Gorro de lana', price: 230, slot: 'cabeza' },
  { id: 'corona', name: 'Corona', price: 690, slot: 'cabeza' },
  { id: 'sombrero', name: 'Sombrero', price: 355, slot: 'cabeza' },
  { id: 'flores', name: 'Corona de flores', price: 455, slot: 'cabeza' },
  { id: 'gorra', name: 'Gorra', price: 260, slot: 'cabeza' },
  { id: 'pajarita', name: 'Pajarita', price: 170, slot: 'cuello' },
  { id: 'bufanda', name: 'Bufanda', price: 280, slot: 'cuello' },
  { id: 'collar', name: 'Collar de perlas', price: 520, slot: 'cuello' },
  { id: 'cascabel', name: 'Cascabel', price: 110, slot: 'cuello' },
  { id: 'gafas', name: 'Gafas redondas', price: 210, slot: 'cara' },
  { id: 'gafas-sol', name: 'Gafas de sol', price: 310, slot: 'cara' },
  { id: 'gafas-corazon', name: 'Gafas de corazón', price: 390, slot: 'cara' },
  { id: 'cojin', name: 'Cojín', price: 220, slot: 'cama' },
  { id: 'cama-nube', name: 'Cama nube', price: 640, slot: 'cama' },
  { id: 'pared-estrellas', name: 'Pared de estrellas', price: 330, slot: 'pared' },
  { id: 'pared-rayas', name: 'Pared de rayas', price: 255, slot: 'pared' },
  { id: 'pared-corazones', name: 'Pared de corazones', price: 370, slot: 'pared' },
  { id: 'alfombra-redonda', name: 'Alfombra redonda', price: 190, slot: 'alfombra' },
  { id: 'alfombra-arcoiris', name: 'Alfombra arcoíris', price: 555, slot: 'alfombra' },
  { id: 'pelota', name: 'Pelota', price: 90, slot: 'juguete' },
  { id: 'osito', name: 'Osito de peluche', price: 360, slot: 'juguete' },
  { id: 'planta', name: 'Planta', price: 140, slot: 'juguete' },
  { id: 'cohete', name: 'Cohete', price: 590, slot: 'juguete' },
];

export const itemById = (id: string) => ITEMS.find((i) => i.id === id);

/** Equip an item, replacing whatever was in the same slot. */
export function equip(equipped: string[], id: string): string[] {
  const slot = itemById(id)?.slot;
  return [...equipped.filter((e) => itemById(e)?.slot !== slot), id];
}
