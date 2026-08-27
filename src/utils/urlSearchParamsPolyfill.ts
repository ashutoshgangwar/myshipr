const encode = (value: string | number | boolean): string =>
  encodeURIComponent(String(value)).replace(/%20/g, '+');

/** What the constructor accepts: a query string, or a plain object of pairs. */
type URLSearchParamsInit = string | Record<string, unknown> | null | undefined;

class URLSearchParamsPolyfill {
  private _pairs: Array<[string, string]>;

  constructor(initialValue?: URLSearchParamsInit) {
    this._pairs = [];

    if (!initialValue) {
      return;
    }

    if (typeof initialValue === 'string') {
      initialValue
        .replace(/^\?/, '')
        .split('&')
        .filter(Boolean)
        .forEach(part => {
          const [rawKey, rawValue = ''] = part.split('=');
          this.append(decodeURIComponent(rawKey), decodeURIComponent(rawValue));
        });
      return;
    }

    Object.entries(initialValue).forEach(([key, value]) => {
      this.append(key, value);
    });
  }

  append(key: unknown, value: unknown): void {
    this._pairs.push([String(key), String(value)]);
  }

  set(key: unknown, value: unknown): void {
    const stringKey = String(key);
    const stringValue = String(value);
    this._pairs = this._pairs.filter(([existingKey]) => existingKey !== stringKey);
    this._pairs.push([stringKey, stringValue]);
  }

  get(key: unknown): string | null {
    const match = this._pairs.find(([existingKey]) => existingKey === String(key));
    return match ? match[1] : null;
  }

  toString(): string {
    return this._pairs.map(([key, value]) => `${encode(key)}=${encode(value)}`).join('&');
  }
}

export const ensureURLSearchParamsPolyfill = (): void => {
  // The `set` probe is cast because the ambient `URLSearchParams` type in
  // scope genuinely declares no `set` member — which is the very gap this
  // polyfill exists to close. Testing for a method the platform may not have
  // is the point of the check, so the cast asks the question at runtime
  // without the type system pre-judging the answer.
  const existing = global.URLSearchParams as
    | (typeof global.URLSearchParams & {prototype?: {set?: unknown}})
    | undefined;

  if (
    typeof existing === 'undefined' ||
    typeof existing.prototype?.set !== 'function'
  ) {
    // This class implements the four members the app uses — append/set/get/
    // toString — not the full WHATWG interface (no getAll, delete, forEach,
    // sort, or the iterators). Installing a deliberately partial polyfill is
    // the existing behaviour, so the assignment is cast rather than the class
    // being grown to satisfy a contract nothing here calls.
    global.URLSearchParams =
      URLSearchParamsPolyfill as unknown as typeof global.URLSearchParams;
  }
};

export default URLSearchParamsPolyfill;
