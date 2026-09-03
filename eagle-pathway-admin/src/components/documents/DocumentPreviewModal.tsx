'use client';
import { useState, useEffect } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  CheckCircle, 
  XCircle, 
  FileText, 
  User, 
  Calendar,
  AlertCircle,
  Loader2,
  ExternalLink,
  Cloud
} from 'lucide-react';
import { getFreshSignedUrl } from '@/lib/storageHelper';

export interface PreviewableDocument {
  id: string;
  user_id: string;
  document_type: string;
  file_name: string;
  file_path?: string | null;
  file_url: string;
  cloud_url?: string | null;
  text_content?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  uploaded_at: string;
  reviewer_notes?: string | null;
  user?: {
    full_name: string;
    email: string;
    phone?: string;
  };
}

interface DocumentPreviewModalProps {
  document: PreviewableDocument | null;
  onClose: () => void;
  onUpdateStatus?: (id: string, status: 'approved' | 'rejected', notes?: string) => Promise<void>;
}

export function DocumentPreviewModal({ document, onClose, onUpdateStatus }: DocumentPreviewModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState<string>(document?.file_url || '');
  const [loadingUrl, setLoadingUrl] = useState<boolean>(true);
  const [imageError, setImageError] = useState<boolean>(false);

  const isCloudLink = document?.cloud_url || 
                      document?.file_path === 'cloud_link' || 
                      document?.file_url?.includes('drive.google.com') ||
                      document?.file_url?.includes('onedrive') ||
                      document?.file_url?.includes('dropbox.com');

  const hasTextContent = Boolean(document?.text_content);

  useEffect(() => {
    let isMounted = true;
    async function resolveLiveUrl() {
      if (!document) return;
      setLoadingUrl(true);
      setImageError(false);

      if (isCloudLink || hasTextContent) {
        setResolvedUrl(document.cloud_url || document.file_url);
        setLoadingUrl(false);
        return;
      }

      const raw = document.file_path || document.file_url;
      const fresh = await getFreshSignedUrl(raw, 'documents');
      if (isMounted) {
        setResolvedUrl(fresh || document.file_url);
        setLoadingUrl(false);
      }
    }
    resolveLiveUrl();
    return () => { isMounted = false; };
  }, [document, isCloudLink, hasTextContent]);

  if (!document) return null;

  const isPdf = document.file_name?.toLowerCase().endsWith('.pdf') || 
                document.file_url?.toLowerCase().includes('.pdf');

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handleApprove = async () => {
    if (!onUpdateStatus) return;
    setActionLoading(true);
    try {
      await onUpdateStatus(document.id, 'approved');
      onClose();
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateStatus) return;
    setActionLoading(true);
    try {
      await onUpdateStatus(document.id, 'rejected', rejectReason);
      setShowRejectForm(false);
      onClose();
    } finally {
      setActionLoading(false);
    }
  };

  const formattedType = (document.document_type || 'Document')
    .replace(/_/g, ' ')
    .toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue flex-shrink-0">
              {isCloudLink ? <Cloud className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-gray-900 truncate">
                  {document.file_name}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-brand-blue/10 text-brand-blue">
                  {formattedType}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                  document.status === 'approved' 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : document.status === 'rejected'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {document.status}
                </span>
              </div>
              {document.user && (
                <div className="flex items-center space-x-3 text-xs text-gray-500 mt-0.5 truncate">
                  <span className="flex items-center font-medium text-gray-700 truncate">
                    <User className="w-3.5 h-3.5 mr-1 text-gray-400" />
                    {document.user.full_name} ({document.user.email})
                  </span>
                  <span className="flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-gray-400" />
                    {new Date(document.uploaded_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Controls & Close */}
          <div className="flex items-center space-x-2">
            {!isCloudLink && !hasTextContent && !isPdf && (
              <>
                <button
                  onClick={handleZoomOut}
                  title="Zoom Out"
                  className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold text-gray-500 w-10 text-center select-none">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  title="Zoom In"
                  className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRotate}
                  title="Rotate"
                  className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </>
            )}
            
            {(resolvedUrl || document.cloud_url) && (
              <a
                href={document.cloud_url || resolvedUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open Link in New Tab"
                className="p-2 text-gray-500 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Viewer Body */}
        <div className="flex-1 bg-slate-900/90 relative overflow-auto flex items-center justify-center p-6">
          {loadingUrl ? (
            <div className="flex flex-col items-center justify-center text-white space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-brand-gold" />
              <p className="text-xs text-gray-300">Loading document...</p>
            </div>
          ) : isCloudLink ? (
            /* Cloud Link (Google Drive / OneDrive) Display Card */
            <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-800/90 rounded-2xl max-w-lg text-white border border-slate-700 space-y-5 shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-brand-blue/20 flex items-center justify-center text-blue-400">
                <Cloud className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold">Google Drive / Cloud Dossier</h4>
                <p className="text-xs text-gray-300 mt-2 max-w-sm">
                  This student provided their credentials via a direct cloud folder or file link. Click below to inspect their full documents on Google Drive in a secure new tab.
                </p>
                <div className="mt-4 p-3 bg-slate-900/80 rounded-xl text-xs font-mono text-blue-300 break-all max-w-md border border-slate-700">
                  {document.cloud_url || resolvedUrl || document.file_url}
                </div>
              </div>
              <a
                href={document.cloud_url || resolvedUrl || document.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-brand-blue text-white rounded-xl text-sm font-bold shadow-lg hover:bg-blue-600 transition-all hover:scale-105"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Google Drive Dossier ↗
              </a>
            </div>
          ) : hasTextContent ? (
            /* Structured Text Credential / SOP Viewer */
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full text-gray-900 shadow-2xl overflow-y-auto max-h-[75vh]">
              <h4 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-brand-blue" />
                Student Credential &amp; Text Submission
              </h4>
              <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap font-sans bg-gray-50 p-4 rounded-xl border border-gray-200">
                {document.text_content}
              </div>
            </div>
          ) : isPdf ? (
            <iframe
              src={`${resolvedUrl}#toolbar=1`}
              className="w-full h-full rounded-lg border-0 bg-white shadow-lg"
              title={document.file_name}
            />
          ) : imageError ? (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-800/80 rounded-2xl max-w-md text-white border border-slate-700 space-y-4">
              <AlertCircle className="w-12 h-12 text-amber-400" />
              <div>
                <h4 className="text-base font-bold">Image Preview Unavailable</h4>
                <p className="text-xs text-gray-300 mt-1">
                  This image format cannot be displayed directly inline. You can open or download the original file below.
                </p>
              </div>
              <a
                href={resolvedUrl || document.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-brand-blue text-white rounded-xl text-xs font-bold shadow-md hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-1.5" />
                Open Original File
              </a>
            </div>
          ) : (
            <div 
              className="transition-transform duration-200 ease-out flex items-center justify-center"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolvedUrl || document.file_url}
                alt={document.file_name}
                onError={() => setImageError(true)}
                className="max-h-[70vh] max-w-[85vw] object-contain rounded shadow-2xl bg-white select-none pointer-events-none"
              />
            </div>
          )}
        </div>

        {/* Review Action Footer */}
        {onUpdateStatus && (
          <div className="p-4 bg-white border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-gray-500">
              {document.reviewer_notes ? (
                <div className="flex items-center text-rose-600 font-medium">
                  <AlertCircle className="w-4 h-4 mr-1.5 flex-shrink-0" />
                  <span>Previous Note: &ldquo;{document.reviewer_notes}&rdquo;</span>
                </div>
              ) : (
                <span>Reviewing document integrity and authenticity</span>
              )}
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
              {showRejectForm ? (
                <form onSubmit={handleReject} className="flex items-center space-x-2 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Reason for rejection (e.g. Broken link, invalid GPA)..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    required
                    className="px-3 py-2 text-xs border border-rose-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none w-64"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-colors"
                  >
                    Confirm Rejection
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRejectForm(false)}
                    className="px-2.5 py-2 text-xs text-gray-500 hover:bg-gray-100 rounded-xl"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    disabled={actionLoading}
                    className="flex items-center px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
                  >
                    <XCircle className="w-4 h-4 mr-1.5" />
                    Reject Document
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading || document.status === 'approved'}
                    className="flex items-center px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4 mr-1.5" />
                    {document.status === 'approved' ? 'Approved' : 'Approve & Verify'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
