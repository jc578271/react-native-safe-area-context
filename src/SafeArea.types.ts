import type * as React from 'react';
import type { NativeSyntheticEvent, ViewProps } from 'react-native';
import type {SharedValue} from "react-native-reanimated";

export type Edge = 'top' | 'right' | 'bottom' | 'left';

export interface EdgeInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface AEdgeInsets {
  aTop: SharedValue<number>;
  aRight: SharedValue<number>;
  aBottom: SharedValue<number>;
  aLeft:  SharedValue<number>;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ARect {
  aX: SharedValue<number>;
  aY: SharedValue<number>;
  aWidth: SharedValue<number>;
  aHeight: SharedValue<number>;
}

export interface Metrics {
  insets: EdgeInsets;
  frame: Rect;
}

export type InsetChangedEvent = NativeSyntheticEvent<Metrics>;

export type InsetChangeNativeCallback = (event: InsetChangedEvent) => void;

export interface NativeSafeAreaProviderProps extends ViewProps {
  children?: React.ReactNode;
  onInsetsChange: InsetChangeNativeCallback;
}

export interface NativeSafeAreaViewProps extends ViewProps {
  children?: React.ReactNode;
  mode?: 'padding' | 'margin';
  edges?: ReadonlyArray<Edge>;
}
