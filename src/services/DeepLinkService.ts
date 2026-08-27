import {Linking} from 'react-native';
import {
  APP_LINK_SCHEME,
  APP_LINK_DOMAIN,
  APP_LINK_PATH_PREFIX,
  DEBUG,
} from '@env';

/** A link's query string, decoded. */
type LinkQuery = Record<string, string>;

/** A URL split into its parts, or null when it could not be parsed. */
interface ParsedUrl {
  scheme: string;
  host: string;
  segments: string[];
  query: LinkQuery;
}

/** Where a resolved link sends the driver. */
export interface DeepLinkTarget {
  screen: string;
  params: Record<string, string | undefined>;
}

/** A resolved link, plus the action and the URL it came from. */
export interface ResolvedDeepLink extends DeepLinkTarget {
  action: string;
  url: string;
}


const DEBUG_ENABLED = String(DEBUG).toLowerCase() === 'true';
const log = (...args: unknown[]): void => {
  if (DEBUG_ENABLED) console.log('[DeepLink]', ...args);
};

const SCHEME = (APP_LINK_SCHEME || 'myshipr').toLowerCase();

// Comma-separated so a domain migration can accept old and new at once.
const ALLOWED_HOSTS = (APP_LINK_DOMAIN || '')
  .split(',')
  .map(host => host.trim().toLowerCase())
  .filter(Boolean);

// '/d' → ['d']. These segments are routing scaffolding, not part of the action.
const PREFIX_SEGMENTS = (APP_LINK_PATH_PREFIX || '')
  .split('/')
  .filter(Boolean)
  .map(segment => segment.toLowerCase());

