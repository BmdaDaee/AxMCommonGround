import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../lib/api';

export default function VaultPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: '', description: '', kind: 'MOMENT' });
  const [files, setFiles] = useState([]);
  const vaultQuery = useQuery({ queryKey: ['vault'], queryFn: () => api('/vault') });

  useEffect(() => () => {
    files.forEach((file) => {
      if (file.previewUrl) URL.revokeObjectURL(file.previewUrl);
    });
  }, [files]);

  const previews = useMemo(
    () => files.map((file) => ({ ...file, previewUrl: file.previewUrl || URL.createObjectURL(file) })),
    [files],
  );

  const createMemory = useMutation({
    mutationFn: async () => {
      const body = new FormData();
      body.append('title', form.title);
      body.append('description', form.description);
      body.append('kind', form.kind);
      files.forEach((file) => body.append('files', file));
      return api('/vault', { method: 'POST', body });
    },
    onSuccess: () => {
      setForm({ title: '', description: '', kind: 'MOMENT' });
      setFiles([]);
      queryClient.invalidateQueries({ queryKey: ['vault'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Memory added to the vault.');
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <section className="page-stack">
      <div className="page-header">
        <p className="eyebrow" data-testid="vault-page-eyebrow">DeeplyUs vault</p>
        <h2 data-testid="vault-page-title">Keep the parts of the relationship worth revisiting.</h2>
      </div>

      <div className="split-layout">
        <article className="composer" data-testid="vault-upload-form-card">
          <input className="field" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Memory title" data-testid="vault-title-input" />
          <select className="select" value={form.kind} onChange={(event) => setForm((current) => ({ ...current, kind: event.target.value }))} data-testid="vault-kind-select">
            <option value="MOMENT">Moment</option>
            <option value="LETTER">Letter</option>
            <option value="MILESTONE">Milestone</option>
            <option value="RECAP">Recap</option>
          </select>
          <textarea className="textarea" rows={5} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="What happened here, and why is it worth keeping?" data-testid="vault-description-input" />
          <label className="upload-dropzone" data-testid="vault-file-picker-label">
            <span>Upload photos or audio for this memory</span>
            <input
              type="file"
              accept="image/*,audio/*"
              multiple
              onChange={(event) => setFiles(Array.from(event.target.files || []).map((file) => Object.assign(file, { previewUrl: URL.createObjectURL(file) })))}
              data-testid="vault-file-input"
            />
          </label>
          {previews.length > 0 && (
            <div className="vault-media-grid" data-testid="vault-upload-preview-grid">
              {previews.map((preview) => (
                <div className="vault-media-card" key={`${preview.name}-${preview.previewUrl}`} data-testid={`vault-preview-${preview.name}`}>
                  {String(preview.type || '').startsWith('audio/') ? <audio controls src={preview.previewUrl} data-testid={`vault-preview-audio-${preview.name}`} /> : <img src={preview.previewUrl} alt={preview.name} data-testid={`vault-preview-image-${preview.name}`} />}
                  <span>{preview.name}</span>
                </div>
              ))}
            </div>
          )}
          <button className="button button-primary" onClick={() => createMemory.mutate()} disabled={!form.title.trim() || createMemory.isPending || (!files.length && !form.description.trim())} data-testid="vault-save-button">
            {createMemory.isPending ? 'Saving…' : 'Save memory'}
          </button>
        </article>

        <article className="panel page-stack" data-testid="vault-guidance-card">
          <p className="eyebrow">Media-supported memories</p>
          <h3 className="section-title">Photos and voice notes can live next to the story.</h3>
          <p className="page-subtitle">Every saved memory stays in your shared vault with context, date, creator, and attached media so the relationship has a place to remember itself.</p>
        </article>
      </div>

      <div className="grid-two">
        {(vaultQuery.data?.items || []).map((item) => (
          <article key={item.id} className="vault-card" data-testid={`vault-entry-${item.id}`}>
            <div className="chip-row">
              <span className="chip" data-testid={`vault-entry-kind-${item.id}`}>{item.kind}</span>
              <span className="chip" data-testid={`vault-entry-date-${item.id}`}>{new Date(item.date).toLocaleDateString()}</span>
            </div>
            <h3 className="section-title" data-testid={`vault-entry-title-${item.id}`}>{item.title}</h3>
            <p className="page-subtitle" data-testid={`vault-entry-description-${item.id}`}>{item.description}</p>
            {item.createdByName && <p className="muted-copy" data-testid={`vault-entry-author-${item.id}`}>Added by {item.createdByName}</p>}
            {Boolean(item.media?.length) && (
              <div className="vault-media-grid" data-testid={`vault-entry-media-grid-${item.id}`}>
                {item.media.map((media) => (
                  <div className="vault-media-card" key={media.id} data-testid={`vault-entry-media-${media.id}`}>
                    {String(media.contentType).startsWith('audio/') ? <audio controls src={media.url} data-testid={`vault-entry-audio-${media.id}`} /> : <img src={media.url} alt={media.name} data-testid={`vault-entry-image-${media.id}`} />}
                    <span>{media.name}</span>
                  </div>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}