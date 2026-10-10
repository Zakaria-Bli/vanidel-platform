import * as migration_20261009_234604_initial from './20261009_234604_initial';

export const migrations = [
  {
    up: migration_20261009_234604_initial.up,
    down: migration_20261009_234604_initial.down,
    name: '20261009_234604_initial'
  },
];
