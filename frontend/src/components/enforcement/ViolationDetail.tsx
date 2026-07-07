'use client';

import { Violation } from './ViolationList';

interface ViolationDetailProps {
  violation: Violation | null;
  onClose: () => void;
  onAction: (id: string, action: 'fine' | 'dismiss' | 'warn') => void;
}

export default function ViolationDetail({ violation, onClose, onAction }: ViolationDetailProps) {
  if (!violation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-sp-bg-2 rounded-2xl shadow-xl w-full max-w-md mx-4 animate-fade-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-sp-text-1">Violation Details</h3>
            <p className="text-xs text-sp-text-3">Spot {violation.spotId}</p>
          </div>
          <button onClick={onClose} className="text-sp-text-3 hover:text-sp-text-1 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-sp-text-3 block mb-0.5">Zone</span>
              <span className="font-medium text-sp-text-1">Zone {violation.zone}</span>
            </div>
            <div>
              <span className="text-sp-text-3 block mb-0.5">Occupied Since</span>
              <span className="font-medium text-sp-text-1">{violation.timeParked}</span>
            </div>
            <div>
              <span className="text-sp-text-3 block mb-0.5">Duration Unpaid</span>
              <span className="font-bold text-sp-red">{violation.durationUnpaid} minutes</span>
            </div>
            <div>
              <span className="text-sp-text-3 block mb-0.5">Payment Status</span>
              <span className="font-medium text-sp-red">No active session found in Parkin</span>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs font-medium text-amber-800">Recommended Action</p>
            <p className="text-xs text-amber-700 mt-0.5">
              {violation.durationUnpaid > 15
                ? 'Issue AED 150 fine — exceeded 15 minute grace period'
                : 'Send warning notification — within extended grace window'}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-sp-text-3 bg-gray-50 rounded-lg p-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <span>Plate detection: Coming soon</span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
          <button
            onClick={() => onAction(violation.id, 'fine')}
            className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors"
          >
            Issue Fine (AED 150)
          </button>
          <button
            onClick={() => onAction(violation.id, 'warn')}
            className="flex-1 px-3 py-2 bg-amber-400 text-amber-900 rounded-lg text-xs font-medium hover:bg-amber-500 transition-colors"
          >
            Send Warning
          </button>
          <button
            onClick={() => onAction(violation.id, 'dismiss')}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-300 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
