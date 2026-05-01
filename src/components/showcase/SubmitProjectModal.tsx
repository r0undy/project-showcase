'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { ProjectForm } from './ProjectForm';
import type { ProjectWithAuthor } from '@/types';

interface SubmitProjectModalProps {
  isOpen: boolean;
  isAuthenticated: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: ProjectWithAuthor | null;
}

export function SubmitProjectModal({
  isOpen,
  isAuthenticated,
  onClose,
  onSuccess,
  initialData,
}: SubmitProjectModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'oklch(5% 0.04 285 / 0.85)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="hide-scrollbar"
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'oklch(11% 0.04 285)',
          border: '1px solid oklch(40% 0.08 285 / 0.5)',
          borderRadius: '16px',
          padding: '24px',
          position: 'relative',
          boxShadow: '0 0 60px oklch(50% 0.2 300 / 0.15)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2
            id="modal-title"
            style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--foreground)' }}
          >
            {initialData ? 'Edit Project' : 'Share Your Project'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'oklch(55% 0.08 285)',
              padding: '4px',
              lineHeight: 1,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {isAuthenticated ? (
          <ProjectForm
            onSuccess={() => { onSuccess(); onClose(); }}
            onCancel={onClose}
            initialData={initialData}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                border: '1px solid oklch(40% 0.08 285 / 0.5)',
                background: 'oklch(14% 0.05 285)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="oklch(60% 0.12 285)" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <p style={{ color: 'var(--foreground)', fontWeight: 600, marginBottom: '8px' }}>
              Complete onboarding first
            </p>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '14px', marginBottom: '20px' }}>
              Set up your profile before sharing a project.
            </p>
            <Link
              href="/welcome"
              style={{
                display: 'inline-block',
                padding: '10px 24px',
                borderRadius: '8px',
                border: '1px solid color-mix(in oklab, var(--accent) 50%, transparent)',
                background: 'linear-gradient(135deg, color-mix(in oklab, var(--secondary) 90%, transparent), color-mix(in oklab, var(--primary) 18%, transparent))',
                color: 'var(--foreground)',
                fontWeight: 600,
                fontSize: '14px',
                textDecoration: 'none',
              }}
              onClick={onClose}
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
