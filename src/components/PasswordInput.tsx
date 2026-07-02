'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps {
  name: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  className?: string;
}

export default function PasswordInput({
  name,
  placeholder,
  required,
  minLength,
  className = 'input',
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        name={name}
        type={visible ? 'text' : 'password'}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        className={`${className} pr-11`}
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
