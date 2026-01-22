//keel-web/src/components/common/DeleteConfirmationModal.tsx

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
  isDeleting?: boolean;
  isDeleteAll?: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Item",
  description = "Are you sure you want to delete this item? This action cannot be undone.",
  itemName,
  isDeleting = false,
  isDeleteAll = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      {/* 1. Glassmorphic Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-300"
        onClick={!isDeleting ? onClose : undefined}
      />

      {/* 2. Modal Card */}
      <div className="relative w-full max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 ring-1 ring-black/5">
        
        {/* Decorative Top Gradient */}
        <div className={`h-1.5 w-full ${isDeleteAll ? 'bg-linear-to-r from-red-600 via-orange-500 to-red-600' : 'bg-linear-to-r from-red-500 to-pink-500'}`} />

        <div className="p-6">
          <div className="flex gap-4">
            {/* Icon Container */}
            <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${isDeleteAll ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400'} border border-red-100 dark:border-red-900/50 shadow-sm`}>
              {isDeleteAll ? <AlertTriangle size={24} strokeWidth={2.5} /> : <Trash2 size={24} />}
            </div>

            {/* Content */}
            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  {title}
                </h3>
                <button 
                  onClick={onClose}
                  disabled={isDeleting}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                >
                  <X size={18} />
                </button>
              </div>
              
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {description}
              </p>
              
              {itemName && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-100 dark:border-red-900/50 flex items-center gap-2 text-sm font-mono text-red-700 dark:text-red-300 font-bold break-all">
                  {isDeleteAll ? (
                    <span className="flex items-center gap-2"><AlertTriangle size={14}/> ALL DATA WILL BE LOST</span>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"/> {itemName}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-8">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className={`
                px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg shadow-red-500/20 
                flex items-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed
                ${isDeleteAll 
                  ? 'bg-linear-to-r from-red-600 to-orange-600 hover:brightness-110' 
                  : 'bg-red-500 hover:bg-red-600'
                }
              `}
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  <span>{isDeleteAll ? 'Confirm Delete All' : 'Delete'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;