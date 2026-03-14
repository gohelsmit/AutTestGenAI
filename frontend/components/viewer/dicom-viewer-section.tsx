'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Upload, ImageIcon } from 'lucide-react';
import dynamic from 'next/dynamic';

const DicomViewer = dynamic(() => import('@/components/viewer/dicom-viewer'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] items-center justify-center rounded border bg-muted/30">
      <span className="text-muted-foreground">Loading viewer...</span>
    </div>
  ),
});

type ImageRow = { id: string; storage_path: string; instance_number: number | null };

export function DicomViewerSection({
  studyId,
  images,
  showUpload = true,
}: {
  studyId: string;
  images: ImageRow[];
  showUpload?: boolean;
}) {
  const [selectedImageId, setSelectedImageId] = useState<string | null>(images[0]?.id ?? null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  // Load signed URLs for viewer
  useEffect(() => {
    if (images.length === 0) return;
    let cancelled = false;
    (async () => {
      const urls: Record<string, string> = {};
      for (const img of images) {
        const { data } = await supabase.storage
          .from('dicom-files')
          .createSignedUrl(img.storage_path, 3600);
        if (!cancelled && data?.signedUrl) urls[img.id] = data.signedUrl;
      }
      if (!cancelled) setImageUrls(urls);
    })();
    return () => { cancelled = true; };
  }, [studyId, images.length, images.map((i) => i.id).join(',')]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const path = `${studyId}/${file.name}`;
      const { error } = await supabase.storage.from('dicom-files').upload(path, file, {
        contentType: 'application/dicom',
        upsert: true,
      });
      if (error) {
        toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
        break;
      }
      const { error: insertErr } = await supabase.from('images').insert({
        study_id: studyId,
        storage_path: path,
        metadata: {},
      });
      if (insertErr) toast({ title: 'DB error', description: insertErr.message, variant: 'destructive' });
    }
    setUploading(false);
    toast({ title: 'Upload complete' });
    window.location.reload();
  }

  const selectedImage = images.find((i) => i.id === selectedImageId);
  const selectedUrl = selectedImageId ? imageUrls[selectedImageId] : null;

  return (
    <div className="space-y-4">
      {showUpload && (
        <div className="flex flex-wrap items-center gap-2">
          <label>
            <input
              type="file"
              accept=".dcm,application/dicom"
              multiple
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <Button type="button" variant="outline" className="gap-2" asChild>
              <span>
                <Upload className="h-4 w-4" />
              {uploading ? 'Uploading...' : 'Upload DICOM'}
            </span>
          </Button>
        </label>
      </div>
      )}
      {images.length > 0 ? (
        <>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {images.map((img, idx) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setSelectedImageId(img.id)}
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded border text-xs ${
                  selectedImageId === img.id ? 'border-primary bg-primary/10' : 'border-border'
                }`}
              >
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </button>
            ))}
          </div>
          <div className="cornerstone-viewport min-h-[400px] rounded border bg-black/5">
            {selectedUrl ? (
              <DicomViewer imageUrl={selectedUrl} />
            ) : (
              <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                Loading image...
              </div>
            )}
          </div>
        </>
      ) : showUpload ? (
        <div className="flex h-[300px] flex-col items-center justify-center rounded border border-dashed bg-muted/20 text-muted-foreground">
          <Upload className="mb-2 h-10 w-10" />
          <p className="mb-4">No DICOM images yet. Upload to get started.</p>
          <label>
            <input
              type="file"
              accept=".dcm,application/dicom"
              multiple
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <Button type="button" variant="outline" asChild>
              <span>Upload DICOM</span>
            </Button>
          </label>
        </div>
      ) : (
        <div className="flex h-[300px] flex-col items-center justify-center rounded border border-dashed bg-muted/20 text-muted-foreground">
          <p>No DICOM images for this study.</p>
        </div>
      )}
    </div>
  );
}

