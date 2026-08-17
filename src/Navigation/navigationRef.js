import {createNavigationContainerRef} from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

/** Replaces the whole stack with `name`, so Back cannot return to it. */
export const resetTo = (name, params) => {
  if (navigationRef.isReady()) {
    navigationRef.reset({index: 0, routes: [{name, params}]});
  }
};

/** Pushes `name` onto the stack from outside a navigator (services, modals). */
export const navigate = (name, params) => {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
};

/** Name of the route currently on screen, or undefined before mount. */
export const getCurrentRouteName = () =>
  navigationRef.isReady() ? navigationRef.getCurrentRoute()?.name : undefined;
