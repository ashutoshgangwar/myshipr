import {createNavigationContainerRef} from '@react-navigation/native';

import type {RootStackParamList} from '../types/navigation';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/** Replaces the whole stack with `name`, so Back cannot return to it. */
export const resetTo = <T extends keyof RootStackParamList>(
  name: T,
  params?: RootStackParamList[T],
): void => {
  if (navigationRef.isReady()) {
    navigationRef.reset({index: 0, routes: [{name, params}]});
  }
};

/** Pushes `name` onto the stack from outside a navigator (services, modals). */
export const navigate = <T extends keyof RootStackParamList>(
  name: T,
  params?: RootStackParamList[T],
): void => {
  if (navigationRef.isReady()) {
    // The name/params pair is correct by construction, but React Navigation's
    // overloads cannot express "this name together with its own params" behind
    // a generic, so the call is routed through the untyped form.
    (
      navigationRef.navigate as unknown as (
        n: T,
        p?: RootStackParamList[T],
      ) => void
    )(name, params);
  }
};

/** Name of the route currently on screen, or undefined before mount. */
export const getCurrentRouteName = (): string | undefined =>
  navigationRef.isReady() ? navigationRef.getCurrentRoute()?.name : undefined;
