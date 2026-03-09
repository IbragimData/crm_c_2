'use client'
import { useRef, useEffect } from 'react';
import s from "./AutoTextarea.module.scss"

type Props = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  label?: string
  onFocus?: () => void
};

export function AutoTextarea({ label, value, onChange, placeholder, onFocus }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resizeTextarea = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto'; // сброс
    textarea.style.height = textarea.scrollHeight + 'px'; // под контент
  };

  useEffect(() => {
    resizeTextarea(); // 🔥 при первой загрузке и изменении value
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e);
  };

  return (
    <div className={s.AutoTextarea}>
      {label && (
        <label className={s.AutoTextarea__label}>
          {label}
        </label>
      )}

      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={s.AutoTextarea__textarea}
        rows={1}
        onFocus={onFocus}
      />
    </div>
  );
}