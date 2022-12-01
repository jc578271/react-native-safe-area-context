import * as React from 'react';
import { Dimensions, StyleSheet, ViewProps } from 'react-native';
import { NativeSafeAreaProvider } from './NativeSafeAreaProvider';
import type {
  AEdgeInsets,
  EdgeInsets,
  InsetChangedEvent,
  Metrics,
  Rect,
} from './SafeArea.types';
import {useAnimatedReaction, useDerivedValue, useSharedValue, runOnJS} from "react-native-reanimated";
import {useMemo, useState} from "react";

const isDev = process.env.NODE_ENV !== 'production';

export const SafeAreaInsetsContext = React.createContext<AEdgeInsets | null>(
  null,
);
if (isDev) {
  SafeAreaInsetsContext.displayName = 'SafeAreaInsetsContext';
}

export const SafeAreaFrameContext = React.createContext<Rect | null>(null);
if (isDev) {
  SafeAreaFrameContext.displayName = 'SafeAreaFrameContext';
}

export interface SafeAreaProviderProps extends ViewProps {
  children?: React.ReactNode;
  initialMetrics?: Metrics | null;
  /**
   * @deprecated
   */
  initialSafeAreaInsets?: EdgeInsets | null;
}

export function SafeAreaProvider({
 children,
 initialMetrics,
 initialSafeAreaInsets,
 style,
 ...others
}: SafeAreaProviderProps) {
  const insets = useSharedValue<EdgeInsets | null>(
    initialMetrics?.insets ?? initialSafeAreaInsets ?? null,
  );

  const frame = React.useMemo<Rect>(() =>
    initialMetrics?.frame ??
    {
      // Backwards compat so we render anyway if we don't have frame.
      x: 0,
      y: 0,
      width: Dimensions.get('window').width,
      height: Dimensions.get('window').height,
    },[]
  );
  const onInsetsChange = React.useCallback(
    (event: InsetChangedEvent) => {
      const {
        nativeEvent: { insets: nextInsets },
      } = event;
      insets.value = nextInsets
    },
    [insets],
  );

  const aTop = useDerivedValue(() => insets.value ? insets.value.top : 0, [insets])
  const aBottom = useDerivedValue(() => insets.value ? insets.value.bottom : 0, [insets])
  const aLeft = useDerivedValue(() => insets.value ? insets.value.left : 0, [insets])
  const aRight = useDerivedValue(() => insets.value ? insets.value.right : 0, [insets])


  const aInset = useMemo(() => ({
    aTop,
    aBottom,
    aLeft,
    aRight
  }), [
    aTop,
    aBottom,
    aLeft,
    aRight
  ]);

  return (
    <NativeSafeAreaProvider
      style={[styles.fill, style]}
      onInsetsChange={onInsetsChange}
      {...others}
    >
      {insets != null ? (
        <SafeAreaFrameContext.Provider value={frame}>
          <SafeAreaInsetsContext.Provider value={aInset}>
            {children}
          </SafeAreaInsetsContext.Provider>
        </SafeAreaFrameContext.Provider>
      ) : null}
    </NativeSafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});

function useParentSafeAreaInsets() {
  return React.useContext(SafeAreaInsetsContext);
}

function useParentSafeAreaFrame(): Rect | null {
  return React.useContext(SafeAreaFrameContext);
}

const NO_INSETS_ERROR =
  'No safe area value available. Make sure you are rendering `<SafeAreaProvider>` at the top of your app.';

export function useAnimatedSafeAreaInsets() {
  const safeArea = React.useContext(SafeAreaInsetsContext);
  if (safeArea == null) {
    throw new Error(NO_INSETS_ERROR);
  }

  return safeArea;
}

export function useSafeAreaInsets() {
  const safeArea = React.useContext(SafeAreaInsetsContext);
  if (safeArea == null) {
    throw new Error(NO_INSETS_ERROR);
  }

  const animatedValue = useDerivedValue(() => ({
    top: safeArea.aTop.value,
    bottom: safeArea.aBottom.value,
    left: safeArea.aLeft.value,
    right: safeArea.aRight.value,
  }))

  const [value, setValue] = useState(animatedValue.value)
  useAnimatedReaction(() => animatedValue.value, (cur, prev) => {
    if (JSON.stringify(cur) !== JSON.stringify(prev)) {
      runOnJS(setValue)(cur)
    }
  }, [])

  return value;
}

export function useSafeAreaFrame(): Rect {
  const frame = React.useContext(SafeAreaFrameContext);
  if (frame == null) {
    throw new Error(NO_INSETS_ERROR);
  }
  return frame;
}

export type WithSafeAreaInsetsProps = {
  insets: EdgeInsets;
};

/**
 * @deprecated
 */
export function useSafeArea() {
  return useSafeAreaInsets();
}

/**
 * @deprecated
 */
export const SafeAreaConsumer = SafeAreaInsetsContext.Consumer;

/**
 * @deprecated
 */
export const SafeAreaContext = SafeAreaInsetsContext;
