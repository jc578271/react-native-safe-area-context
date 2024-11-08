import * as React from 'react';
import { Dimensions, StyleSheet, type ViewProps } from 'react-native';
import { NativeSafeAreaProvider } from './NativeSafeAreaProvider';
import type {
  AEdgeInsets,
  ARect,
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

export const SafeAreaFrameContext = React.createContext<ARect | null>(null);
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
  onInsetsChange?: (insets: EdgeInsets) => void;
}

export function SafeAreaProvider({
  children,
  initialMetrics,
  initialSafeAreaInsets,
  onInsetsChange,
  style,
  ...others
}: SafeAreaProviderProps) {
  // const parentInsets = useParentSafeAreaInsets();
  // const parentFrame = useParentSafeAreaFrame();
  const insets = useSharedValue<EdgeInsets | null>(
    initialMetrics?.insets ?? initialSafeAreaInsets ?? null,
  );
  const frame = useSharedValue<Rect>(
    initialMetrics?.frame ??
      {
        // Backwards compat so we render anyway if we don't have frame.
        x: 0,
        y: 0,
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
      },
  );
  const _onInsetsChange = React.useCallback((event: InsetChangedEvent) => {
    const {
      nativeEvent: { frame: nextFrame, insets: nextInsets },
    } = event;

      if (
        // Backwards compat with old native code that won't send frame.
        nextFrame &&
        (nextFrame.height !== frame.value.height ||
          nextFrame.width !== frame.value.width ||
          nextFrame.x !== frame.value.x ||
          nextFrame.y !== frame.value.y)
      ) {
        frame.value = nextFrame;
      }

      if (
        !insets.value ||
        nextInsets.bottom !== insets.value.bottom ||
        nextInsets.left !== insets.value.left ||
        nextInsets.right !== insets.value.right ||
        nextInsets.top !== insets.value.top
      ) {
        insets.value = nextInsets;
        onInsetsChange?.(nextInsets);
      }
  }, [onInsetsChange]);

  const aTop = useDerivedValue(() => insets.value ? insets.value.top : 0)
  const aBottom = useDerivedValue(() => insets.value ? insets.value.bottom : 0)
  const aLeft = useDerivedValue(() => insets.value ? insets.value.left : 0)
  const aRight = useDerivedValue(() => insets.value ? insets.value.right : 0)

  const aX = useDerivedValue(() => frame.value ? frame.value.x : 0)
  const aY = useDerivedValue(() => frame.value ? frame.value.y : 0)
  const aWidth = useDerivedValue(() => frame.value ? frame.value.width : 0)
  const aHeight = useDerivedValue(() => frame.value ? frame.value.height : 0)

  const aInset = useMemo(() => ({
    aTop,
    aBottom,
    aLeft,
    aRight
  }), []);

  const aFrame = useMemo(() => ({
    aX,
    aY,
    aWidth,
    aHeight
  }), [])

  return (
    <NativeSafeAreaProvider
      style={[styles.fill, style]}
      onInsetsChange={_onInsetsChange}
      {...others}
    >
      {insets != null ? (
        <SafeAreaFrameContext.Provider value={aFrame}>
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

// function useParentSafeAreaInsets(): EdgeInsets | null {
//   return React.useContext(SafeAreaInsetsContext);
// }
//
// function useParentSafeAreaFrame(): Rect | null {
//   return React.useContext(SafeAreaFrameContext);
// }

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

export function useAnimatedSafeAreaFrame() {
  const frame = React.useContext(SafeAreaFrameContext);
  if (frame == null) {
    throw new Error(NO_INSETS_ERROR);
  }
  return frame;
}

export function useSafeAreaFrame() {
  const frame = React.useContext(SafeAreaFrameContext);
  if (frame == null) {
    throw new Error(NO_INSETS_ERROR);
  }

  const animatedValue = useDerivedValue(() => ({
    x: frame.aX.value,
    y: frame.aY.value,
    width: frame.aWidth.value,
    height: frame.aHeight.value,
  }))

  const [value, setValue] = useState(animatedValue.value)
  useAnimatedReaction(() => animatedValue.value, (cur, prev) => {
    if (JSON.stringify(cur) !== JSON.stringify(prev)) {
      runOnJS(setValue)(cur)
    }
  }, [])

  return value;
}

export type WithSafeAreaInsetsProps = {
  insets: EdgeInsets;
};

export function withSafeAreaInsets<T>(
  WrappedComponent: React.ComponentType<T & WithSafeAreaInsetsProps>,
): React.ForwardRefExoticComponent<
  React.PropsWithoutRef<T> & React.RefAttributes<unknown>
> {
  return React.forwardRef((props: T, ref: React.Ref<unknown>) => {
    const insets = useSafeAreaInsets();
    return <WrappedComponent {...props} insets={insets} ref={ref} />;
  });
}

/**
 * @deprecated
 */
export function useSafeArea(): EdgeInsets {
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
