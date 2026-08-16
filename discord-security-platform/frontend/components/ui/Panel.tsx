import { HTMLAttributes } from 'react';

export function Panel({ className = '', children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`panel rounded-2xl p-5 ${className}`} {...rest}>
      {children}
    </div>
  );
}
