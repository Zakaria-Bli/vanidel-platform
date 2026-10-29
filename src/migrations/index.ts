import * as migration_20261009_234604_initial from './20261009_234604_initial';
import * as migration_20261011_145932_i18n_localization from './20261011_145932_i18n_localization';
import * as migration_20261012_070755_roles from './20261012_070755_roles';
import * as migration_20261012_072037_contests_media_settings from './20261012_072037_contests_media_settings';
import * as migration_20261012_072855_participation_schema from './20261012_072855_participation_schema';
import * as migration_20261012_073545_storage_prefix from './20261012_073545_storage_prefix';
import * as migration_20261012_124811_role_default from './20261012_124811_role_default';
import * as migration_20261012_171830_participation_steps from './20261012_171830_participation_steps';
import * as migration_20261013_092146_ticket_thumbnails from './20261013_092146_ticket_thumbnails';
import * as migration_20261014_110120_campaign_links from './20261014_110120_campaign_links';
import * as migration_20261017_213841_contest_day_dates_consent_versions from './20261017_213841_contest_day_dates_consent_versions';
import * as migration_20261018_054253_draw_winners_review from './20261018_054253_draw_winners_review';
import * as migration_20261018_232017_draw_pool_scope from './20261018_232017_draw_pool_scope';
import * as migration_20261024_170449_add_localized_parent_indexes from './20261024_170449_add_localized_parent_indexes';
import * as migration_20261029_100610_participation_trash from './20261029_100610_participation_trash';

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
    name: '20261012_073545_storage_prefix',
  },
  {
    up: migration_20261012_124811_role_default.up,
    down: migration_20261012_124811_role_default.down,
    name: '20261012_124811_role_default',
  },
  {
    up: migration_20261012_171830_participation_steps.up,
    down: migration_20261012_171830_participation_steps.down,
    name: '20261012_171830_participation_steps',
  },
  {
    up: migration_20261013_092146_ticket_thumbnails.up,
    down: migration_20261013_092146_ticket_thumbnails.down,
    name: '20261013_092146_ticket_thumbnails',
  },
  {
    up: migration_20261014_110120_campaign_links.up,
    down: migration_20261014_110120_campaign_links.down,
    name: '20261014_110120_campaign_links',
  },
  {
    up: migration_20261017_213841_contest_day_dates_consent_versions.up,
    down: migration_20261017_213841_contest_day_dates_consent_versions.down,
    name: '20261017_213841_contest_day_dates_consent_versions',
  },
  {
    up: migration_20261018_054253_draw_winners_review.up,
    down: migration_20261018_054253_draw_winners_review.down,
    name: '20261018_054253_draw_winners_review',
  },
  {
    up: migration_20261018_232017_draw_pool_scope.up,
    down: migration_20261018_232017_draw_pool_scope.down,
    name: '20261018_232017_draw_pool_scope',
  },
  {
    up: migration_20261024_170449_add_localized_parent_indexes.up,
    down: migration_20261024_170449_add_localized_parent_indexes.down,
    name: '20261024_170449_add_localized_parent_indexes',
  },
  {
    up: migration_20261029_100610_participation_trash.up,
    down: migration_20261029_100610_participation_trash.down,
    name: '20261029_100610_participation_trash'
  },
];
