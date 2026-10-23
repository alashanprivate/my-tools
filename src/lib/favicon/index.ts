// favicon 持久缓存与拉取
export {
  FAVICON_SUCCESS_TTL,
  FAVICON_FAILURE_TTL,
  FAVICON_MAX_ENTRIES,
  loadCachedFavicon,
  saveFavicon,
  isFaviconFailure,
  markFaviconFailure,
} from './cache'
export { fetchFaviconDataUrl } from './fetcher'
