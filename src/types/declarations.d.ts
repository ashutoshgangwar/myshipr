/**
 * Ambient module declarations for non-code imports.
 *
 * Metro resolves these at build time — an SVG through
 * `react-native-svg-transformer`, an image through the asset registry, and
 * `@env` through the `react-native-dotenv` Babel plugin. None of those three
 * ships TypeScript declarations, so without this file every `import Icon from
 * './x.svg'` is a TS2307 "cannot find module" even though it runs perfectly.
 *
 * This file is types only. It emits nothing and changes no runtime behaviour.
 */

/**
 * SVGs are compiled into React components by `react-native-svg-transformer`
 * (see `metro.transformer.js`), so they take the same props as any other
 * `react-native-svg` element — `color`, `width`, `height` included, which is
 * exactly how the tab bar and the icon set use them.
 */
declare module '*.svg' {
  import type React from 'react';
  import type {Svg, SvgProps} from 'react-native-svg';

  /**
   * A forwardRef component, not a plain FC: `.svgrrc.js` sets `ref: true`, so
   * every generated icon forwards its ref to the underlying `<Svg>` — which is
   * what lets `destinationMarker` call `toDataURL()` on one.
   */
  const content: React.ForwardRefExoticComponent<
    SvgProps & React.RefAttributes<Svg>
  >;
  export default content;
}

/**
 * Bitmap assets resolve to the opaque handle RN's asset registry hands back.
 * `ImageSourcePropType` is what `<Image source={...} />` accepts, so an
 * imported PNG can be passed straight through with no cast.
 */
declare module '*.png' {
  import type {ImageSourcePropType} from 'react-native';
  const content: ImageSourcePropType;
  export default content;
}

declare module '*.jpg' {
  import type {ImageSourcePropType} from 'react-native';
  const content: ImageSourcePropType;
  export default content;
}

declare module '*.jpeg' {
  import type {ImageSourcePropType} from 'react-native';
  const content: ImageSourcePropType;
  export default content;
}

declare module '*.webp' {
  import type {ImageSourcePropType} from 'react-native';
  const content: ImageSourcePropType;
  export default content;
}

declare module '*.gif' {
  import type {ImageSourcePropType} from 'react-native';
  const content: ImageSourcePropType;
  export default content;
}

/**
 * Environment variables, inlined at build time by `react-native-dotenv`
 * (configured in `babel.config.js` against `.env`).
 *
 * Every key here is present in `.env`, `.env.development` and
 * `.env.production`, so they are declared as `string` rather than
 * `string | undefined` — which is also how the existing code reads them
 * (`(API_BASE_URL || '')`). Adding a NEW key to `.env` means adding it here
 * too, or the import will not type-check.
 */
declare module '@env' {
  export const GOOGLE_MAPS_API_KEY: string;
  export const HERE_API_KEY: string;
  export const HERE_ACCESS_KEY_ID: string;
  export const HERE_ACCESS_KEY_SECRET: string;
  export const APP_NAME: string;
  export const APP_VERSION: string;
  export const APP_ENV: string;
  export const API_BASE_URL: string;
  export const API_TIMEOUT: string;
  export const DEBUG: string;
  export const LOG_LEVEL: string;
  export const APP_LINK_SCHEME: string;
  export const APP_LINK_DOMAIN: string;
  export const APP_LINK_PATH_PREFIX: string;

  /**
   * Optional: the HERE project HRN, only needed when the credentials were
   * issued inside a HERE project. It is deliberately absent from every `.env`
   * file, and `HereSdk.initialize()` already reads it as `scope || null` —
   * so it is typed as possibly-undefined rather than `string`.
   */
  export const HERE_SCOPE: string | undefined;
}

/**
 * React Native's runtime exposes the global object as `global`, the way Node
 * does — but RN 0.83 ships no declaration for it, and neither does the `lib`
 * set the React Native tsconfig selects.
 *
 * Declared here rather than by adding `@types/node`, which would also
 * redeclare the timer functions and change `setTimeout` from returning a
 * `number` to a `NodeJS.Timeout` — breaking every `useRef<number>` that holds
 * a timer handle.
 */
declare var global: typeof globalThis;
