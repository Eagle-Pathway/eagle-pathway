'use client';
import { useState } from 'react';
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
  AlertCircle
} from 'lucide-react';

export interface PreviewableDocument {
  id: string;
  user_id: string;
  document_type: string;
  file_name: string;
  file_path?: string | null;
  file_url: string;
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
              <FileText className="w-5 h-5" />
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
            {!isPdf && (
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
            <a
              href={document.file_url}
              download={document.file_name}
              target="_blank"
              rel="noopener noreferrer"
              title="Open / Download original"
              className="p-2 text-gray-500 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Viewer Body */}
        <div className="flex-1 bg-slate-900/90 relative overflow-auto flex items-center justify-center p-4">
          {isPdf ? (
            <iframe
              src={`${document.file_url}#toolbar=1`}
              className="w-full h-full rounded-lg border-0 bg-white shadow-lg"
              title={document.file_name}
            />
          ) : (
            <div 
              className="transition-transform duration-200 ease-out flex items-center justify-center"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={document.file_url}
                alt={document.file_name}
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
                    placeholder="Reason for rejection (e.g. Unclear scan)..."
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
