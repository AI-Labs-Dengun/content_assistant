import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { useLanguage } from '../lib/LanguageContext';
import { useTranslation } from '../lib/i18n';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (comment: string) => void;
  message?: { id: string; content: string };
}

const CommentModal: React.FC<CommentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  message,
}) => {
  const [comment, setComment] = useState('');
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      onSubmit(comment);
      setComment('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 w-full max-w-md relative">
        <button
          className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl"
          onClick={onClose}
        >
          <FaTimes className="text-xl text-gray-500 dark:text-gray-400" />
        </button>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          {t('chat.addComment')}
        </h2>
        <div className="mb-4 p-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm">
          {message?.content}
        </div>
        <form onSubmit={handleSubmit}>
          <textarea
            className="w-full min-h-[80px] rounded-lg p-3 bg-white dark:bg-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none border border-gray-200 dark:border-gray-600 mb-4 resize-none"
            placeholder={t('chat.writeComment')}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              className="px-4 py-2 rounded text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              onClick={onClose}
            >
              {t('common.cancel')}
            </button>
            <button
              className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white font-semibold disabled:opacity-40"
              type="submit"
              disabled={!comment.trim()}
            >
              {t('chat.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommentModal; 