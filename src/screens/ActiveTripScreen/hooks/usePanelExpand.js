import {useState, useCallback} from 'react';
import styles from '../ActiveTripScreen.styles';

export default function usePanelExpand(collapsedWrapStyle) {
  const [expanded, setExpanded] = useState(false);
  const toggleExpand = useCallback(() => setExpanded(prev => !prev), []);

  return {
    expanded,
    toggleExpand,
    shellProps: {
      onExpand: toggleExpand,
      fullscreen: expanded,
      wrapStyle: expanded ? styles.panelWrapFullscreen : collapsedWrapStyle,
      panelStyle: expanded ? styles.panelFullscreen : null,
    },
  };
}
