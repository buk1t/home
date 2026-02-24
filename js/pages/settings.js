// /js/pages/settings.js
import { initSettingsSearch } from "../features/settings-search.js";
import { initSettingsCity } from "../features/settings-city.js";
import { initSettingsLinks } from "../features/settings-links.js";
import { initSettingsArchive } from "../features/settings-archive.js";
import { initSettingsImport } from "../features/settings-import.js";

(function init() {
  initSettingsSearch();
  initSettingsCity();
  initSettingsLinks();
  initSettingsArchive();
  initSettingsImport();
})();