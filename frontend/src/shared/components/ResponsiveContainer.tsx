import type { FC, ReactNode } from 'react';

export interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
}

export const ResponsiveContainer: FC<ResponsiveContainerProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`.trim()}>
      {children}
    </div>
  );
};
