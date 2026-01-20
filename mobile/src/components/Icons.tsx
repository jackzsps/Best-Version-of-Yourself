import React from 'react';
import { Svg, Path, Circle, Line, Polyline, Rect } from 'react-native-svg';
import { ViewStyle } from 'react-native';

// --- Icon Path Data (Adapted for react-native-svg) ---

const iconPaths: Record<string, (props: any) => JSX.Element> = {
  home: (props) => (
    <>
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" {...props} />
      <Polyline points="9 22 9 12 15 12 15 22" {...props} />
    </>
  ),
  plusCircle: (props) => (
    <>
      <Circle cx="12" cy="12" r="10" {...props} />
      <Line x1="12" x2="12" y1="8" y2="16" {...props} />
      <Line x1="8" x2="16" y1="12" y2="12" {...props} />
    </>
  ),
  settings: (props) => (
    <>
      <Path
        d="M12.22 2h-.44a2 2 0 0 1-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
        {...props}
      />
      <Circle cx="12" cy="12" r="3" {...props} />
    </>
  ),
  camera: (props) => (
    <>
      <Path
        d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"
        {...props}
      />
      <Circle cx="12" cy="13" r="3" {...props} />
    </>
  ),
  arrowRight: (props) => (
    <>
      <Line x1="5" x2="19" y1="12" y2="12" {...props} />
      <Polyline points="12 5 19 12 12 19" {...props} />
    </>
  ),
  trash: (props) => (
    <>
      <Polyline points="3 6 5 6 21 6" {...props} />
      <Path
        d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
        {...props}
      />
      <Line x1="10" y1="11" x2="10" y2="17" {...props} />
      <Line x1="14" y1="11" x2="14" y2="17" {...props} />
    </>
  ),
  x: (props) => (
    <>
      <Line x1="18" y1="6" x2="6" y2="18" {...props} />
      <Line x1="6" y1="6" x2="18" y2="18" {...props} />
    </>
  ),
  calendar: (props) => (
    <>
      <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" {...props} />
      <Line x1="16" y1="2" x2="16" y2="6" {...props} />
      <Line x1="8" y1="2" x2="8" y2="6" {...props} />
      <Line x1="3" y1="10" x2="21" y2="10" {...props} />
    </>
  ),
};

export type IconName = keyof typeof iconPaths;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color = 'currentColor',
  style,
}) => {
  const IconContent = iconPaths[name] || iconPaths.home;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <IconContent />
    </Svg>
  );
};
