// /js/pages/home.js
import { initSubtitleClock } from "../features/subtitle-clock.js";
import { initSearchBar } from "../features/searchbar.js";
import { initLinksGrid } from "../features/links-grid.js";
import { initChecklist } from "../features/checklist.js";
import { initWeather } from "../features/weather.js";

(async function init() {
  initSubtitleClock();
  initSearchBar();
  await initLinksGrid();
  initChecklist();
  initWeather();
})();