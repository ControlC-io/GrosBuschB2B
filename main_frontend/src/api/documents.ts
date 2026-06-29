export interface DocumentSummary {
  id: string;
  filename: string;
  mimeType: string;
  fileSize: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrepareUploadResponse {
  file_path: string;
}

export interface ConfirmUploadResponse {
  ok: boolean;
  document_id: string;
}

export interface DocumentUrlResponse {
  url: string;
  filename: string;
}

const jsonHeaders = (token: string): HeadersInit => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
});

export const prepareUpload = async (
  token: string,
  payload: { filename: string; mime_type: string; file_size: number },
): Promise<PrepareUploadResponse> => {
  const res = await fetch('/api/upload/prepare', {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `Prepare failed (${res.status})`);
  }
  return res.json() as Promise<PrepareUploadResponse>;
};

export const uploadFile = async (
  token: string,
  file: File,
  filePath: string,
): Promise<void> => {
  const form = new FormData();
  form.append('file', file);
  form.append('file_path', filePath);
  form.append('mime_type', file.type || 'application/octet-stream');

  const res = await fetch('/api/upload/file', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `Upload failed (${res.status})`);
  }
};

export const confirmUpload = async (
  token: string,
  payload: { file_path: string; filename: string; mime_type: string; file_size: number },
): Promise<ConfirmUploadResponse> => {
  const res = await fetch('/api/upload/confirm', {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `Confirm failed (${res.status})`);
  }
  return res.json() as Promise<ConfirmUploadResponse>;
};

export const listDocuments = async (token: string): Promise<DocumentSummary[]> => {
  const res = await fetch('/api/documents', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `List failed (${res.status})`);
  }
  return res.json() as Promise<DocumentSummary[]>;
};

export const getDocumentUrl = async (token: string, id: string): Promise<DocumentUrlResponse> => {
  const res = await fetch(`/api/documents/${id}/url`, {
    method: 'POST',
    headers: jsonHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `URL request failed (${res.status})`);
  }
  return res.json() as Promise<DocumentUrlResponse>;
};

export const deleteDocument = async (token: string, id: string): Promise<void> => {
  const res = await fetch(`/api/documents/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `Delete failed (${res.status})`);
  }
};
