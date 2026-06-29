import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@shared/auth';
import {
  confirmUpload,
  deleteDocument,
  getDocumentUrl,
  listDocuments,
  prepareUpload,
  uploadFile,
  type DocumentSummary,
} from '../api/documents';

const ACCEPTED_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
]);
const MAX_BYTES = 50 * 1024 * 1024;

const formatBytes = (value: string): string => {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / 1024 ** index;
  return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const formatDate = (value: string): string => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const Documents = () => {
  const { t } = useTranslation('common');
  const { jwtToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    if (!jwtToken) {
      setError(t('documents.errors.noJwt'));
      setLoading(false);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const data = await listDocuments(jwtToken);
      setDocuments(data);
    } catch (err) {
      setError((err as Error).message ?? t('documents.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [jwtToken, t]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !jwtToken) return;

    if (!ACCEPTED_TYPES.has(file.type)) {
      setError(t('documents.errors.invalidType'));
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(t('documents.errors.tooLarge'));
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const { file_path } = await prepareUpload(jwtToken, {
        filename: file.name,
        mime_type: file.type,
        file_size: file.size,
      });
      await uploadFile(jwtToken, file, file_path);
      await confirmUpload(jwtToken, {
        file_path,
        filename: file.name,
        mime_type: file.type,
        file_size: file.size,
      });
      await loadDocuments();
    } catch (err) {
      setError((err as Error).message ?? t('documents.errors.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const handleOpen = async (id: string) => {
    if (!jwtToken) return;
    setActionId(id);
    setError(null);
    try {
      const { url } = await getDocumentUrl(jwtToken, id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError((err as Error).message ?? t('documents.errors.openFailed'));
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id: string, filename: string) => {
    if (!jwtToken) return;
    const confirmed = window.confirm(t('documents.confirmDelete', { name: filename }));
    if (!confirmed) return;

    setActionId(id);
    setError(null);
    try {
      await deleteDocument(jwtToken, id);
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    } catch (err) {
      setError((err as Error).message ?? t('documents.errors.deleteFailed'));
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="bg-background dark:bg-background-dark text-textPrimary dark:text-textPrimary-dark min-h-[calc(100vh-4rem)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t('documents.title')}</h1>
          <p className="text-sm text-textSecondary dark:text-textSecondary-dark">
            {t('documents.subtitle')}
          </p>
        </header>

        <section className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">{t('documents.uploadTitle')}</h2>
              <p className="text-sm text-textSecondary dark:text-textSecondary-dark">
                {t('documents.uploadHint')}
              </p>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.png,.jpg,.jpeg"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={handleUploadClick}
                disabled={uploading || !jwtToken}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {uploading ? t('documents.uploading') : t('documents.uploadButton')}
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        <section className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border dark:border-border-dark flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t('documents.listTitle')}</h2>
            <button
              type="button"
              onClick={() => void loadDocuments()}
              disabled={loading}
              className="text-sm text-primary hover:underline disabled:opacity-50"
            >
              {t('documents.refresh')}
            </button>
          </div>

          {loading ? (
            <p className="px-6 py-8 text-sm text-textSecondary dark:text-textSecondary-dark">
              {t('placeholders.loading')}
            </p>
          ) : documents.length === 0 ? (
            <p className="px-6 py-8 text-sm text-textSecondary dark:text-textSecondary-dark">
              {t('documents.empty')}
            </p>
          ) : (
            <ul className="divide-y divide-border dark:divide-border-dark">
              {documents.map((doc) => (
                <li key={doc.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{doc.filename}</p>
                    <p className="text-xs text-textSecondary dark:text-textSecondary-dark">
                      {formatBytes(doc.fileSize)} · {formatDate(doc.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => void handleOpen(doc.id)}
                      disabled={actionId === doc.id}
                      className="rounded-md border border-border dark:border-border-dark px-3 py-1.5 text-sm hover:bg-background dark:hover:bg-background-dark disabled:opacity-50"
                    >
                      {actionId === doc.id ? t('documents.opening') : t('documents.open')}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(doc.id, doc.filename)}
                      disabled={actionId === doc.id}
                      className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950 disabled:opacity-50"
                    >
                      {t('documents.delete')}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default Documents;
