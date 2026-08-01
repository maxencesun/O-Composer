import assert from "node:assert/strict";
import {
  USER_GUIDE_URL,
  USER_GUIDE_URLS,
  userGuideUrlForLanguage
} from "../src/ui/app-shell-config.js";

assert.match(USER_GUIDE_URLS.en, /^\.\/USER_GUIDE\.en\.md\?guide=/);
assert.match(USER_GUIDE_URLS.zh, /^\.\/USER_GUIDE\.md\?guide=/);
assert.equal(USER_GUIDE_URL, USER_GUIDE_URLS.zh, "the legacy URL should remain the Chinese guide URL");
assert.equal(userGuideUrlForLanguage("en"), USER_GUIDE_URLS.en);
assert.equal(userGuideUrlForLanguage("zh"), USER_GUIDE_URLS.zh);
assert.equal(userGuideUrlForLanguage("unknown"), USER_GUIDE_URLS.en, "unsupported languages should fall back to English");

console.log("user guide language smoke test passed");
