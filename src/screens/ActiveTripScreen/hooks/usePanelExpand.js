import {useState, useCallback, useEffect, useRef} from 'react';
import styles from '../ActiveTripScreen.styles';

/**
 * Adds the header stretch (⤢) toggle to a PanelShell: collapsed the panel keeps
 * its own docked wrap style, expanded it fills the screen.
 *
 * Spread `shellProps` onto <PanelShell> and use `expanded` to grow the body,
 * which is fixed-height while docked.
 *
 * `onExpandedChange` lets the screen follow along — it's how the status bar
 * knows to switch to light icons once a navy panel header covers it. It also
 * fires with `false` when the panel unmounts while stretched.
 */
export default function usePanelExpand(collapsedWrapStyle, onExpandedChange) {
  const [expanded, setExpanded] = useState(false);
  const toggleExpand = useCallback(() => setExpanded(prev => !prev), []);

  // Held in a ref so an inline callback doesn't re-fire the effect every render.
  const changeRef = useRef(onExpandedChange);
  changeRef.current = onExpandedChange;

  useEffect(() => {
    changeRef.current?.(expanded);
    return () => {
      if (expanded) {
        changeRef.current?.(false);
      }
    };
  }, [expanded]);

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
