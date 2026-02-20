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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-50">
          <h2 className="text-base font-black text-gray-900 uppercase tracking-tight">{title}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 bg-gray-50 rounded-xl active:scale-90 transition-all">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export const Input = ({ label, className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) => {
  return (
    <div className="mb-3">
      {label && <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">{label}</label>}
      <input
        {...props}
        onFocus={(e) => {
          e.target.select();
          props.onFocus?.(e);
        }}
        className={`w-full px-4 py-2.5 rounded-xl bg-gray-50 focus:ring-2 focus:ring-primary/10 focus:bg-white focus:border-primary/30 border border-transparent outline-none transition-all text-sm text-gray-900 placeholder:text-gray-400 ${className}`}
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
  const baseStyle = "w-full py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all active:scale-[0.96] flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-primary text-white shadow-lg shadow-primary/20 hover:opacity-90",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};