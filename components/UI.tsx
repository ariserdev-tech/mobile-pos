import React, { ReactNode } from 'react';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-red-500 bg-white rounded-full shadow-sm border active:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export const Input = ({ label, className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) => {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-semibold text-gray-700 mb-1.5 uppercase tracking-tight">{label}</label>}
      <input
        {...props}
        className={`w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-orange-200 focus:border-primary outline-none transition-all text-base text-gray-900 placeholder:text-gray-400 ${className}`}
      />
    </div>
  );
};

export const Button = ({
  variant = 'primary',
  children,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }) => {
  const baseStyle = "w-full py-3.5 rounded-lg font-bold text-base transition-transform active:scale-[0.98] flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-primary text-white shadow-md shadow-orange-100 hover:bg-orange-600 border border-transparent",
    secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm",
    danger: "bg-white text-red-600 border border-red-100 hover:bg-red-50",
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};