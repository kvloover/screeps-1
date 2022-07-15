export type creepAction = energyAction | nonEnergyAction;
export type energyAction =  workAction | 'withdraw' | 'transfer' ;
export type nonEnergyAction = 'claim' | 'attack' | 'rangedAttack' | 'heal' | 'rangedHeal' | 'rangedMassAttack';
export type workAction = 'harvest' | 'build' | 'repair' | 'upgrade';

export const CREEP_RANGE = new Map<creepAction, number>([
    ['build', 3],
    ['repair', 3],
    ['upgrade', 3],
    ['attack', 1],
    ['claim', 1],
    ['harvest', 1],
    ['withdraw', 1],
    ['transfer', 1],
    ['rangedAttack', 3],
    ['rangedHeal', 3],
    ['rangedMassAttack', 3],
    ['heal', 1]
]);

export const CREEP_AMOUNT_PER_ENERGY = new Map<energyAction, number>([
    ['harvest', 1],
    ['withdraw', 1],
    ['transfer', 1],
    ['build', 1],
    ['upgrade', 1],
    ['repair', 100],
]);

export const CREEP_ENERGY_PER_PART = new Map<workAction, number>([
    ['harvest', 2],
    ['build', 5],
    ['repair', 1],
    ['upgrade', 1],
]);
