import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useSubmitReport } from '../../hooks/useReport';
import { useNotification } from '../../context/NotificationContext';

export const ReportModal = ({ isOpen, onClose, reportedUserId, reportedProjectId, title }) => {
  const [reason, setReason] = useState('Spam');
  const [description, setDescription] = useState('');
  
  const submitReportMutation = useSubmitReport();
  const { addToast } = useNotification();

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    submitReportMutation.mutate(
      { reportedUser: reportedUserId, reportedProject: reportedProjectId, reason, description },
      {
        onSuccess: () => {
          addToast('Report submitted successfully.', 'success');
          setReason('Spam');
          setDescription('');
          onClose();
        },
        onError: (err) => {
          addToast(err.response?.data?.message || 'Failed to submit report', 'error');
        }
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-surface-200 bg-red-50/50">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="text-lg font-bold">Report {title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-surface-400 hover:text-surface-700 hover:bg-surface-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-surface-900 mb-1.5">
              Reason for Report
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-surface-50 border border-surface-200 text-surface-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            >
              <option value="Spam">Spam</option>
              <option value="Harassment">Harassment</option>
              <option value="Inappropriate Content">Inappropriate Content</option>
              <option value="Scam/Fraud">Scam / Fraud</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-900 mb-1.5">
              Additional Details (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more context to help us review this report..."
              className="w-full bg-surface-50 border border-surface-200 text-surface-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 min-h-[100px] resize-y"
              maxLength={1000}
            />
            <p className="text-xs text-surface-500 mt-1">
              Your report will be reviewed by our moderation team.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-surface-700 hover:bg-surface-100 rounded-lg transition-colors"
              disabled={submitReportMutation.isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitReportMutation.isLoading}
              className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {submitReportMutation.isLoading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
