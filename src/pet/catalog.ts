export type Slot = 'cabeza' | 'cuello' | 'cara' | 'cama' | 'pared' | 'alfombra' | 'juguete';

export interface Item {
  id: string;
  name: string;
  price: number;
  slot: Slot;
}

/** Things to buy in the shop. Pet slots: cabeza, cuello, cara. Room slots: the rest. */
export const ITEMS: Item[] = [
  { id: 'lazo-rosa', name: 'Lazo rosa', price: 6, slot: 'cabeza' },
  { id: 'gorro-lana', name: 'Gorro de lana', price: 10, slot: 'cabeza' },
  { id: 'corona', name: 'Corona', price: 30, slot: 'cabeza' },
  { id: 'sombrero', name: 'Sombrero', price: 16, slot: 'cabeza' },
  { id: 'flores', name: 'Corona de flores', price: 20, slot: 'cabeza' },
  { id: 'gorra', name: 'Gorra', price: 12, slot: 'cabeza' },
  { id: 'pajarita', name: 'Pajarita', price: 8, slot: 'cuello' },
  { id: 'bufanda', name: 'Bufanda', price: 12, slot: 'cuello' },
  { id: 'collar', name: 'Collar de perlas', price: 22, slot: 'cuello' },
  { id: 'cascabel', name: 'Cascabel', price: 6, slot: 'cuello' },
  { id: 'gafas', name: 'Gafas redondas', price: 10, slot: 'cara' },
  { id: 'gafas-sol', name: 'Gafas de sol', price: 14, slot: 'cara' },
  { id: 'gafas-corazon', name: 'Gafas de corazón', price: 18, slot: 'cara' },
  { id: 'cojin', name: 'Cojín', price: 10, slot: 'cama' },
  { id: 'cama-nube', name: 'Cama nube', price: 28, slot: 'cama' },
  { id: 'pared-estrellas', name: 'Pared de estrellas', price: 15, slot: 'pared' },
  { id: 'pared-rayas', name: 'Pared de rayas', price: 12, slot: 'pared' },
  { id: 'pared-corazones', name: 'Pared de corazones', price: 18, slot: 'pared' },
  { id: 'alfombra-redonda', name: 'Alfombra redonda', price: 10, slot: 'alfombra' },
  { id: 'alfombra-arcoiris', name: 'Alfombra arcoíris', price: 24, slot: 'alfombra' },
  { id: 'pelota', name: 'Pelota', price: 6, slot: 'juguete' },
  { id: 'osito', name: 'Osito de peluche', price: 16, slot: 'juguete' },
  { id: 'planta', name: 'Planta', price: 8, slot: 'juguete' },
  { id: 'cohete', name: 'Cohete', price: 26, slot: 'juguete' },
];

export const itemById = (id: string) => ITEMS.find((i) => i.id === id);

/** Equip an item, replacing whatever was in the same slot. */
export function equip(equipped: string[], id: string): string[] {
  const slot = itemById(id)?.slot;
  return [...equipped.filter((e) => itemById(e)?.slot !== slot), id];
}
