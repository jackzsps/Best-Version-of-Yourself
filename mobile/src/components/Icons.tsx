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
  sparkles: (props) => (
    <>
      <Path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" {...props} />
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
  pencil: (props) => (
    <>
      <Path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" {...props} />
    </>
  ),
  google: (props) => (
    <>
      <Path stroke="none" fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .533 5.347.533 12S5.867 24 12.48 24c3.44 0 6.053-1.147 8.213-3.293 2.187-2.187 2.853-5.267 2.853-7.773 0-.773-.067-1.52-.2-2.267H12.48z" {...props} />
    </>
  ),
  apple: (props) => (
    <>
      <Path stroke="none" fill="currentColor" fillRule="evenodd" d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.56-1.701" {...props} />
    </>
  ),
  dollar: (props) => (
    <>
      <Line x1="12" y1="1" x2="12" y2="23" {...props} />
      <Path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" {...props} />
    </>
  ),
  flame: (props) => (
    <>
      <Path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.1.2-2.2.6-3.3.7 1.1 1.9 2.1 2.9 2.8z" {...props} />
    </>
  ),
  pieChart: (props) => (
    <>
      <Path d="M21.21 15.89A10 10 0 1 1 8 2.83" {...props} />
      <Path d="M22 12A10 10 0 0 0 12 2v10z" {...props} />
    </>
  ),
  barChart: (props) => (
    <>
      <Line x1="12" y1="20" x2="12" y2="10" {...props} />
      <Line x1="18" y1="20" x2="18" y2="4" {...props} />
      <Line x1="6" y1="20" x2="6" y2="16" {...props} />
    </>
  ),
  star: (props) => (
    <>
      <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" {...props} />
    </>
  )
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
