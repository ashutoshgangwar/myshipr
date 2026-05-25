const encode = value => encodeURIComponent(String(value)).replace(/%20/g, '+');

class URLSearchParamsPolyfill {
  constructor(initialValue) {
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

  append(key, value) {
    this._pairs.push([String(key), String(value)]);
  }

  set(key, value) {
    const stringKey = String(key);
    const stringValue = String(value);
    this._pairs = this._pairs.filter(([existingKey]) => existingKey !== stringKey);
    this._pairs.push([stringKey, stringValue]);
  }

  get(key) {
    const match = this._pairs.find(([existingKey]) => existingKey === String(key));
    return match ? match[1] : null;
  }

  toString() {
    return this._pairs.map(([key, value]) => `${encode(key)}=${encode(value)}`).join('&');
  }
}

export const ensureURLSearchParamsPolyfill = () => {
  if (
    typeof global.URLSearchParams === 'undefined' ||
    typeof global.URLSearchParams.prototype?.set !== 'function'
  ) {
    global.URLSearchParams = URLSearchParamsPolyfill;
  }
};

export default URLSearchParamsPolyfill;
