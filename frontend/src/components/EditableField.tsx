import { useRef, useLayoutEffect, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getContentBlocks, setContentBlock, invalidateContentKey } from '../services/content';

interface EditableFieldProps {
  storageKey: string;
  defaultValue: string;
  style?: React.CSSProperties;
  className?: string;
  tag?: string;
}

const SINGLE_LINE_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'strong', 'em', 'div'];

const ADMIN_EDITABLE_STYLE: React.CSSProperties = {
  cursor: 'text',
  outline: 'none',
  textDecoration: 'underline',
  textDecorationStyle: 'dashed',
  textDecorationColor: 'rgba(0, 102, 255, 0.4)',
  textDecorationThickness: '1px',
  borderRadius: '2px',
  transition: 'background 0.15s',
};

export default function EditableField({
  storageKey,
  defaultValue,
  style,
  className,
  tag = 'span',
}: EditableFieldProps) {
  const { isAdmin } = useAuth();
  const ref = useRef<HTMLElement>(null);
  const storageItem = `ef_${storageKey}`;
  const allowNewlines = !SINGLE_LINE_TAGS.includes(tag);

  // Fast initial value from localStorage cache
  const [value, setValue] = useState<string>(() => localStorage.getItem(storageItem) ?? defaultValue);

  // Set admin contentEditable innerText synchronously before paint (from cache)
  useLayoutEffect(() => {
    if (!isAdmin || !ref.current) return;
    ref.current.innerText = localStorage.getItem(storageItem) ?? defaultValue;
  }, [storageKey, defaultValue, isAdmin, storageItem]);

  // Background: fetch latest value from API and update cache + display
  useEffect(() => {
    let cancelled = false;
    getContentBlocks([storageKey])
      .then(blocks => {
        if (cancelled) return;
        const apiVal = blocks[storageKey];
        if (apiVal !== undefined) {
          localStorage.setItem(storageItem, apiVal);
          setValue(apiVal);
          // Update contentEditable if admin and not currently focused
          if (isAdmin && ref.current && document.activeElement !== ref.current) {
            ref.current.innerText = apiVal;
          }
        }
      })
      .catch(() => { /* localStorage fallback already loaded */ });
    return () => { cancelled = true; };
  }, [storageKey, storageItem]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isAdmin) {
    const Tag = tag as any;
    return (
      <Tag style={style} className={className}>
        {value}
      </Tag>
    );
  }

  const Tag = tag as any;

  const handleSave = async (text: string) => {
    const next = text || defaultValue;
    const prev = localStorage.getItem(storageItem) ?? defaultValue;

    // Update localStorage immediately (offline-first)
    localStorage.setItem(storageItem, next);
    setValue(next);

    // Persist to API in background (setContentBlock also updates mem-cache)
    try {
      await setContentBlock(storageKey, next);
    } catch {
      // localStorage already updated; clear stale mem-cache entry so
      // next page visit re-fetches the correct value from API
      invalidateContentKey(storageKey);
    }

    if (next !== prev) {
      toast.success('Saved', { id: 'edit-save', duration: 1500 });
    }
  };

  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        const text = e.currentTarget.innerText.trim();
        handleSave(text);
        e.currentTarget.style.background = '';
      }}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === 'Escape') {
          if (ref.current) ref.current.innerText = localStorage.getItem(storageItem) ?? defaultValue;
          ref.current?.blur();
          e.preventDefault();
        }
        if (e.key === 'Enter' && !allowNewlines) {
          e.preventDefault();
          ref.current?.blur();
        }
      }}
      onFocus={(e: React.FocusEvent<HTMLElement>) => {
        e.currentTarget.style.background = 'rgba(0, 102, 255, 0.05)';
      }}
      style={{ ...style, ...ADMIN_EDITABLE_STYLE }}
      className={className}
      title="Click to edit · Enter to save · Esc to cancel"
    />
  );
}
