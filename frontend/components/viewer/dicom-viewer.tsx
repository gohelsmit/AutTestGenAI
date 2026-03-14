'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    cornerstone?: {
      enable: (el: HTMLElement) => void;
      loadImage: (url: string) => Promise<unknown>;
      displayImage: (el: HTMLElement, image: unknown) => void;
      resize: (el: HTMLElement) => void;
      getDefaultViewport: (el: HTMLElement) => { windowCenter: number; windowWidth: number };
      setViewport: (el: HTMLElement, viewport: { windowCenter: number; windowWidth: number }) => void;
    };
    cornerstoneTools?: {
      addTool: (tool: unknown) => void;
      setToolActive: (name: string, options?: unknown) => void;
    };
  }
}

interface DicomViewerProps {
  imageUrl: string;
}

export default function DicomViewer({ imageUrl }: DicomViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !imageUrl) return;

    // If Cornerstone is available (via script or package), use it.
    // Otherwise show a simple image/placeholder for DICOM.
    const hasCornerstone = typeof window !== 'undefined' && window.cornerstone;
    if (hasCornerstone && window.cornerstone) {
      window.cornerstone.enable(el);
      window.cornerstone.loadImage(imageUrl).then((image) => {
        window.cornerstone!.displayImage(el, image);
        window.cornerstone!.resize(el);
      }).catch(() => {
        // Fallback: show link or message
        el.innerHTML = `<div class="flex h-full items-center justify-center text-white"><a href="${imageUrl}" target="_blank" rel="noopener" class="text-primary underline">Open DICOM</a></div>`;
      });
      return () => {
        try {
          (el as unknown as { cornerstoneElement?: unknown }).cornerstoneElement = undefined;
        } catch (_) {}
      };
    }

    // Fallback: display as download link / iframe or image if browser supports it
    el.innerHTML = `
      <div class="flex h-full min-h-[400px] flex-col items-center justify-center gap-2 rounded bg-slate-900 p-4 text-white">
        <p class="text-sm opacity-90">DICOM image loaded</p>
        <a href="${imageUrl}" target="_blank" rel="noopener" class="text-primary underline">Open in new tab</a>
        <p class="text-xs text-muted-foreground">For full viewer (zoom, pan, WL), use Cornerstone.js in browser.</p>
      </div>
    `;
    return () => {
      el.innerHTML = '';
    };
  }, [imageUrl]);

  return <div ref={containerRef} className="h-full min-h-[400px] w-full" />;
}
