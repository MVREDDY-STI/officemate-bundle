/**
 * ImageEditorModal — canvas-based image editor
 *
 * Features: Fill / Fit · Rotate ±90° · Flip H/V · Zoom · Crop · Upload
 */
import { useState, useEffect, useRef, useCallback, MouseEvent } from 'react';
import {
  RotateCcw, RotateCw, ZoomIn, ZoomOut, Crop,
  Check, X, RefreshCw, Maximize2, Minimize2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiUpload, BASE } from '../services/api';

// ─── Canvas dimensions for preview ─────────────────────────────
const CANVAS_W = 620;
const CANVAS_H = 420;

// ─── Types ─────────────────────────────────────────────────────
interface CropBox { x: number; y: number; w: number; h: number }
type DragState =
  | { kind: 'none' }
  | { kind: 'drawing'; startX: number; startY: number }
  | { kind: 'moving'; offsetX: number; offsetY: number }
  | { kind: 'resizing'; handle: string; startX: number; startY: number; origBox: CropBox };

interface Props {
  file: File;
  onClose: () => void;
  onSave: (url: string) => void;
}

// ─── Main Component ─────────────────────────────────────────────
export default function ImageEditorModal({ file, onClose, onSave }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const imgRef       = useRef<HTMLImageElement | null>(null);
  const dragRef      = useRef<DragState>({ kind: 'none' });

  const [imgLoaded, setImgLoaded]   = useState(false);
  const [rotation, setRotation]     = useState<0 | 90 | 180 | 270>(0);
  const [flipH, setFlipH]           = useState(false);
  const [flipV, setFlipV]           = useState(false);
  const [zoom, setZoom]             = useState(1.0);
  const [fitMode, setFitMode]       = useState<'fill' | 'fit'>('fill');
  const [cropBox, setCropBox]       = useState<CropBox | null>(null);
  const [cropMode, setCropMode]     = useState(false);
  const [uploading, setUploading]   = useState(false);

  // ─── Load image ─────────────────────────────────────────────
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
    };
    img.onerror = () => toast.error('Could not load image');
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // ─── Redraw canvas ───────────────────────────────────────────
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const img    = imgRef.current;
    if (!canvas || !img || !imgLoaded) return;

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Checkerboard background (shows transparent areas)
    drawCheckerboard(ctx, CANVAS_W, CANVAS_H);

    // Draw transformed image
    drawTransformed(ctx, img, rotation, flipH, flipV, zoom, fitMode, CANVAS_W, CANVAS_H);

    // Draw crop overlay
    if (cropBox) drawCropOverlay(ctx, cropBox, CANVAS_W, CANVAS_H);
  }, [imgLoaded, rotation, flipH, flipV, zoom, fitMode, cropBox]);

  useEffect(() => { redraw(); }, [redraw]);

  // ─── Rotation helpers ────────────────────────────────────────
  const rotateLeft  = () => setRotation(r => (((r - 90) % 360 + 360) % 360) as 0 | 90 | 180 | 270);
  const rotateRight = () => setRotation(r => ((r + 90) % 360) as 0 | 90 | 180 | 270);

  const resetAll = () => {
    setRotation(0); setFlipH(false); setFlipV(false);
    setZoom(1); setFitMode('fill'); setCropBox(null); setCropMode(false);
  };

  // ─── Crop mouse events ───────────────────────────────────────
  const canvasCoords = (e: MouseEvent<HTMLCanvasElement>): { cx: number; cy: number } => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      cx: Math.max(0, Math.min(CANVAS_W, (e.clientX - rect.left) * (CANVAS_W / rect.width))),
      cy: Math.max(0, Math.min(CANVAS_H, (e.clientY - rect.top)  * (CANVAS_H / rect.height))),
    };
  };

  const onMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!cropMode) return;
    const { cx, cy } = canvasCoords(e);

    // Check if clicking a resize handle
    if (cropBox) {
      const handle = hitHandle(cx, cy, cropBox);
      if (handle) {
        dragRef.current = { kind: 'resizing', handle, startX: cx, startY: cy, origBox: { ...cropBox } };
        return;
      }
      // Check if inside box (move)
      if (cx >= cropBox.x && cx <= cropBox.x + cropBox.w &&
          cy >= cropBox.y && cy <= cropBox.y + cropBox.h) {
        dragRef.current = { kind: 'moving', offsetX: cx - cropBox.x, offsetY: cy - cropBox.y };
        return;
      }
    }

    // Start drawing new box
    dragRef.current = { kind: 'drawing', startX: cx, startY: cy };
    setCropBox(null);
  };

  const onMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!cropMode) return;
    const { cx, cy } = canvasCoords(e);
    const drag = dragRef.current;

    if (drag.kind === 'drawing') {
      const x = Math.min(drag.startX, cx);
      const y = Math.min(drag.startY, cy);
      const w = Math.abs(cx - drag.startX);
      const h = Math.abs(cy - drag.startY);
      if (w > 4 && h > 4) setCropBox({ x, y, w, h });
    } else if (drag.kind === 'moving' && cropBox) {
      setCropBox(b => b ? {
        x: Math.max(0, Math.min(CANVAS_W - b.w, cx - drag.offsetX)),
        y: Math.max(0, Math.min(CANVAS_H - b.h, cy - drag.offsetY)),
        w: b.w, h: b.h,
      } : null);
    } else if (drag.kind === 'resizing' && cropBox) {
      const { handle, startX, startY, origBox } = drag;
      const dx = cx - startX;
      const dy = cy - startY;
      setCropBox(applyHandleResize(origBox, handle, dx, dy, CANVAS_W, CANVAS_H));
    }
  };

  const onMouseUp = () => { dragRef.current = { kind: 'none' }; };

  // ─── Export & upload ─────────────────────────────────────────
  const handleSave = async () => {
    const img = imgRef.current;
    if (!img) return;

    setUploading(true);
    try {
      // Build export canvas at 2× preview for quality
      const scale  = 2;
      const outW   = CANVAS_W * scale;
      const outH   = CANVAS_H * scale;
      const off    = document.createElement('canvas');
      off.width    = outW;
      off.height   = outH;
      const ctx    = off.getContext('2d')!;

      drawCheckerboard(ctx, outW, outH);
      drawTransformed(ctx, img, rotation, flipH, flipV, zoom, fitMode, outW, outH);

      let finalCanvas = off;

      // Apply crop
      if (cropBox) {
        const cx = cropBox.x * scale;
        const cy = cropBox.y * scale;
        const cw = cropBox.w * scale;
        const ch = cropBox.h * scale;

        const cropped   = document.createElement('canvas');
        cropped.width   = cw;
        cropped.height  = ch;
        const cctx      = cropped.getContext('2d')!;
        cctx.drawImage(off, cx, cy, cw, ch, 0, 0, cw, ch);
        finalCanvas = cropped;
      }

      const blob = await new Promise<Blob>((res, rej) =>
        finalCanvas.toBlob(b => b ? res(b) : rej(new Error('Canvas export failed')), 'image/jpeg', 0.92),
      );

      const fd = new FormData();
      fd.append('file', blob, `edited-image-${Date.now()}.jpg`);
      const result = await apiUpload<{ url: string }>('/api/v1/uploads', fd);
      const url = result.url.startsWith('http') ? result.url : `${BASE}${result.url}`;
      toast.success('Image saved!');
      onSave(url);
    } catch (err: any) {
      toast.error(err?.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // ─── UI ─────────────────────────────────────────────────────
  const btnStyle = (active?: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '0.25rem', padding: '0.4rem 0.65rem',
    border: '1px solid', borderRadius: '6px', cursor: 'pointer',
    fontSize: '0.78rem', fontWeight: 500, whiteSpace: 'nowrap',
    background: active ? '#111' : '#fff',
    color:      active ? '#fff' : '#374151',
    borderColor: active ? '#111' : '#D1D5DB',
    transition: 'all 0.15s',
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        background: '#fff', borderRadius: '14px', overflow: 'hidden',
        width: '100%', maxWidth: '720px', boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '1rem 1.25rem', borderBottom: '1px solid #E9ECEF', background: '#FAFAFA',
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#111' }}>Edit Image</h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#888', marginTop: '2px' }}>
              {file.name} &nbsp;·&nbsp; {(file.size / 1024).toFixed(0)} KB
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#666' }}>
            <X size={18} />
          </button>
        </div>

        {/* Toolbar */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '0.4rem', padding: '0.75rem 1rem',
          borderBottom: '1px solid #F0F0F0', background: '#FAFAFA',
          alignItems: 'center',
        }}>
          {/* Fit mode */}
          <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: '6px', padding: '2px', gap: '2px' }}>
            <button onClick={() => setFitMode('fill')} style={btnStyle(fitMode === 'fill')} title="Fill — image covers entire area">
              <Maximize2 size={13} /> Fill
            </button>
            <button onClick={() => setFitMode('fit')} style={btnStyle(fitMode === 'fit')} title="Fit — show entire image">
              <Minimize2 size={13} /> Fit
            </button>
          </div>

          <div style={{ width: '1px', height: '28px', background: '#E5E7EB' }} />

          {/* Rotate */}
          <button onClick={rotateLeft}  style={btnStyle()} title="Rotate 90° left"><RotateCcw size={13} /> 90°</button>
          <button onClick={rotateRight} style={btnStyle()} title="Rotate 90° right"><RotateCw  size={13} /> 90°</button>

          <div style={{ width: '1px', height: '28px', background: '#E5E7EB' }} />

          {/* Flip */}
          <button onClick={() => setFlipH(f => !f)} style={btnStyle(flipH)} title="Flip horizontal">
            ↔ Flip H
          </button>
          <button onClick={() => setFlipV(f => !f)} style={btnStyle(flipV)} title="Flip vertical">
            ↕ Flip V
          </button>

          <div style={{ width: '1px', height: '28px', background: '#E5E7EB' }} />

          {/* Zoom */}
          <button onClick={() => setZoom(z => Math.max(0.25, +(z - 0.1).toFixed(2)))} style={btnStyle()} title="Zoom out"><ZoomOut size={13} /></button>
          <span style={{ fontSize: '0.75rem', color: '#555', minWidth: '36px', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={() => setZoom(z => Math.min(5, +(z + 0.1).toFixed(2)))} style={btnStyle()} title="Zoom in"><ZoomIn size={13} /></button>

          <div style={{ width: '1px', height: '28px', background: '#E5E7EB' }} />

          {/* Crop */}
          <button
            onClick={() => { setCropMode(m => { if (m) setCropBox(null); return !m; }); }}
            style={btnStyle(cropMode)}
            title={cropMode ? 'Exit crop mode' : 'Crop image'}
          >
            <Crop size={13} /> Crop
          </button>
          {cropBox && <button onClick={() => setCropBox(null)} style={{ ...btnStyle(), color: '#DC2626', borderColor: '#FCA5A5' }} title="Clear crop">Clear Crop</button>}

          <div style={{ marginLeft: 'auto' }}>
            <button onClick={resetAll} style={{ ...btnStyle(), gap: '0.3rem', color: '#666' }} title="Reset all changes"><RefreshCw size={12} /> Reset</button>
          </div>
        </div>

        {/* Canvas */}
        <div style={{ position: 'relative', background: '#1a1a2e', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            style={{
              display: 'block',
              width: '100%',
              maxWidth: `${CANVAS_W}px`,
              cursor: cropMode ? 'crosshair' : 'default',
              touchAction: 'none',
            }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          />
          {!imgLoaded && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ccc', fontSize: '0.875rem',
            }}>
              Loading image…
            </div>
          )}
          {cropMode && (
            <div style={{
              position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.55)', color: '#fff', padding: '4px 12px',
              borderRadius: '20px', fontSize: '0.72rem', pointerEvents: 'none', whiteSpace: 'nowrap',
            }}>
              {cropBox ? 'Drag to reposition · Drag handles to resize' : 'Click and drag to select crop area'}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
          gap: '0.75rem', padding: '1rem 1.25rem', borderTop: '1px solid #E9ECEF', background: '#FAFAFA',
        }}>
          {cropBox && (
            <span style={{ fontSize: '0.75rem', color: '#888', marginRight: 'auto' }}>
              Crop: {Math.round(cropBox.w)}×{Math.round(cropBox.h)}px
            </span>
          )}
          <button onClick={onClose} style={{ padding: '0.5rem 1.1rem', border: '1px solid #D1D5DB', borderRadius: '7px', background: '#fff', cursor: 'pointer', fontSize: '0.875rem', color: '#374151' }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={uploading || !imgLoaded}
            style={{
              padding: '0.5rem 1.25rem', border: 'none', borderRadius: '7px',
              background: uploading ? '#9CA3AF' : '#111', color: '#fff',
              cursor: uploading ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}
          >
            <Check size={15} /> {uploading ? 'Uploading…' : 'Save & Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Canvas drawing helpers ─────────────────────────────────────

function drawCheckerboard(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const size = 12;
  for (let y = 0; y < h; y += size) {
    for (let x = 0; x < w; x += size) {
      ctx.fillStyle = (x / size + y / size) % 2 === 0 ? '#2a2a3a' : '#222230';
      ctx.fillRect(x, y, size, size);
    }
  }
}

function drawTransformed(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  rotation: 0 | 90 | 180 | 270,
  flipH: boolean,
  flipV: boolean,
  zoom: number,
  fitMode: 'fill' | 'fit',
  canvasW: number,
  canvasH: number,
) {
  const isSwapped  = rotation === 90 || rotation === 270;
  const naturalW   = isSwapped ? img.naturalHeight : img.naturalWidth;
  const naturalH   = isSwapped ? img.naturalWidth  : img.naturalHeight;

  let baseScale: number;
  if (fitMode === 'fill') {
    baseScale = Math.max(canvasW / naturalW, canvasH / naturalH);
  } else {
    baseScale = Math.min(canvasW / naturalW, canvasH / naturalH);
  }
  const drawScale = baseScale * zoom;
  const drawW     = img.naturalWidth  * drawScale;
  const drawH     = img.naturalHeight * drawScale;

  ctx.save();
  ctx.translate(canvasW / 2, canvasH / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();
}

function drawCropOverlay(ctx: CanvasRenderingContext2D, box: CropBox, w: number, h: number) {
  const { x, y } = box;
  const bw = box.w, bh = box.h;

  // Dark overlay outside crop
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.48)';
  ctx.fillRect(0, 0, w, y);                       // top
  ctx.fillRect(0, y + bh, w, h - y - bh);         // bottom
  ctx.fillRect(0, y, x, bh);                       // left
  ctx.fillRect(x + bw, y, w - x - bw, bh);        // right

  // Dashed border
  ctx.strokeStyle = '#fff';
  ctx.lineWidth   = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.strokeRect(x, y, bw, bh);
  ctx.setLineDash([]);

  // Rule-of-thirds grid inside crop
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth   = 0.75;
  for (let i = 1; i < 3; i++) {
    ctx.beginPath(); ctx.moveTo(x + (bw / 3) * i, y); ctx.lineTo(x + (bw / 3) * i, y + bh); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y + (bh / 3) * i); ctx.lineTo(x + bw, y + (bh / 3) * i); ctx.stroke();
  }

  // Corner handles
  const hs = 8;
  ctx.fillStyle = '#fff';
  const corners = [
    [x, y], [x + bw - hs, y], [x, y + bh - hs], [x + bw - hs, y + bh - hs],
  ] as [number, number][];
  corners.forEach(([hx, hy]) => ctx.fillRect(hx, hy, hs, hs));

  // Edge handles (mid)
  ctx.fillRect(x + bw / 2 - hs / 2, y, hs, hs / 2);
  ctx.fillRect(x + bw / 2 - hs / 2, y + bh - hs / 2, hs, hs / 2);
  ctx.fillRect(x, y + bh / 2 - hs / 2, hs / 2, hs);
  ctx.fillRect(x + bw - hs / 2, y + bh / 2 - hs / 2, hs / 2, hs);

  ctx.restore();
}

/** Returns which resize handle was hit, or null */
function hitHandle(cx: number, cy: number, box: CropBox): string | null {
  const { x, y, w, h } = box;
  const hs = 12; // hit area
  const handles: [string, number, number][] = [
    ['tl', x, y], ['tr', x + w, y], ['bl', x, y + h], ['br', x + w, y + h],
    ['tm', x + w / 2, y], ['bm', x + w / 2, y + h],
    ['lm', x, y + h / 2], ['rm', x + w, y + h / 2],
  ];
  for (const [name, hx, hy] of handles) {
    if (Math.abs(cx - hx) < hs && Math.abs(cy - hy) < hs) return name;
  }
  return null;
}

function applyHandleResize(orig: CropBox, handle: string, dx: number, dy: number, maxW: number, maxH: number): CropBox {
  let { x, y, w, h } = orig;
  if (handle.includes('l'))  { x = Math.max(0, Math.min(x + w - 20, x + dx)); w = orig.x + orig.w - x; }
  if (handle.includes('r'))  { w = Math.max(20, Math.min(maxW - x, w + dx)); }
  if (handle.includes('t'))  { y = Math.max(0, Math.min(y + h - 20, y + dy)); h = orig.y + orig.h - y; }
  if (handle.includes('b'))  { h = Math.max(20, Math.min(maxH - y, h + dy)); }
  if (handle === 'tm' || handle === 'bm') { x = orig.x; w = orig.w; }
  if (handle === 'lm' || handle === 'rm') { y = orig.y; h = orig.h; }
  return { x, y, w, h };
}
