/**
 * Loading State - Reusable loading indicators
 */

'use client';

import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

export function LoadingState({ size = 'md', text, fullScreen = false }: LoadingStateProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const content = (
    <div className="flex flex-col items-center justify-center space-y-3">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />
      {text && <p className="text-sm text-gray-600">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return <div className="flex items-center justify-center py-12">{content}</div>;
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <Loader2 className={`${sizeClasses[size]} animate-spin ${className}`} />
  );
}

interface LoadingButtonProps {
  loading: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  type?: 'button' | 'submit';
  className?: string;
}

export function LoadingButton({
  loading,
  children,
  onClick,
  disabled,
  variant = 'primary',
  type = 'button',
  className = ''
}: LoadingButtonProps) {
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
    danger: 'bg-red-600 hover:bg-red-700 text-white'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
    >
      {loading && <LoadingSpinner size="sm" className="mr-2" />}
      {children}
    </button>
  );
}
