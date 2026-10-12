import * as migration_20261009_234604_initial from './20261009_234604_initial';
import * as migration_20261011_145932_i18n_localization from './20261011_145932_i18n_localization';

export const migrations = [
  {
    up: migration_20261009_234604_initial.up,
    down: migration_20261009_234604_initial.down,
    name: '20261009_234604_initial',
  },
  {
    up: migration_20261011_145932_i18n_localization.up,
    down: migration_20261011_145932_i18n_localization.down,
    name: '20261011_145932_i18n_localization'
  },
];
