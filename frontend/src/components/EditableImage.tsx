import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getContentBlocks, setContentBlock, invalidateContentKey } from '../services/content';
import { apiUpload } from '../services/api';

interface EditableImageProps {
  storageKey: string;
  defaultSrc: string;
  alt: string;
  style?: React.CSSProperties;
  className?: string;
  wrapperStyle?: React.CSSProperties;
}

interface UploadResult {
  url: string;
  key: string;
  size: number;
  type: string;
}

export default function EditableImage({
  storageKey,
  defaultSrc,
  alt,
  style,
  className,
  wrapperStyle,
}: EditableImageProps) {
  const { isAdmin } = useAuth();
  const storageItem = `ei_${storageKey}`;
  const [src, setSrc]           = useState<string>(() => localStorage.getItem(storageItem) ?? defaultSrc);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Background: fetch latest image URL from API
  useEffect(() => {
    let cancelled = false;
    getContentBlocks([storageKey])
      .then(blocks => {
        if (cancelled) return;
        const apiVal = blocks[storageKey];
        if (apiVal && apiVal !== src) {
          localStorage.setItem(storageItem, apiVal);
          setSrc(apiVal);
        }
      })
      .catch(() => { /* Keep localStorage fallback */ });
    return () => { cancelled = true; };
  }, [storageKey, storageItem]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    // Optimistic preview using an object URL (zero-copy, no base64)
    const preview = URL.createObjectURL(file);
    setSrc(preview);
    setUploading(true);

    try {
      // Upload to /api/v1/uploads → returns { url, key, size, type }
      const formData = new FormData();
      formData.append('file', file);
      const result = await apiUpload<UploadResult>('/api/v1/uploads', formData);

      // Persist the permanent URL (not the blob: URL)
      localStorage.setItem(storageItem, result.url);
      setSrc(result.url);

      // Save URL as the content block value (replaces any previous base64)
      await setContentBlock(storageKey, result.url);
    } catch (err) {
      // Revert to previous image on failure
      const prev = localStorage.getItem(storageItem) ?? defaultSrc;
      setSrc(prev);
      invalidateContentKey(storageKey);
      console.warn('Image upload failed:', err);
    } finally {
      URL.revokeObjectURL(preview);
      setUploading(false);
    }
  };

  if (!isAdmin) {
    return <img src={src} alt={alt} style={style} className={className} />;
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block', ...wrapperStyle }}>
      <img
        src={src}
        alt={alt}
        style={{ ...style, opacity: uploading ? 0.6 : 1, transition: 'opacity 0.2s' }}
        className={className}
      />
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
      <button
        onClick={() => !uploading && inputRef.current?.click()}
        disabled={uploading}
        style={{
          position:       'absolute',
          top:            '0.5rem',
          right:          '0.5rem',
          background:     uploading ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.65)',
          color:          '#fff',
          border:         'none',
          borderRadius:   '6px',
          padding:        '0.3rem 0.75rem',
          cursor:         uploading ? 'not-allowed' : 'pointer',
          fontSize:       '0.75rem',
          fontWeight:     500,
          backdropFilter: 'blur(4px)',
          display:        'flex',
          alignItems:     'center',
          gap:            '0.35rem',
        }}
        title={uploading ? 'Uploading…' : 'Upload new image'}
      >
        {uploading ? '⏳ Uploading…' : '📷 Change'}
      </button>
    </div>
  );
}
