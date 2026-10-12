import * as migration_20261009_234604_initial from './20261009_234604_initial';
import * as migration_20261011_145932_i18n_localization from './20261011_145932_i18n_localization';
import * as migration_20261012_070755_roles from './20261012_070755_roles';
import * as migration_20261012_072037_contests_media_settings from './20261012_072037_contests_media_settings';
import * as migration_20261012_072855_participation_schema from './20261012_072855_participation_schema';
import * as migration_20261012_073545_storage_prefix from './20261012_073545_storage_prefix';

export const migrations = [
  {
    up: migration_20261009_234604_initial.up,
    down: migration_20261009_234604_initial.down,
    name: '20261009_234604_initial',
  },
  {
    up: migration_20261011_145932_i18n_localization.up,
    down: migration_20261011_145932_i18n_localization.down,
    name: '20261011_145932_i18n_localization',
  },
  {
    up: migration_20261012_070755_roles.up,
    down: migration_20261012_070755_roles.down,
    name: '20261012_070755_roles',
  },
  {
    up: migration_20261012_072037_contests_media_settings.up,
    down: migration_20261012_072037_contests_media_settings.down,
    name: '20261012_072037_contests_media_settings',
  },
  {
    up: migration_20261012_072855_participation_schema.up,
    down: migration_20261012_072855_participation_schema.down,
    name: '20261012_072855_participation_schema',
  },
  {
    up: migration_20261012_073545_storage_prefix.up,
    down: migration_20261012_073545_storage_prefix.down,
    name: '20261012_073545_storage_prefix'
  },
];
