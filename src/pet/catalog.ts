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
  { id: 'lazo-rosa', name: 'Lazo rosa', price: 65, slot: 'cabeza' },
  { id: 'gorro-lana', name: 'Gorro de lana', price: 115, slot: 'cabeza' },
  { id: 'corona', name: 'Corona', price: 345, slot: 'cabeza' },
  { id: 'sombrero', name: 'Sombrero', price: 175, slot: 'cabeza' },
  { id: 'flores', name: 'Corona de flores', price: 225, slot: 'cabeza' },
  { id: 'gorra', name: 'Gorra', price: 130, slot: 'cabeza' },
  { id: 'pajarita', name: 'Pajarita', price: 85, slot: 'cuello' },
  { id: 'bufanda', name: 'Bufanda', price: 140, slot: 'cuello' },
  { id: 'collar', name: 'Collar de perlas', price: 260, slot: 'cuello' },
  { id: 'cascabel', name: 'Cascabel', price: 55, slot: 'cuello' },
  { id: 'gafas', name: 'Gafas redondas', price: 105, slot: 'cara' },
  { id: 'gafas-sol', name: 'Gafas de sol', price: 155, slot: 'cara' },
  { id: 'gafas-corazon', name: 'Gafas de corazón', price: 195, slot: 'cara' },
  { id: 'cojin', name: 'Cojín', price: 110, slot: 'cama' },
  { id: 'cama-nube', name: 'Cama nube', price: 320, slot: 'cama' },
  { id: 'pared-estrellas', name: 'Pared de estrellas', price: 165, slot: 'pared' },
  { id: 'pared-rayas', name: 'Pared de rayas', price: 125, slot: 'pared' },
  { id: 'pared-corazones', name: 'Pared de corazones', price: 185, slot: 'pared' },
  { id: 'alfombra-redonda', name: 'Alfombra redonda', price: 95, slot: 'alfombra' },
  { id: 'alfombra-arcoiris', name: 'Alfombra arcoíris', price: 275, slot: 'alfombra' },
  { id: 'pelota', name: 'Pelota', price: 45, slot: 'juguete' },
  { id: 'osito', name: 'Osito de peluche', price: 180, slot: 'juguete' },
  { id: 'planta', name: 'Planta', price: 70, slot: 'juguete' },
  { id: 'cohete', name: 'Cohete', price: 295, slot: 'juguete' },
];

export const itemById = (id: string) => ITEMS.find((i) => i.id === id);

/** Equip an item, replacing whatever was in the same slot. */
export function equip(equipped: string[], id: string): string[] {
  const slot = itemById(id)?.slot;
  return [...equipped.filter((e) => itemById(e)?.slot !== slot), id];
}
