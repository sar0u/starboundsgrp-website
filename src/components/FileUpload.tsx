import { useState, useRef } from 'react';
import { Upload, Link2, X, CheckCircle2, Loader2, AlertTriangle, FileIcon } from 'lucide-react';
import { uploadToSupabase, isValidExternalUrl, formatBytes, MAX_DIRECT_UPLOAD_MB } from '../backend/storage';
import { isSupabaseEnabled } from '../backend/supabase';

interface Props {
  bucket: 'scenepacks' | 'tutorials' | 'audio';
  value?: { url?: string; name?: string; size?: string };
  onChange: (value: { url: string; name: string; size: string }) => void;
  accept?: string;
}

type Mode = 'upload' | 'link';

export default function FileUpload({ bucket, value, onChange, accept }: Props) {
  const [mode, setMode] = useState<Mode>(isSupabaseEnabled ? 'upload' : 'link');
  const [percent, setPercent] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePickFile = () => fileInputRef.current?.click();

  const handleFile = async (file: File) => {
    setErr(''); setBusy(true); setPercent(0);
    const res = await uploadToSupabase(bucket, file, (p) => setPercent(p.percent));
    setBusy(false);
    if (res.ok && res.url) {
      onChange({ url: res.url, name: res.fileName || file.name, size: res.fileSize || formatBytes(file.size) });
    } else {
      setErr(res.error || 'Upload failed.');
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = ''; // reset so picking same file again works
  };

  const submitUrl = () => {
    setErr('');
    if (!urlInput.trim()) { setErr('Paste a download URL.'); return; }
    if (!isValidExternalUrl(urlInput)) { setErr('That URL doesn\'t look valid (must start with http:// or https://).'); return; }
    let name = 'external-file';
    try {
      const u = new URL(urlInput);
      const last = u.pathname.split('/').filter(Boolean).pop();
      if (last) name = decodeURIComponent(last);
    } catch {/* keep default */}
    onChange({ url: urlInput.trim(), name, size: 'external' });
    setUrlInput('');
  };

  const clearAttachment = () => {
    onChange({ url: '', name: '', size: '' });
    setUrlInput(''); setErr(''); setPercent(0);
  };

  return (
    <div>
      <label className="block text-sm font-bold text-ink mb-1.5">File (optional)</label>

      {/* Existing attachment preview */}
      {value?.url ? (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gold-pale/60 border border-gold-pale">
          <div className="w-10 h-10 rounded-lg btn-primary flex items-center justify-center text-white shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-ink truncate">{value.name || 'Attached file'}</div>
            <div className="text-xs text-ink-muted truncate">{value.size ? value.size + ' · ' : ''}{value.url}</div>
          </div>
          <button type="button" onClick={clearAttachment}
            className="p-2 rounded-lg hover:bg-white/70 transition shrink-0" aria-label="Remove attachment">
            <X size={16} className="text-ink-muted" />
          </button>
        </div>
      ) : (
        <>
          {/* Mode tabs */}
          <div className="flex gap-1 bg-sun-pale/60 p-1 rounded-xl mb-2">
            <button type="button" onClick={() => setMode('upload')} disabled={!isSupabaseEnabled}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition ${mode === 'upload' ? 'btn-primary text-white' : 'text-ink-muted'} ${!isSupabaseEnabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
              <Upload size={13} /> Upload
            </button>
            <button type="button" onClick={() => setMode('link')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition ${mode === 'link' ? 'btn-primary text-white' : 'text-ink-muted'}`}>
              <Link2 size={13} /> External URL
            </button>
          </div>

          {mode === 'upload' && (
            <>
              <input ref={fileInputRef} type="file" accept={accept} onChange={onFileChange} className="hidden" />
              <button type="button" onClick={handlePickFile} disabled={busy || !isSupabaseEnabled}
                className="w-full flex flex-col items-center justify-center gap-2 py-5 rounded-xl border-2 border-dashed border-ash hover:border-gold hover:bg-sun-pale/30 transition disabled:opacity-50 disabled:cursor-not-allowed">
                {busy ? (
                  <>
                    <Loader2 size={22} className="text-tangerine animate-spin" />
                    <div className="text-sm font-bold text-ink">Uploading… {percent}%</div>
                    <div className="w-3/4 h-1.5 bg-ash rounded-full overflow-hidden">
                      <div className="h-full btn-primary transition-all" style={{ width: `${percent}%` }} />
                    </div>
                  </>
                ) : (
                  <>
                    <FileIcon size={22} className="text-tangerine" />
                    <div className="text-sm font-bold text-ink">Click to choose a file</div>
                    <div className="text-[11px] text-ink-muted">Up to {MAX_DIRECT_UPLOAD_MB} MB · Larger files? Use External URL</div>
                  </>
                )}
              </button>
            </>
          )}

          {mode === 'link' && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://drive.google.com/... or https://mega.nz/..."
                  className="flex-1 min-w-0 px-4 py-2.5 rounded-xl bg-cream border border-ash focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all text-sm" />
                <button type="button" onClick={submitUrl} className="px-4 py-2.5 rounded-xl btn-primary text-sm font-bold shadow shrink-0">
                  Attach
                </button>
              </div>
              <p className="text-[11px] text-ink-muted">
                Paste a public link from Google Drive, Mega, Dropbox, your own S3/R2 bucket — no file size limit.
              </p>
            </div>
          )}
        </>
      )}

      {err && (
        <div className="mt-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-600">
          <AlertTriangle size={13} className="shrink-0" />
          <span className="min-w-0 break-words">{err}</span>
        </div>
      )}
    </div>
  );
}
