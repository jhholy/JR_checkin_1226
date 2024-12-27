import { ButtonHTMLAttributes } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'red' | 'blue';
  loading?: boolean;
}

export default function Button({ 
  children, 
  variant = 'red', 
  loading, 
  className = '', 
  disabled,
  ...props 
}: ButtonProps) {
  const baseStyle = "group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50";
  
  const variantStyles = {
    red: "bg-muaythai-red hover:bg-muaythai-red-dark focus:ring-muaythai-red",
    blue: "bg-muaythai-blue hover:bg-muaythai-blue-dark focus:ring-muaythai-blue"
  };

  return (
    <button
      className={`${baseStyle} ${variantStyles[variant]} ${className}`}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? <LoadingSpinner className="w-5 h-5" /> : children}
    </button>
  );
} 