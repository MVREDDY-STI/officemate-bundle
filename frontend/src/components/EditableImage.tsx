import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getContentBlocks, setContentBlock, invalidateContentKey } from '../services/content';
import ImageEditorModal from './ImageEditorModal';

interface EditableImageProps {
  storageKey: string;
  defaultSrc: string;
  alt: string;
  style?: React.CSSProperties;
  className?: string;
  wrapperStyle?: React.CSSProperties;
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
  const [src, setSrc]             = useState<string>(() => localStorage.getItem(storageItem) ?? defaultSrc);
  const [editorFile, setEditorFile] = useState<File | null>(null);
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

  // Open the image editor instead of uploading directly
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setEditorFile(file);
  };

  // Called when editor finishes upload — url is already on MinIO
  const handleEditorSave = async (url: string) => {
    setEditorFile(null);
    setSrc(url);
    localStorage.setItem(storageItem, url);
    try {
      await setContentBlock(storageKey, url);
    } catch {
      invalidateContentKey(storageKey);
    }
  };

  if (!isAdmin) {
    return <img src={src} alt={alt} style={style} className={className} />;
  }

  return (
    <>
      {editorFile && (
        <ImageEditorModal
          file={editorFile}
          onClose={() => setEditorFile(null)}
          onSave={handleEditorSave}
        />
      )}
      <div style={{ position: 'relative', display: 'inline-block', ...wrapperStyle }}>
        <img
          src={src}
          alt={alt}
          style={style}
          className={className}
        />
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
        <button
          onClick={() => inputRef.current?.click()}
          style={{
            position:       'absolute',
            top:            '0.5rem',
            right:          '0.5rem',
            background:     'rgba(0,0,0,0.65)',
            color:          '#fff',
            border:         'none',
            borderRadius:   '6px',
            padding:        '0.3rem 0.75rem',
            cursor:         'pointer',
            fontSize:       '0.75rem',
            fontWeight:     500,
            backdropFilter: 'blur(4px)',
            display:        'flex',
            alignItems:     'center',
            gap:            '0.35rem',
          }}
          title="Upload & edit image"
        >
          📷 Change
        </button>
      </div>
    </>
  );
}
