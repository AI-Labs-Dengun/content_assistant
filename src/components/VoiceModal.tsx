import React, { useEffect } from 'react';
import { FaMicrophone, FaStop, FaTimes, FaVolumeUp, FaSpinner } from 'react-icons/fa';
import { useLanguage } from '../lib/LanguageContext';
import { useTranslation } from '../lib/i18n';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (audioBlob: Blob) => void;
  mode: 'ai-speaking' | 'ready-to-record' | 'recording' | 'thinking' | 'loading';
  onToggleRecord: () => void;
  modalRef: React.RefObject<HTMLDivElement>;
  error?: string | null;
}

const VoiceModal: React.FC<VoiceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  onToggleRecord,
  error,
}) => {
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-auth-gradient bg-opacity-90 border border-white rounded-2xl p-6 w-full max-w-md backdrop-blur-md relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">
            {mode === 'ai-speaking' ? t('voice.aiSpeaking') :
             mode === 'thinking' ? t('voice.aiThinking') :
             mode === 'loading' ? t('voice.loading') :
             mode === 'recording' ? t('voice.title') :
             t('voice.title')}
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors absolute top-6 right-6"
          >
            <FaTimes className="text-xl text-white" />
          </button>
        </div>
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center relative overflow-visible">
              {mode === 'ai-speaking' && (
                <>
                  <span className="absolute inset-0 rounded-full border-2 border-blue-400 animate-voice-wave1" />
                  <span className="absolute inset-0 rounded-full border-2 border-blue-300 animate-voice-wave2" />
                </>
              )}
              {mode === 'ai-speaking' ? (
                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center z-10">
                  <FaVolumeUp className="text-white text-2xl" />
                </div>
              ) : mode === 'thinking' ? (
                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center">
                  <FaSpinner className="text-white text-2xl animate-spin" />
                </div>
              ) : mode === 'loading' ? (
                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center">
                  <FaSpinner className="text-white text-2xl animate-spin" />
                </div>
              ) : mode === 'recording' ? (
                <div className="animate-pulse w-16 h-16 rounded-full bg-red-500 flex items-center justify-center">
                  <FaStop className="text-white text-2xl" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center">
                  <FaMicrophone className="text-white text-2xl" />
                </div>
              )}
            </div>
          </div>
          {(mode === 'ready-to-record' || mode === 'recording') && (
            <button
              onClick={onToggleRecord}
              className={`px-6 py-2 rounded bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:from-purple-700 hover:to-blue-700 transition-colors duration-200 w-auto`}
            >
              {mode === 'recording' ? t('voice.stop') : t('voice.start')}
            </button>
          )}
          {mode === 'ai-speaking' && (
            <div className="text-white/80 text-center">
              {t('voice.aiSpeaking')}
            </div>
          )}
          {mode === 'thinking' && (
            <div className="text-white/80 text-center">
              {t('voice.aiThinking')}
            </div>
          )}
          {mode === 'loading' && (
            <div className="text-white/80 text-center">
              {t('voice.loading')}
            </div>
          )}
          {error && (
            <div className="text-red-400 text-center mt-2 px-4">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceModal; 