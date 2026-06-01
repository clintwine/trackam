/**
 * System endpoints — version checks, health, etc.
 *
 * The version endpoint compares the deployed commit (set at build time
 * via GIT_COMMIT or auto-detected from common host envs) against the
 * latest commit on Trackam's GitHub main branch. Results are cached in
 * memory for VERSION_CACHE_TTL_MS so the public GitHub API rate limit
 * (60 req/hour unauthenticated) is never close to being hit.
 */

const express = require("express");
const router  = express.Router();
const asyncHandler = require("../../core/middlewares/asyncHandler");
const localAuth    = require("../../core/middlewares/localAuth");

const REPO_OWNER = process.env.TRACKAM_REPO_OWNER || "Jeffreyon";
const REPO_NAME  = process.env.TRACKAM_REPO_NAME  || "trackam";
const REPO_BRANCH = process.env.TRACKAM_REPO_BRANCH || "main";

// Try multiple env conventions so this works on Railway/Render/Fly/Heroku/local-Docker
const CURRENT_COMMIT_FULL =
  process.env.GIT_COMMIT ||
  process.env.RAILWAY_GIT_COMMIT_SHA ||
  process.env.RENDER_GIT_COMMIT ||
  process.env.SOURCE_COMMIT ||
  process.env.HEROKU_SLUG_COMMIT ||
  null;

const VERSION_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
let _versionCache = { value: null, fetchedAt: 0 };

async function fetchLatestFromGitHub() {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits/${REPO_BRANCH}`;
  const res = await fetch(url, {
    headers: {
      "Accept": "application/vnd.github+json",
      "User-Agent": "trackam-version-check",
      // Authenticated requests get 5000/hr instead of 60. Optional.
      ...(process.env.GITHUB_TOKEN ? { "Authorization": `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub responded ${res.status}`);
  }
  const data = await res.json();
  return {
    sha:     data.sha,
    message: (data.commit?.message || "").split("\n")[0], // first line only
    author:  data.commit?.author?.name || null,
    date:    data.commit?.author?.date || null,
  };
}

router.use(localAuth);

// GET /api/system/version
// Returns the deployed commit vs the latest commit on the configured repo branch.
router.get("/version", asyncHandler(async (req, res) => {
  const now = Date.now();
  let latest = _versionCache.value;
  let cacheStatus = "hit";

  if (!latest || now - _versionCache.fetchedAt > VERSION_CACHE_TTL_MS) {
    try {
      latest = await fetchLatestFromGitHub();
      _versionCache = { value: latest, fetchedAt: now };
      cacheStatus = "refreshed";
    } catch (err) {
      console.warn(`[system.version] GitHub lookup failed:`, err.message);
      cacheStatus = "stale";
      // Fall through with whatever we had cached (may be null)
    }
  }

  if (!latest) {
    return res.json({
      current:         CURRENT_COMMIT_FULL ? CURRENT_COMMIT_FULL.slice(0, 7) : null,
      currentFull:     CURRENT_COMMIT_FULL,
      latest:          null,
      latestFull:      null,
      latestMessage:   null,
      latestDate:      null,
      updateAvailable: false,
      compareUrl:      null,
      checkedAt:       new Date(now).toISOString(),
      status:          "unreachable", // GitHub couldn't be contacted, no cached value
    });
  }

  const updateAvailable = Boolean(
    CURRENT_COMMIT_FULL && latest.sha && CURRENT_COMMIT_FULL !== latest.sha
  );

  res.json({
    current:         CURRENT_COMMIT_FULL ? CURRENT_COMMIT_FULL.slice(0, 7) : null,
    currentFull:     CURRENT_COMMIT_FULL,
    latest:          latest.sha.slice(0, 7),
    latestFull:      latest.sha,
    latestMessage:   latest.message,
    latestAuthor:    latest.author,
    latestDate:      latest.date,
    updateAvailable,
    compareUrl: CURRENT_COMMIT_FULL
      ? `https://github.com/${REPO_OWNER}/${REPO_NAME}/compare/${CURRENT_COMMIT_FULL}...${latest.sha}`
      : `https://github.com/${REPO_OWNER}/${REPO_NAME}/commit/${latest.sha}`,
    repoUrl: `https://github.com/${REPO_OWNER}/${REPO_NAME}`,
    branch: REPO_BRANCH,
    checkedAt: new Date(_versionCache.fetchedAt || now).toISOString(),
    status: CURRENT_COMMIT_FULL ? "ok" : "no-current-commit",
    cache: cacheStatus,
  });
}));

module.exports = router;
