'use client';

import { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { getBrowserSupabaseClient } from '@/lib/supabase';
import { isValidUrl } from '@/lib/validation';
import type { ProjectWithAuthor } from '@/types';

interface ProjectFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: ProjectWithAuthor | null;
}

interface FormState {
  title: string;
  description: string;
  url: string;
}

interface FieldErrors {
  title?: string;
  description?: string;
  url?: string;
  upload?: string;
  submit?: string;
}

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

export function ProjectForm({ onSuccess, onCancel, initialData }: ProjectFormProps) {
  const [form, setForm] = useState<FormState>({ 
    title: initialData?.title ?? '', 
    description: initialData?.description ?? '', 
    url: initialData?.url ?? '' 
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});

  // Preview image: can come from Puppeteer auto-screenshot OR manual upload
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.mediaUrl ?? null);
  const [previewSource, setPreviewSource] = useState<'screenshot' | 'upload' | null>(initialData?.mediaUrl ? 'upload' : null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validate = useCallback((values: FormState): FieldErrors => {
    const errs: FieldErrors = {};
    if (!values.title.trim()) errs.title = 'Title is required.';
    else if (values.title.length > 200) errs.title = 'Title must be 200 characters or fewer.';
    if (!values.description.trim()) errs.description = 'Description is required.';
    if (!isValidUrl(values.url)) errs.url = 'A valid project URL (http or https) is required.';
    return errs;
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    const next = { ...form, [name]: value };
    setForm(next);
    if (touched[name as keyof FormState]) setErrors(validate(next));
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name } = e.target;
    setTouched((t) => ({ ...t, [name]: true }));
    setErrors(validate(form));
    if (name === 'url' && isValidUrl(form.url) && previewSource !== 'upload') {
      captureScreenshot(form.url);
    }
  }

  async function captureScreenshot(url: string) {
    setPreviewLoading(true);
    setPreviewUrl(null);
    setPreviewSource('screenshot');
    try {
      const supabase = getBrowserSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ url }),
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewUrl(data.screenshotUrl);
      } else {
        const data = await res.json().catch(() => ({}));
        if (res.status === 422) {
          setErrors((e) => ({ ...e, upload: 'Auto-screenshot blocked for this URL. Upload an image manually.' }));
        } else {
          setErrors((e) => ({ ...e, upload: data.message ?? 'Screenshot failed. Upload an image manually.' }));
        }
        setPreviewSource(null);
      }
    } catch {
      setErrors((e) => ({ ...e, upload: 'Screenshot failed. Upload an image manually.' }));
      setPreviewSource(null);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleFileSelected(file: File) {
    setErrors((e) => ({ ...e, upload: undefined }));

    if (!file.type.startsWith('image/')) {
      setErrors((e) => ({ ...e, upload: 'Please choose an image file (PNG, JPG, WEBP).' }));
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setErrors((e) => ({ ...e, upload: 'Image must be 5 MB or smaller.' }));
      return;
    }

    setPreviewLoading(true);
    setPreviewUrl(null);
    setPreviewSource('upload');

    try {
      const supabase = getBrowserSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setErrors((e) => ({ ...e, upload: 'Sign in to upload an image.' }));
        return;
      }

      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
      const storagePath = `portfolios/${session.user.id}/${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('project-screenshots')
        .upload(storagePath, file, { contentType: file.type, upsert: true, cacheControl: '3600' });

      if (uploadErr) {
        setErrors((e) => ({ ...e, upload: 'Upload failed. Please try again.' }));
        setPreviewSource(null);
        return;
      }

      const { data: publicData } = supabase.storage
        .from('project-screenshots')
        .getPublicUrl(storagePath);

      setPreviewUrl(publicData.publicUrl);
    } catch {
      setErrors((e) => ({ ...e, upload: 'Upload failed. Please try again.' }));
      setPreviewSource(null);
    } finally {
      setPreviewLoading(false);
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileSelected(file);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelected(file);
  }

  function clearPreview() {
    setPreviewUrl(null);
    setPreviewSource(null);
    setPreviewLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ title: true, description: true, url: true });
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    setErrors({});

    try {
      const supabase = getBrowserSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setErrors({ submit: 'You must be signed in to submit a project.' });
        return;
      }

      const method = initialData ? 'PATCH' : 'POST';
      const endpoint = initialData ? `/api/projects/${initialData.id}` : '/api/projects';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          url: form.url.trim(),
          mediaUrl: previewUrl ?? undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrors({ submit: data.message ?? (initialData ? 'Failed to update project. Please try again.' : 'Failed to submit project. Please try again.') });
        return;
      }

      onSuccess();
    } catch {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid oklch(35% 0.08 285 / 0.6)',
    borderRadius: 0,
    padding: '8px 2px',
    color: 'var(--foreground)',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-bottom-color 0.15s',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'oklch(60% 0.08 285)',
    display: 'block',
    marginBottom: '6px',
  };

  const errorStyle: React.CSSProperties = {
    fontSize: '12px',
    color: 'oklch(65% 0.2 15)',
    marginTop: '4px',
  };

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* URL — first, since it drives the auto-screenshot */}
      <div>
        <label htmlFor="proj-url" style={labelStyle}>Project URL</label>
        <input
          id="proj-url"
          name="url"
          type="url"
          className="underline-input"
          placeholder="https://my-project.vercel.app"
          value={form.url}
          onChange={handleChange}
          onBlur={handleBlur}
          style={{ ...inputStyle, borderBottomColor: errors.url ? 'oklch(65% 0.2 15 / 0.8)' : undefined }}
        />
        {errors.url && <p style={errorStyle}>{errors.url}</p>}
      </div>

      {/* Portfolio image section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <label style={labelStyle}>Portfolio Preview</label>
          {previewSource === 'screenshot' && !previewLoading && (
            <span style={{ fontSize: '11px', color: 'oklch(55% 0.08 285)', letterSpacing: '0.04em' }}>
              Auto-captured from URL
            </span>
          )}
          {previewSource === 'upload' && !previewLoading && (
            <span style={{ fontSize: '11px', color: 'var(--accent)', letterSpacing: '0.04em' }}>
              Custom upload
            </span>
          )}
        </div>

        {/* Preview area / drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !previewUrl && !previewLoading && fileInputRef.current?.click()}
          style={{
            position: 'relative',
            aspectRatio: '16/9',
            borderRadius: '8px',
            overflow: 'hidden',
            border: `1px dashed ${isDragOver ? 'var(--accent)' : 'oklch(35% 0.06 285 / 0.6)'}`,
            background: isDragOver ? 'oklch(13% 0.05 285)' : 'oklch(9% 0.03 285)',
            cursor: previewUrl || previewLoading ? 'default' : 'pointer',
            transition: 'border-color 0.15s, background 0.15s',
          }}
        >
          {/* Spinner */}
          {previewLoading && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                color: 'oklch(55% 0.08 285)',
                fontSize: '13px',
              }}
            >
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  border: '2px solid oklch(30% 0.06 285)',
                  borderTopColor: 'var(--accent)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              {previewSource === 'screenshot' ? 'Capturing screenshot…' : 'Uploading image…'}
            </div>
          )}

          {/* Preview image */}
          {previewUrl && !previewLoading && (
            <>
              <Image src={previewUrl} alt="Portfolio preview" fill style={{ objectFit: 'cover' }} unoptimized />
              {/* Clear + replace overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'oklch(5% 0.04 285 / 0)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: 0,
                  transition: 'opacity 0.2s, background 0.2s',
                }}
                className="group-hover:opacity-100"
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.opacity = '1';
                  (e.currentTarget as HTMLElement).style.background = 'oklch(5% 0.04 285 / 0.7)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.opacity = '0';
                  (e.currentTarget as HTMLElement).style.background = 'oklch(5% 0.04 285 / 0)';
                }}
              >
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid oklch(60% 0.06 285 / 0.6)',
                    background: 'oklch(15% 0.05 285 / 0.9)',
                    color: 'var(--foreground)',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); clearPreview(); }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid oklch(65% 0.2 15 / 0.5)',
                    background: 'oklch(15% 0.05 285 / 0.9)',
                    color: 'oklch(65% 0.2 15)',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Remove
                </button>
              </div>
            </>
          )}

          {/* Empty drop zone prompt */}
          {!previewUrl && !previewLoading && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: 'oklch(50% 0.08 285)',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span style={{ fontSize: '13px', textAlign: 'center', lineHeight: 1.5 }}>
                Upload a portfolio screenshot<br />
                <span style={{ fontSize: '12px', opacity: 0.7 }}>
                  or blur the URL field to auto-capture · PNG, JPG, WEBP · 5 MB max
                </span>
              </span>
            </div>
          )}
        </div>

        {errors.upload && <p style={errorStyle}>{errors.upload}</p>}

        {/* Manual upload button (always visible as alternative) */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={previewLoading}
          style={{
            marginTop: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: '7px',
            border: '1px solid oklch(35% 0.06 285 / 0.6)',
            background: 'transparent',
            color: 'oklch(65% 0.08 285)',
            fontSize: '13px',
            cursor: previewLoading ? 'not-allowed' : 'pointer',
            opacity: previewLoading ? 0.5 : 1,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {previewUrl ? 'Replace image' : 'Upload image'}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileInputChange}
          style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
          tabIndex={-1}
        />
      </div>

      {/* Title */}
      <div>
        <label htmlFor="proj-title" style={labelStyle}>Title</label>
        <input
          id="proj-title"
          name="title"
          type="text"
          className="underline-input"
          placeholder="My Awesome Project"
          value={form.title}
          onChange={handleChange}
          onBlur={handleBlur}
          style={{ ...inputStyle, borderBottomColor: errors.title ? 'oklch(65% 0.2 15 / 0.8)' : undefined }}
        />
        {errors.title && <p style={errorStyle}>{errors.title}</p>}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="proj-description" style={labelStyle}>Description</label>
        <textarea
          id="proj-description"
          name="description"
          rows={3}
          className="underline-input"
          placeholder="What does your project do?"
          value={form.description}
          onChange={handleChange}
          onBlur={handleBlur}
          style={{
            ...inputStyle,
            resize: 'vertical',
            borderBottomColor: errors.description ? 'oklch(65% 0.2 15 / 0.8)' : undefined,
          }}
        />
        {errors.description && <p style={errorStyle}>{errors.description}</p>}
      </div>

      {errors.submit && (
        <p style={{ fontSize: '12px', color: 'oklch(65% 0.2 15)', textAlign: 'center' }}>{errors.submit}</p>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '4px' }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          style={{
            padding: '9px 18px',
            borderRadius: '8px',
            border: '1px solid oklch(35% 0.06 285 / 0.6)',
            background: 'transparent',
            color: 'oklch(65% 0.08 285)',
            fontSize: '14px',
            cursor: 'pointer',
            opacity: submitting ? 0.5 : 1,
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || previewLoading}
          style={{
            padding: '9px 22px',
            borderRadius: '8px',
            border: '1px solid color-mix(in oklab, var(--accent) 50%, transparent)',
            background: 'linear-gradient(135deg, color-mix(in oklab, var(--secondary) 90%, transparent), color-mix(in oklab, var(--primary) 18%, transparent))',
            color: 'var(--foreground)',
            fontSize: '14px',
            fontWeight: 600,
            cursor: submitting || previewLoading ? 'not-allowed' : 'pointer',
            opacity: submitting || previewLoading ? 0.6 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {submitting ? (initialData ? 'Saving…' : 'Submitting…') : previewLoading ? 'Processing…' : (initialData ? 'Save Changes' : 'Submit Project')}
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .underline-input:focus { border-bottom-color: var(--accent) !important; }
        .underline-input::placeholder { color: oklch(45% 0.06 285); }
      `}</style>
    </form>
  );
}
