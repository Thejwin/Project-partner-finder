import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export const Input = forwardRef(({ 
  className, 
  label, 
  error, 
  id, 
  ...props 
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-surface-700 mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          "block w-full rounded-lg border-surface-300 bg-white px-4 py-2 text-surface-900 shadow-sm transition-colors",
          "focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20",
          "disabled:cursor-not-allowed disabled:bg-surface-50 disabled:text-surface-500",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
