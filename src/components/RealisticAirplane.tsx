import React from 'react';

export const REALISTIC_AIRPLANE_PATH_RIGHT =
  'M 100 50 L 99.2 51.8 L 97.8 53.2 L 94 55 L 90.5 56 L 85 57 L 69.5 57.5 L 58.5 74.5 L 61.2 75 L 62 76 L 62 81.8 L 60.8 82.5 L 54 82.5 L 53.5 83 L 47.5 94 L 43.5 100 L 40.5 100 L 47.5 65 L 48 57 L 45 56.2 L 40 56 L 20.5 54.5 L 19.2 56.5 L 11.5 71.5 L 7 71.5 L 7.8 67.5 L 10.8 53 L 0 50 L 10.8 47 L 7.8 32.5 L 7 28.5 L 11.5 28.5 L 19.2 43.5 L 20.5 45.5 L 40 44 L 45 43.8 L 48 43 L 47.5 35 L 40.5 0 L 43.5 0 L 47.5 6 L 53.5 17 L 54 17.5 L 60.8 17.5 L 62 18.2 L 62 24 L 61.2 25 L 58.5 25.5 L 69.5 42.5 L 85 43 L 90.5 44 L 94 45 L 97.8 46.8 L 99.2 48.2 Z';

export const REALISTIC_AIRPLANE_PATH_UP =
  'M 50 0 L 51.8 0.8 L 53.2 2.2 L 55 6 L 56 9.5 L 57 15 L 57.5 30.5 L 74.5 41.5 L 75 38.8 L 76 38 L 81.8 38 L 82.5 39.2 L 82.5 46 L 83 46.5 L 94 52.5 L 100 56.5 L 100 59.5 L 65 52.5 L 57 52 L 56.2 55 L 56 60 L 54.5 79.5 L 56.5 80.8 L 71.5 88.5 L 71.5 93 L 67.5 92.2 L 53 89.2 L 50 100 L 47 89.2 L 32.5 92.2 L 28.5 93 L 28.5 88.5 L 43.5 80.8 L 45.5 79.5 L 44 60 L 43.8 55 L 43 52 L 35 52.5 L 0 59.5 L 0 56.5 L 6 52.5 L 17 46.5 L 17.5 46 L 17.5 39.2 L 18.2 38 L 24 38 L 25 38.8 L 25.5 41.5 L 42.5 30.5 L 43 15 L 44 9.5 L 45 6 L 46.8 2.2 L 48.2 0.8 Z';

export const REALISTIC_AIRPLANE_CENTERED_PATH =
  'M 17 0 L 16.7 0.6 L 16.3 1.1 L 15 1.7 L 13.8 2 L 11.9 2.4 L 6.6 2.6 L 2.9 8.3 L 3.8 8.5 L 4.1 8.8 L 4.1 10.8 L 3.7 11.1 L 1.4 11.1 L 1.2 11.2 L -0.9 15 L -2.2 17 L -3.2 17 L -0.9 5.1 L -0.7 2.4 L -1.7 2.1 L -3.4 2 L -10 1.5 L -10.5 2.2 L -13.1 7.3 L -14.6 7.3 L -14.3 6 L -13.3 1 L -17 0 L -13.3 -1 L -14.3 -6 L -14.6 -7.3 L -13.1 -7.3 L -10.5 -2.2 L -10 -1.5 L -3.4 -2 L -1.7 -2.1 L -0.7 -2.4 L -0.9 -5.1 L -3.2 -17 L -2.2 -17 L -0.9 -15 L 1.2 -11.2 L 1.4 -11.1 L 3.7 -11.1 L 4.1 -10.8 L 4.1 -8.8 L 3.8 -8.5 L 2.9 -8.3 L 6.6 -2.6 L 11.9 -2.4 L 13.8 -2 L 15 -1.7 L 16.3 -1.1 L 16.7 -0.6 Z';

export interface RealisticAirplaneProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  fill?: string;
  direction?: 'right' | 'up';
}

export const RealisticAirplane: React.FC<RealisticAirplaneProps> = ({
  className = 'w-8 h-8',
  fill = 'currentColor',
  direction = 'right',
  ...props
}) => {
  const d = direction === 'up' ? REALISTIC_AIRPLANE_PATH_UP : REALISTIC_AIRPLANE_PATH_RIGHT;
  return (
    <svg
      viewBox="0 0 100 100"
      fill={fill}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d={d} />
    </svg>
  );
};