// scheme://host/path?query — the shape every OS-delivered link takes.
const AUTHORITY_URL = /^([a-z][a-z0-9+.-]*):\/\/([^/?#]*)([^?#]*)(?:\?([^#]*))?/i;
// scheme:path?query — some mail clients rewrite `myshipr://x` to `myshipr:x`.
const OPAQUE_URL = /^([a-z][a-z0-9+.-]*):([^/?#][^?#]*)?(?:\?([^#]*))?/i;

const decode = (value: unknown): string => {
  try {
    return decodeURIComponent(String(value).replace(/\+/g, ' '));
  } catch {
    // A stray '%' that is not a valid escape — keep the raw text rather than
    // throwing the whole link away.
    return String(value);
  }
};

// Split first, then decode: decoding first would turn an encoded %2F inside a
// segment into a separator and invent a path level that was never there.
const splitPath = (path: string | undefined): string[] =>
  (path || '')
    .split('/')
    .filter(Boolean)
    .map(decode);

const parseQuery = (queryString: string | undefined): LinkQuery => {
  const params: LinkQuery = {};
  (queryString || '').split('&').forEach(pair => {
    if (!pair) return;
    const separator = pair.indexOf('=');
    const key = separator === -1 ? pair : pair.slice(0, separator);
    const value = separator === -1 ? '' : pair.slice(separator + 1);
    if (key) params[decode(key)] = decode(value);
  });
  return params;
};

/** Splits a URL into `{scheme, host, segments, query}` — or null if unparsable. */
const parseUrl = (url: unknown): ParsedUrl | null => {
  const raw = String(url || '').trim();
  if (!raw) return null;

  const withAuthority = AUTHORITY_URL.exec(raw);
  if (withAuthority) {
    const [, scheme, host, path, query] = withAuthority;
    return {
      scheme: scheme.toLowerCase(),
      host: (host || '').toLowerCase(),
      segments: splitPath(path),
      query: parseQuery(query),
    };
  }

  const opaque = OPAQUE_URL.exec(raw);
  if (opaque) {
    const [, scheme, path, query] = opaque;
    return {
      scheme: scheme.toLowerCase(),
      host: '',
      segments: splitPath(path),
      query: parseQuery(query),
    };
  }

  return null;
};

const ROUTES = {
  // Driver was created on the web portal and has no password yet.
  activate: (token: string, query: LinkQuery): DeepLinkTarget => ({
    screen: 'ResetPassword',
    params: {token, email: query.email},
  }),
};

// Aliases, so the backend/email team is not locked into one spelling.
const ACTION_ALIASES: Record<string, string> = {
  activate: 'activate',
  invite: 'activate',
  onboarding: 'activate',
  'set-password': 'activate',
  setpassword: 'activate',
};

/**
 * @param url the URL the OS handed us
 * @returns null when the URL is not ours, is malformed, or carries no token
 */
export const resolveDeepLink = (url: unknown): ResolvedDeepLink | null => {
  const parsed = parseUrl(url);
  if (!parsed) {
    log('unparsable url', url);
    return null;
  }

  const {scheme, host, query} = parsed;
  let segments = parsed.segments;

  if (scheme === 'http' || scheme === 'https') {
    // Reject any host we do not own. With APP_LINK_DOMAIN unset we would have
    // no way to tell ours apart, so refuse rather than trust it.
    if (!ALLOWED_HOSTS.length || !ALLOWED_HOSTS.includes(host)) {
      log('rejected host', host);
      return null;
    }
  } else if (scheme === SCHEME) {
    // `myshipr://activate?token=…` parses the action as the *host*, so put it
    // back at the front of the path before matching.
    if (host) segments = [host, ...segments];
  } else {
    log('unknown scheme', scheme);
    return null;
  }

  // Drop the '/d' scaffolding when it is there; a custom-scheme link may omit it.
  while (
    segments.length &&
    PREFIX_SEGMENTS.includes(segments[0].toLowerCase())
  ) {
    segments = segments.slice(1);
  }

  const action = ACTION_ALIASES[(segments[0] || '').toLowerCase()];
  const build = action && ROUTES[action as keyof typeof ROUTES];
  if (!build) {
    log('no route for', segments[0]);
    return null;
  }

  // Token may ride in the query (?token=…) or as a path segment (/activate/…).
  const token = query.token || query.t || segments[1];
  if (!token) {
    log('link carries no token', url);
    return null;
  }

  const target = build(token, query);
  log('resolved', {action, screen: target.screen});
  return {...target, action, url: String(url)};
};

/** Builds an app-scheme link — used by the docs, tests and manual QA. */
export const buildDeepLink = (action: string, token: string): string =>
  `${SCHEME}://${action}?token=${encodeURIComponent(token)}`;

// --- Cold start ----------------------------------------------------------

// getInitialURL() must be read exactly once and shared: the splash screen and
// App both need the answer, and whoever asked second would otherwise get null.
let initialLinkPromise: Promise<ResolvedDeepLink | null> | null = null;
let initialLinkTaken = false;

/** The link the app was launched from, or null. Safe to call repeatedly. */
export const getInitialDeepLink = () => {
  if (!initialLinkPromise) {
    initialLinkPromise = Linking.getInitialURL()
      .then(url => {
        console.log('[DeepLink] launch url:', url || '(none)');
        return url ? resolveDeepLink(url) : null;
      })
      .catch(err => {
        log('getInitialURL failed', err?.message);
        return null;
      });
  }
  return initialLinkPromise;
};

/**
 * The launch link, until someone says they have acted on it.
 *
 * Deliberately NOT consume-on-read. iOS exposes the launch URL only through
 * getInitialURL(), and it is gone for good once we drop it — there is no
 * intent to re-read the way Android has. So a caller that reads the link and
 * then cannot navigate (its screen unmounted while the read was in flight)
 * must leave it for the next caller rather than burn it.
 */
export const peekInitialDeepLink = async () => {
  const link = await getInitialDeepLink();
  return initialLinkTaken ? null : link;
};

/** Called once the launch link has actually been navigated to. */
export const markInitialDeepLinkHandled = () => {
  initialLinkTaken = true;
};

// --- Warm links ----------------------------------------------------------

/**
 * Subscribes to links that arrive while the app is already running (tapped
 * from the mail app with MyShipr in the background). The cold-start link is
 * deliberately NOT delivered here — see peekInitialDeepLink.
 *
 * @returns unsubscribe
 */
export const initDeepLinks = (
  onLink: (link: ResolvedDeepLink) => void,
): (() => void) => {
  const subscription = Linking.addEventListener('url', ({url}) => {
    // Deliberately not behind DEBUG. This one line is the difference between
    // "the OS never handed us the link" and "we got it and ignored it", which
    // is the first thing worth knowing when a link appears to do nothing.
    console.log('[DeepLink] url event:', url);
    const link = resolveDeepLink(url);
    if (link) onLink(link);
  });
  return () => subscription.remove();
};
