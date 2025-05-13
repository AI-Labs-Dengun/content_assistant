"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaRobot, FaUserCircle, FaRegThumbsUp, FaRegThumbsDown, FaRegCommentDots, FaVolumeUp, FaPaperPlane, FaRegSmile, FaMicrophone, FaCog, FaSignOutAlt, FaPause, FaPlay } from 'react-icons/fa';
import { useSupabase } from '../providers/SupabaseProvider';
import { useTheme } from '../providers/ThemeProvider';
import { useLanguage } from '../../lib/LanguageContext';
import { useTranslation, Language } from '../../lib/i18n';
import TypewriterEffect from '../../components/TypewriterEffect';
import CommentModal from '../../components/CommentModal';
import VoiceModal from '../../components/VoiceModal';
import dynamic from 'next/dynamic';
import data from '@emoji-mart/data';
import ReactModal from 'react-modal';
import { Toaster } from 'react-hot-toast';


const Modal: any = ReactModal;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ReactMarkdown = require('react-markdown').default;

const EmojiPicker = dynamic(() => import('@emoji-mart/react'), {
  ssr: false
});

interface Message {
  id: string;
  content: string;
  user: 'me' | 'bot';
  created_at: string;
  image?: string;
}

const languageNames: Record<string, string> = {
  'pt': 'Portuguese',
  'en': 'English',
  'es': 'Spanish'
};

const ChatComponent = () => {
  const { user, signOut } = useSupabase();
  const { dark, toggleTheme } = useTheme();
  const { language } = useLanguage();
  const { t } = useTranslation(language as Language);
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const [feedback, setFeedback] = useState<Record<string, 'like' | 'dislike' | undefined>>({});
  const [commentModal, setCommentModal] = useState<{ open: boolean, message?: { id: string, content: string } }>({ open: false });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [voiceMode, setVoiceMode] = useState<'idle' | 'recording' | 'ai-speaking'>('idle');
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const [voiceModalMode, setVoiceModalMode] = useState<'ai-speaking' | 'ready-to-record' | 'recording' | 'thinking' | 'loading'>('ai-speaking');
  const [greetingLoading, setGreetingLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [userScrolled, setUserScrolled] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const [isTypewriterActive, setIsTypewriterActive] = useState(false);
  const [ttsLoadingMsgId, setTtsLoadingMsgId] = useState<string | null>(null);
  const [tooltips, setTooltips] = useState<string[]>([]);
  const [showTooltips, setShowTooltips] = useState(true);
  const [showTooltipsModal, setShowTooltipsModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [postTopic, setPostTopic] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDescription, setImageDescription] = useState<string | null>(null);
  const [imageText, setImageText] = useState('');
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const [currentAudioId, setCurrentAudioId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioProgressInterval = useRef<NodeJS.Timeout | null>(null);
  const voiceModalRef = useRef<HTMLDivElement>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);


  const handleScroll = () => {
    const el = chatContainerRef.current;
    if (!el) return;

    const threshold = 100;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;

    // Se o usuário rolar para cima, desative o auto-scroll
    if (!atBottom) {
      setShouldAutoScroll(false);
      setUserScrolled(true);
    }

    // Se o usuário rolar até o final, reative o auto-scroll
    if (atBottom) {
      setShouldAutoScroll(true);
      setUserScrolled(false);
    }

    setIsNearBottom(atBottom);
  };

  // Efeito para scroll automático apenas quando necessário
  useEffect(() => {
    if (shouldAutoScroll && messages.length > 0 && !userScrolled) {
      const timeoutId = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [messages, shouldAutoScroll, userScrolled]);

  // Efeito para o typewriter
  useEffect(() => {
    if (isTypewriterActive && shouldAutoScroll && !userScrolled) {
      const interval = setInterval(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isTypewriterActive, shouldAutoScroll, userScrolled]);

  // Adicione um botão de scroll para baixo quando não estiver no final
  const scrollToBottom = () => {
    setShouldAutoScroll(true);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    if (!user) {
      router.push('/sign-in');
    }
  }, [user, router]);

  React.useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].user === 'bot' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [messages]);

  const resetConversationState = () => {
    setSelectedPlatform(null);
    setPostTopic(null);
  };

  useEffect(() => {
    if (messages.length === 0) {
      resetConversationState();
      setGreetingLoading(true);
      (async () => {
        try {
          const [instructionsRes, knowledgeRes] = await Promise.all([
            fetch('/AI_INSTRUCTIONS.md'),
            fetch('/AI_KNOWLEDGE.md'),
          ]);
          const instructionsText = await instructionsRes.text();
          const knowledgeText = await knowledgeRes.text();
          const greetingPrompt = `Generate a creative, warm, and original greeting for a new user in ${language}. Use the INSTRUCTIONS to define the tone and style of the message. The greeting should be professional and welcoming, introducing yourself as a social media content assistant that can help generate posts for Instagram, LinkedIn, or Facebook. Keep your answer very short (1-2 sentences).`;
          const res = await fetch('/api/chatgpt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: greetingPrompt, language }),
          });
          const data = await res.json();
          setMessages([
            {
              id: 'welcome',
              content: data.reply && data.reply.trim() ? data.reply : t('chat.greeting'),
              user: 'bot',
              created_at: new Date().toISOString(),
            },
          ]);
        } catch (err) {
          setMessages([
            {
              id: 'welcome',
              content: t('chat.greeting'),
              user: 'bot',
              created_at: new Date().toISOString(),
            },
          ]);
        } finally {
          setGreetingLoading(false);
        }
      })();
    }
  }, [language]);

  useEffect(() => {
    if (messages.length === 0) {
      let allTooltips: string[] = [];
      const tt = t('chat.tooltips');
      if (Array.isArray(tt)) {
        allTooltips = tt;
      }
      const shuffled = [...allTooltips].sort(() => 0.5 - Math.random());
      setTooltips(shuffled.slice(0, 4));
      setShowTooltips(true);
    }
  }, [language, messages.length]);

  const handleFirstInteraction = () => {
    if (showTooltips) setShowTooltips(false);
  };

  const playTTS = async (text: string, messageId: string, onEnd?: () => void) => {
    if (typeof window === 'undefined') return;

    if (currentAudioId === messageId && isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
        if (audioProgressInterval.current) {
          clearInterval(audioProgressInterval.current);
        }
      }
      return;
    }

    if (currentAudioId === messageId && !isPlaying && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      audioProgressInterval.current = setInterval(() => {
        if (audioRef.current) {
          const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
          setAudioProgress(progress);
        }
      }, 100);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      if (audioProgressInterval.current) {
        clearInterval(audioProgressInterval.current);
      }
    }

    setCurrentAudioId(messageId);
    setTtsLoadingMsgId(messageId);

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error('TTS failed');
      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsPlaying(true);
        if (!audioProgressInterval.current) {
          setAudioProgress(0);
        }
        setTtsLoadingMsgId(null);
        audioProgressInterval.current = setInterval(() => {
          if (audioRef.current) {
            const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
            setAudioProgress(progress);
          }
        }, 100);
      };

      audio.onpause = () => {
        setIsPlaying(false);
        if (audioProgressInterval.current) {
          clearInterval(audioProgressInterval.current);
          audioProgressInterval.current = null;
        }
      };

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentAudioId(null);
        setAudioProgress(0);
        setTtsLoadingMsgId(null);
        if (audioProgressInterval.current) {
          clearInterval(audioProgressInterval.current);
          audioProgressInterval.current = null;
        }
        if (onEnd) onEnd();
      };

      audio.play();
    } catch (err) {
      console.error('TTS error:', err);
      setCurrentAudioId(null);
      setIsPlaying(false);
      setTtsLoadingMsgId(null);
      if (onEnd) onEnd();
    }
  };

  const speakBotMessage = async (text: string) => {
    if (typeof window === 'undefined') return;
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error('TTS failed');
      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.play();
    } catch (err) {
      console.error('TTS error:', err);
    }
  };

  const extractPlatform = (text: string): string | null => {
    const platforms = ['instagram', 'linkedin', 'facebook'];
    const lower = text.toLowerCase();
    // Primeiro, procura por menções diretas à plataforma
    const directMatch = platforms.find((p) => lower.includes(p));
    if (directMatch) return directMatch;

    // Se não encontrar menção direta, procura por variações comuns
    const variations: Record<string, string[]> = {
      'linkedin': ['linkedin', 'linked in', 'linked-in'],
      'instagram': ['instagram', 'insta', 'ig'],
      'facebook': ['facebook', 'fb', 'face']
    };

    for (const [platform, vars] of Object.entries(variations)) {
      if (vars.some(v => lower.includes(v))) return platform;
    }

    return null;
  };

  const extractTopic = (text: string, platform: string | null): string | null => {
    if (!text) return null;
    let topic = text;

    // Remove menções à plataforma
    if (platform) {
      const variations = {
        'linkedin': ['linkedin', 'linked in', 'linked-in'],
        'instagram': ['instagram', 'insta', 'ig'],
        'facebook': ['facebook', 'fb', 'face']
      };
      const platformVars = variations[platform as keyof typeof variations] || [platform];
      platformVars.forEach(p => {
        topic = topic.replace(new RegExp(p, 'i'), '').trim();
      });
    }

    // Remove palavras comuns de comando
    const commandWords = [
      'escreva', 'escreve', 'write', 'crie', 'create', 'haz', 'fais', 'erstelle',
      'schreibe', 'make', 'generate', 'génère', 'genera', 'criar', 'ajuda', 'help',
      'sobre', 'about', 'para', 'for', 'pour', 'für', 'post', 'postar', 'publicar',
      'publish', 'share', 'compartilhar'
    ];

    commandWords.forEach(word => {
      topic = topic.replace(new RegExp(`^${word}\\s*`, 'i'), '').trim();
    });

    if (topic.length > 2) return topic;
    return null;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    handleFirstInteraction();
    if (!newMessage.trim() || !user) return;
    const userMsg: Message = {
      id: 'user-' + Date.now(),
      content: newMessage,
      user: 'me',
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setNewMessage('');
    setLoading(true);

    let platform = selectedPlatform || extractPlatform(newMessage);
    let topic = postTopic;
    if (!platform) {
      setSelectedPlatform(null);
    } else {
      setSelectedPlatform(platform);
    }

    const extractedTopic = extractTopic(newMessage, platform);
    if (platform && extractedTopic) {
      topic = extractedTopic;
      setPostTopic(topic);
    }

    if (imageDescription && platform && (!topic || topic === imageDescription) && (!newMessage.trim() || extractPlatform(newMessage))) {
      topic = imageDescription;
      setPostTopic(topic);
      const prompt = `You are a friendly, expert social media content assistant. Your main focus is to help the user specify the social media platform (Instagram, LinkedIn, or Facebook) and the content/topic for their post. Guide the user to provide both, but do so naturally and contextually in the flow of conversation. If the user is asking a question, discussing strategy, or just chatting, answer helpfully and conversationally. Only generate a complete, ready-to-use post for ${platform} about "${topic}" if the user clearly requests it or if the context makes it appropriate and both platform and topic are clear. When generating a post, use best practices for formatting, tone, hashtags, and calls-to-action. If you have extra recommendations (such as best time to post, engagement tips, or suggestions), send them as a second, separate message starting with 'Tips:'. Do not greet the user except at the very start of a new chat. Otherwise, keep the conversation natural and helpful.`;
      const openaiMessages = [
        { role: 'system', content: prompt },
        ...messages.map((msg) => ({
          role: msg.user === 'me' ? 'user' : 'assistant',
          content: msg.content
        })),
        { role: 'user', content: `The user uploaded an image. Here is the description: "${imageDescription}". Use this as the topic/content for the post.` },
        { role: 'user', content: newMessage }
      ];
      try {
        const res = await fetch('/api/chatgpt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: openaiMessages, language }),
        });
        const data = await res.json();
        if (data.reply && data.reply.includes('Tips:')) {
          const [mainPost, ...tipsParts] = data.reply.split('Tips:');
          setMessages((prev) => [
            ...prev,
            {
              id: 'bot-' + Date.now(),
              content: mainPost.trim(),
              user: 'bot',
              created_at: new Date().toISOString(),
            },
            {
              id: 'bot-' + (Date.now() + 1),
              content: 'Tips:' + tipsParts.join('Tips:').trim(),
              user: 'bot',
              created_at: new Date(Date.now() + 1).toISOString(),
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: 'bot-' + Date.now(),
              content: data.reply || t('chat.fallback'),
              user: 'bot',
              created_at: new Date().toISOString(),
            },
          ]);
        }
        setImageDescription(null);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: 'bot-error-' + Date.now(),
            content: t('common.error'),
            user: 'bot',
            created_at: new Date().toISOString(),
          },
        ]);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (platform && topic) {
      const prompt = `You are a friendly, expert social media content assistant. Your main focus is to help the user specify the social media platform (Instagram, LinkedIn, or Facebook) and the content/topic for their post. Guide the user to provide both, but do so naturally and contextually in the flow of conversation. If the user is asking a question, discussing strategy, or just chatting, answer helpfully and conversationally. Only generate a complete, ready-to-use post for ${platform} about "${topic}" if the user clearly requests it or if the context makes it appropriate and both platform and topic are clear. When generating a post, use best practices for formatting, tone, hashtags, and calls-to-action. If you have extra recommendations (such as best time to post, engagement tips, or suggestions), send them as a second, separate message starting with 'Tips:'. Do not greet the user except at the very start of a new chat. Otherwise, keep the conversation natural and helpful.`;
      const openaiMessages = [
        { role: 'system', content: prompt },
        ...messages.map((msg) => ({
          role: msg.user === 'me' ? 'user' : 'assistant',
          content: msg.content
        })),
        { role: 'user', content: newMessage }
      ];
      try {
        const res = await fetch('/api/chatgpt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: openaiMessages, language }),
        });
        const data = await res.json();
        if (data.reply && data.reply.includes('Tips:')) {
          const [mainPost, ...tipsParts] = data.reply.split('Tips:');
          setMessages((prev) => [
            ...prev,
            {
              id: 'bot-' + Date.now(),
              content: mainPost.trim(),
              user: 'bot',
              created_at: new Date().toISOString(),
            },
            {
              id: 'bot-' + (Date.now() + 1),
              content: 'Tips:' + tipsParts.join('Tips:').trim(),
              user: 'bot',
              created_at: new Date(Date.now() + 1).toISOString(),
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: 'bot-' + Date.now(),
              content: data.reply || t('chat.fallback'),
              user: 'bot',
              created_at: new Date().toISOString(),
            },
          ]);
        }
        setImageDescription(null);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: 'bot-error-' + Date.now(),
            content: t('common.error'),
            user: 'bot',
            created_at: new Date().toISOString(),
          },
        ]);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (platform && !topic) {
      setSelectedPlatform(platform);
      setPostTopic(null);
      if (!extractedTopic) {
        const followupPrompt = `The user wants to create a post for ${platform}. Ask them in a friendly, creative, and context-aware way what topic or content they want to post about. Respond only with your question.`;
        try {
          const res = await fetch('/api/chatgpt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: followupPrompt, language }),
          });
          const data = await res.json();
          setMessages((prev) => [
            ...prev,
            {
              id: 'bot-' + Date.now(),
              content: data.reply || t('chat.fallback'),
              user: 'bot',
              created_at: new Date().toISOString(),
            },
          ]);
        } catch (err) {
          setMessages((prev) => [
            ...prev,
            {
              id: 'bot-error-' + Date.now(),
              content: t('common.error'),
              user: 'bot',
              created_at: new Date().toISOString(),
            },
          ]);
        } finally {
          setLoading(false);
        }
      }
      return;
    }

    if (!platform && newMessage.trim()) {
      setPostTopic(newMessage);
      const followupPrompt = `The user wants to create a post about "${newMessage}". Ask them in a friendly, creative, and context-aware way which social media platform they want to use (Instagram, LinkedIn, or Facebook). Respond only with your question.`;
      try {
        const res = await fetch('/api/chatgpt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: followupPrompt, language }),
        });
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: 'bot-' + Date.now(),
            content: data.reply || t('chat.fallback'),
            user: 'bot',
            created_at: new Date().toISOString(),
          },
        ]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: 'bot-error-' + Date.now(),
            content: t('common.error'),
            user: 'bot',
            created_at: new Date().toISOString(),
          },
        ]);
      } finally {
        setLoading(false);
      }
      return;
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/sign-in');
  };

  const handleFeedback = async (messageId: string, type: 'like' | 'dislike', content: string) => {
    setFeedback((prev) => ({
      ...prev,
      [messageId]: prev[messageId] === type ? undefined : type,
    }));
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, type, content }),
      });
    } catch (e) { }
  };

  const speak = (text: string) => {
    if (typeof window === 'undefined') return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new window.SpeechSynthesisUtterance(text);
      utter.lang = 'pt-PT';
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v =>
        v.lang?.toLowerCase().startsWith('pt') &&
        (v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('microsoft'))
      );
      const fallback = voices.find(v => v.lang?.toLowerCase().startsWith('pt'));
      utter.voice = preferred || fallback || null;
      window.speechSynthesis.speak(utter);
    }
  };

  const handleComment = async (messageId: string, content: string, comment: string) => {
    try {
      await fetch('/api/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, content, comment }),
      });
      await fetch('/api/chatgpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: comment }),
      });
    } catch (e) { }
  };

  const insertEmoji = (emoji: string) => {
    if (!inputRef.current) return;
    const input = inputRef.current;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const newValue = newMessage.slice(0, start) + emoji + newMessage.slice(end);
    setNewMessage(newValue);
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  const handleToggleRecord = () => {
    handleFirstInteraction();
    if (voiceModalMode === 'ready-to-record') {
      startRecording();
    } else if (voiceModalMode === 'recording') {
      stopRecording();
    }
  };

  const startRecording = async () => {
    console.log('startRecording called');
    if (typeof window === 'undefined') return;
    try {
      setVoiceError(null);
      setVoiceModalMode('recording');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('Recording stopped, processing audio...');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        handleAudioSubmit(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
    } catch (err) {
      console.error('Recording error:', err);
      setVoiceModalMode('ready-to-record');
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setVoiceError('Permissão para usar o microfone foi negada. Por favor, permita o acesso ao microfone nas configurações do seu navegador.');
        } else {
          setVoiceError('Erro ao acessar o microfone. Por favor, verifique se seu dispositivo tem um microfone e se as permissões estão corretas.');
        }
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      setVoiceModalMode('thinking');
      mediaRecorderRef.current.stop();
    }
  };

  const handleVoiceModalClose = () => {
    setVoiceModalOpen(false);
    setVoiceModalMode('ai-speaking');
    setVoiceMode('idle');
    setVoiceError(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleAudioSubmit = async (audioBlob: Blob) => {
    setVoiceModalMode('thinking');
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.wav');
      formData.append('language', language);
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.text) {
        const userMsg = {
          id: 'user-' + Date.now(),
          content: data.text,
          user: 'me' as 'me',
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMsg]);
        setLoading(true);
        try {
          const res = await fetch('/api/chatgpt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: data.text, language }),
          });
          const aiData = await res.json();
          setMessages((prev) => [
            ...prev,
            {
              id: 'bot-' + Date.now(),
              content: aiData.reply || 'Desculpe, não consegui responder agora.',
              user: 'bot',
              created_at: new Date().toISOString(),
            },
          ]);
          if (aiData.reply) {
            playTTS(aiData.reply, 'bot-' + Date.now(), () => {
              setVoiceModalOpen(false);
              setVoiceModalMode('ready-to-record');
            });
          } else {
            setVoiceModalOpen(false);
            setVoiceModalMode('ready-to-record');
          }
        } catch (err) {
          setMessages((prev) => [
            ...prev,
            {
              id: 'bot-error-' + Date.now(),
              content: 'Erro ao conectar ao ChatGPT.',
              user: 'bot',
              created_at: new Date().toISOString(),
            },
          ]);
          setVoiceModalOpen(false);
          setVoiceModalMode('ready-to-record');
        } finally {
          setLoading(false);
        }
      } else {
        setVoiceModalOpen(false);
        setVoiceModalMode('ready-to-record');
      }
    } catch (err) {
      console.error('Transcription error:', err);
      setVoiceModalOpen(false);
      setVoiceModalMode('ready-to-record');
    }
  };

  const handlePaperclipClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleImageButtonClick = () => {
    setImageModalOpen(true);
  };

  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setUploadedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setUploadedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleImageModalClose = () => {
    setImageModalOpen(false);
    setUploadedImage(null);
    setImagePreview(null);
    setImageText('');
  };

  const handleImageConfirm = async () => {
    if (!uploadedImage) return;
    setLoading(true);
    setImageModalOpen(false);

    // Extrai plataforma e tópico do texto fornecido
    const platform = selectedPlatform || extractPlatform(imageText);
    const topic = postTopic || extractTopic(imageText, platform);

    if (platform) {
      setSelectedPlatform(platform);
    }
    if (topic) {
      setPostTopic(topic);
    }

    setMessages((prev) => [
      ...prev,
      {
        id: 'user-img-' + Date.now(),
        content: imageText,
        user: 'me',
        created_at: new Date().toISOString(),
        image: imagePreview,
      } as any,
    ]);

    let description = '';
    try {
      console.log('Sending image for analysis...');
      const formData = new FormData();
      formData.append('image', uploadedImage);
      formData.append('language', language);
      formData.append('context', imageText);
      const res = await fetch('/api/analyze-image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Image analysis failed:', {
          status: res.status,
          statusText: res.statusText,
          error: data.error,
          details: data.details
        });
        throw new Error(data.error || 'Failed to analyze image');
      }

      if (!data.description) {
        console.error('No description in response:', data);
        throw new Error('No description received from image analysis');
      }

      description = data.description;
      setImageDescription(description);
      console.log('Image analysis successful');
    } catch (err) {
      console.error('Image analysis error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot-error-' + Date.now(),
          content: err instanceof Error ? err.message : t('common.error'),
          user: 'bot',
          created_at: new Date().toISOString(),
        },
      ]);
      setLoading(false);
      setUploadedImage(null);
      setImagePreview(null);
      return;
    }

    if (platform && topic) {
      const prompt = `Create a social media post for ${platform} based on this image and the user's provided context.

      Image Description: ${description}
      User's Context: ${imageText}
      Topic: ${topic}

      Please create a post that:
      1. Incorporates both the image analysis and the user's provided context
      2. Focuses specifically on the topic: ${topic}
      3. Follows best practices for ${platform}
      4. Includes a clear call-to-action
      5. Uses relevant hashtags
      6. Maintains an appropriate tone for the platform
      7. Do not include any instruction labels like "Call-to-Action:", "Tips:" or "Hashtags:" in the final text.

      Format the post with a clear title at the top (bold if possible), followed by the main content, call-to-action, and hashtags, each on their own line for easy reading and copying.

      For Tips section:
      - Add a horizontal line separator (---)
      - Use the title in bold
      - Use a vertical, block-style layout
      - Keep tips concise and actionable`;
      
      try {
        console.log('Generating post for platform:', platform);
        const res = await fetch('/api/chatgpt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: prompt, language }),
        });

        const data = await res.json();

        if (!res.ok) {
          console.error('Post generation failed:', {
            status: res.status,
            statusText: res.statusText,
            error: data.error,
            details: data.details
          });
          throw new Error(data.error || 'Failed to generate post');
        }

        if (!data.reply) {
          console.error('No reply in response:', data);
          throw new Error('No response received from AI');
        }

        console.log('Post generation successful');
        setMessages((prev) => [
          ...prev,
          {
            id: 'bot-' + Date.now(),
            content: data.reply,
            user: 'bot',
            created_at: new Date().toISOString(),
          },
        ]);
        setImageDescription(null);
      } catch (err) {
        console.error('AI response error:', err);
        setMessages((prev) => [
          ...prev,
          {
            id: 'bot-error-' + Date.now(),
            content: err instanceof Error ? err.message : t('common.error'),
            user: 'bot',
            created_at: new Date().toISOString(),
          },
        ]);
      } finally {
        setLoading(false);
        setUploadedImage(null);
        setImagePreview(null);
        setImageText('');
      }
    } else if (platform) {
      const followupPrompt = `The user uploaded an image with the following context: "${imageText}"

      Image Description: ${description}
      Selected Platform: ${platform}

      Ask the user in a friendly, creative, and context-aware way what specific topic or content they want to post about on ${platform}. Respond only with your question.`;
      try {
        console.log('Generating topic question...');
        const res = await fetch('/api/chatgpt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: followupPrompt, language }),
        });

        const data = await res.json();

        if (!res.ok) {
          console.error('Question generation failed:', {
            status: res.status,
            statusText: res.statusText,
            error: data.error,
            details: data.details
          });
          throw new Error(data.error || 'Failed to generate follow-up question');
        }

        if (!data.reply) {
          console.error('No reply in response:', data);
          throw new Error('No response received from AI');
        }

        console.log('Question generation successful');
        setMessages((prev) => [
          ...prev,
          {
            id: 'bot-' + Date.now(),
            content: data.reply,
            user: 'bot',
            created_at: new Date().toISOString(),
          },
        ]);
      } catch (err) {
        console.error('AI response error:', err);
        setMessages((prev) => [
          ...prev,
          {
            id: 'bot-error-' + Date.now(),
            content: err instanceof Error ? err.message : t('common.error'),
            user: 'bot',
            created_at: new Date().toISOString(),
          },
        ]);
      } finally {
        setLoading(false);
        setUploadedImage(null);
        setImagePreview(null);
        setImageText('');
      }
    } else {
      const followupPrompt = `The user uploaded an image with the following context: "${imageText}"

      Image Description: ${description}

      Ask the user in a friendly, creative, and context-aware way which social media platform they would like to use (Instagram, LinkedIn, or Facebook). Respond only with your question.`;
      try {
        console.log('Generating platform question...');
        const res = await fetch('/api/chatgpt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: followupPrompt, language }),
        });

        const data = await res.json();

        if (!res.ok) {
          console.error('Question generation failed:', {
            status: res.status,
            statusText: res.statusText,
            error: data.error,
            details: data.details
          });
          throw new Error(data.error || 'Failed to generate follow-up question');
        }

        if (!data.reply) {
          console.error('No reply in response:', data);
          throw new Error('No response received from AI');
        }

        console.log('Question generation successful');
        setMessages((prev) => [
          ...prev,
          {
            id: 'bot-' + Date.now(),
            content: data.reply,
            user: 'bot',
            created_at: new Date().toISOString(),
          },
        ]);
      } catch (err) {
        console.error('AI response error:', err);
        setMessages((prev) => [
          ...prev,
          {
            id: 'bot-error-' + Date.now(),
            content: err instanceof Error ? err.message : t('common.error'),
            user: 'bot',
            created_at: new Date().toISOString(),
          },
        ]);
      } finally {
        setLoading(false);
        setUploadedImage(null);
        setImagePreview(null);
        setImageText('');
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsOpen &&
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node) &&
        settingsButtonRef.current &&
        !settingsButtonRef.current.contains(event.target as Node)
      ) {
        setSettingsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [settingsOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showEmojiPicker &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].user === 'bot') {
      const typeSpeed = 50;
      const startDelay = 100;
      const msg = messages[messages.length - 1].content || '';
      setIsTypewriterActive(true);
      const timeout = setTimeout(() => {
        setIsTypewriterActive(false);
      }, startDelay + msg.length * typeSpeed);
      return () => clearTimeout(timeout);
    }
  }, [messages]);

  const handleTooltipClick = async (tooltip: string) => {
    handleFirstInteraction();
    if (!user) return;
    const userMsg: Message = {
      id: 'user-' + Date.now(),
      content: tooltip,
      user: 'me',
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    let platform = selectedPlatform || extractPlatform(tooltip);
    let topic = postTopic;
    if (!platform) {
      setSelectedPlatform(null);
    } else {
      setSelectedPlatform(platform);
    }
    if (!topic && platform && !extractPlatform(tooltip)) {
      topic = tooltip;
      setPostTopic(topic);
    }

    if (platform && topic) {
      const prompt = `You are a friendly, expert social media content assistant. Your main focus is to help the user specify the social media platform (Instagram, LinkedIn, or Facebook) and the content/topic for their post. Guide the user to provide both, but do so naturally and contextually in the flow of conversation. If the user is asking a question, discussing strategy, or just chatting, answer helpfully and conversationally. Only generate a complete, ready-to-use post for ${platform} about "${topic}" if the user clearly requests it or if the context makes it appropriate and both platform and topic are clear. When generating a post, use best practices for formatting, tone, hashtags, and calls-to-action. If you have extra recommendations (such as best time to post, engagement tips, or suggestions), send them as a second, separate message starting with 'Tips:'. Do not greet the user except at the very start of a new chat. Otherwise, keep the conversation natural and helpful.`;
      const openaiMessages = [
        { role: 'system', content: prompt },
        ...messages.map((msg) => ({
          role: msg.user === 'me' ? 'user' : 'assistant',
          content: msg.content
        })),
        { role: 'user', content: tooltip }
      ];
      try {
        const res = await fetch('/api/chatgpt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: openaiMessages, language }),
        });
        const data = await res.json();
        if (data.reply && data.reply.includes('Tips:')) {
          const [mainPost, ...tipsParts] = data.reply.split('Tips:');
          setMessages((prev) => [
            ...prev,
            {
              id: 'bot-' + Date.now(),
              content: mainPost.trim(),
              user: 'bot',
              created_at: new Date().toISOString(),
            },
            {
              id: 'bot-' + (Date.now() + 1),
              content: 'Tips:' + tipsParts.join('Tips:').trim(),
              user: 'bot',
              created_at: new Date(Date.now() + 1).toISOString(),
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: 'bot-' + Date.now(),
              content: data.reply || t('chat.fallback'),
              user: 'bot',
              created_at: new Date().toISOString(),
            },
          ]);
        }
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: 'bot-error-' + Date.now(),
            content: t('common.error'),
            user: 'bot',
            created_at: new Date().toISOString(),
          },
        ]);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (platform && !topic) {
      setSelectedPlatform(platform);
      setPostTopic(null);
      const followupPrompt = `The user wants to create a post for ${platform}. Ask them in a friendly, creative, and context-aware way what topic or content they want to post about. Respond only with your question.`;
      try {
        const res = await fetch('/api/chatgpt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: followupPrompt, language }),
        });
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: 'bot-' + Date.now(),
            content: data.reply || t('chat.fallback'),
            user: 'bot',
            created_at: new Date().toISOString(),
          },
        ]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: 'bot-error-' + Date.now(),
            content: t('common.error'),
            user: 'bot',
            created_at: new Date().toISOString(),
          },
        ]);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!platform && tooltip.trim()) {
      setPostTopic(tooltip);
      const followupPrompt = `The user wants to create a post about "${tooltip}". Ask them in a friendly, creative, and context-aware way which social media platform they want to use (Instagram, LinkedIn, or Facebook). Respond only with your question.`;
      try {
        const res = await fetch('/api/chatgpt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: followupPrompt, language }),
        });
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: 'bot-' + Date.now(),
            content: data.reply || t('chat.fallback'),
            user: 'bot',
            created_at: new Date().toISOString(),
          },
        ]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: 'bot-error-' + Date.now(),
            content: t('common.error'),
            user: 'bot',
            created_at: new Date().toISOString(),
          },
        ]);
      } finally {
        setLoading(false);
      }
      return;
    }
  };

  if (!user) return null;

  return (
    <div className="bg-auth-gradient min-h-screen flex items-center justify-center">
      <div className="w-full h-screen md:h-[90vh] md:max-w-2xl flex flex-col rounded-none md:rounded-3xl shadow-2xl border border-white/30">
        <header className="p-4 md:p-4 flex justify-between items-center relative border-b border-white/20">
          <h1 className="text-2xl font-bold text-white drop-shadow">{t('chat.assistantTitle') || 'Assistente IA'}</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                ref={settingsButtonRef}
                onClick={() => setSettingsOpen((v) => !v)}
                className="p-2 rounded-full bg-white/30 hover:bg-white/50 text-gray-800 dark:text-white focus:outline-none"
                aria-label={t('settings.title')}
              >
                <FaCog className="text-xl text-white" />
              </button>
              {settingsOpen && (
                <div
                  ref={settingsRef}
                  className="absolute right-0 mt-2 w-48 bg-auth-gradient bg-opacity-90 rounded-xl shadow-lg border border-white z-50 backdrop-blur-md"
                >
                  <button
                    onClick={toggleTheme}
                    className="w-full flex items-center gap-2 px-4 py-3 text-white hover:bg-white/10 rounded-t-xl"
                  >
                    {dark ? (
                      <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='w-5 h-5 text-yellow-400'>
                        <path strokeLinecap='round' strokeLinejoin='round' d='M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M6.05 17.95l-1.414 1.414m12.728 0l-1.414-1.414M6.05 6.05L4.636 4.636' />
                        <circle cx='12' cy='12' r='5' fill='currentColor' />
                      </svg>
                    ) : (
                      <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='w-5 h-5 text-gray-700 dark:text-white'>
                        <path strokeLinecap='round' strokeLinejoin='round' d='M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z' />
                      </svg>
                    )}
                    {dark ? t('settings.lightMode') : t('settings.darkMode')}
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-4 py-3 text-white hover:bg-white/10 rounded-b-xl"
                  >
                    <FaSignOutAlt className="w-5 h-5 text-black dark:text-white" />
                    {t('auth.signOut') || 'Sair'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-1 px-6 py-4 overflow-y-auto custom-scrollbar relative">
          {greetingLoading ? (
            <div className="flex justify-center items-center py-8">
              <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></span>
              <span className="ml-3 text-white/80">{t('chat.greetingLoading')}</span>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.user === 'me' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.user === 'bot' && (
                    <div className="flex flex-col items-end mr-2 justify-center">
                      <FaRobot className="text-3xl text-white" />
                    </div>
                  )}
                  <div
                    className={`rounded-xl p-4 border-[0.5px] border-white text-white bg-transparent max-w-[98%] md:max-w-[90%] min-w-[100px] text-base relative ${msg.user === 'me' ? 'ml-2' : 'mr-2'}`}
                  >
                    <div className="flex flex-col gap-2 mb-4">
                      {msg.user === 'me' && msg.image ? (
                        <img src={msg.image} alt="User upload" className="max-w-xs max-h-60 rounded-lg mb-2" />
                      ) : null}
                      {msg.user === 'bot' ? (
                        <ReactMarkdown
                          components={{
                            p({ node, children, ...props }: any) {
                              return <p {...props}>{children}</p>;
                            },
                            strong({ node, children, ...props }: any) {
                              return <span className="font-bold text-lg mb-2" {...props}>{children}</span>;
                            },
                            h1({ children, ...props }: any) {
                              return <div className="font-bold text-xl mb-2">{children}</div>;
                            },
                            h2({ children, ...props }: any) {
                              return <div className="font-bold text-lg mb-2">{children}</div>;
                            },
                            hr({ node, ...props }: any) {
                              return <hr className="my-4 border-gray-600" {...props} />;
                            }
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      ) : (
                        <span>{msg.content}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-5 pb-1 relative justify-between">
                      <div className="flex items-center gap-2">
                        {msg.user === 'bot' && (
                          <>
                            <button
                              className={`transition-colors ${feedback[msg.id] === 'like' ? 'text-green-400' : 'text-white'} hover:text-green-400`}
                              onClick={() => handleFeedback(msg.id, 'like', msg.content)}
                            >
                              <FaRegThumbsUp className="text-lg" />
                            </button>
                            <button
                              className={`transition-colors ${feedback[msg.id] === 'dislike' ? 'text-red-400' : 'text-white'} hover:text-red-400`}
                              onClick={() => handleFeedback(msg.id, 'dislike', msg.content)}
                            >
                              <FaRegThumbsDown className="text-lg" />
                            </button>
                            <button
                              className={`hover:text-blue-300 transition-colors relative group`}
                              onClick={async () => {
                                if (currentAudioId === msg.id && isPlaying) {
                                  if (audioRef.current) {
                                    audioRef.current.pause();
                                  }
                                } else {
                                  await playTTS(msg.content, msg.id);
                                }
                              }}
                              disabled={ttsLoadingMsgId === msg.id}
                            >
                              {ttsLoadingMsgId === msg.id ? (
                                <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 inline-block"></span>
                              ) : (
                                <>
                                  {currentAudioId === msg.id ? (
                                    isPlaying ? (
                                      <FaPause className="text-lg text-white" />
                                    ) : (
                                      <FaPlay className="text-lg text-white" />
                                    )
                                  ) : (
                                    <FaVolumeUp className="text-lg text-white" />
                                  )}

                                  {/* Barra de reprodução de audio */}
                                  {currentAudioId === msg.id && (
                                    <div className="absolute -bottom-1.3 mt-1 left-0 w-full h-0.5 bg-white/20">
                                        <div
                                        className="absolute bottom-0 z-10 h-full bg-blue-400 mt-1 transition-all duration-100"
                                        style={{ width: `${audioProgress}%` }}
                                      />
                                    </div>
                                  )}
                                </>
                              )}
                            </button>
                            <button className="hover:text-blue-300 transition-colors" onClick={() => setCommentModal({ open: true, message: { id: msg.id, content: msg.content } })}><FaRegCommentDots className="text-lg text-white" /></button>
                          </>
                        )}
                      </div>
                      <span className="text-xs opacity-60 whitespace-nowrap">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  {msg.user === 'me' && (
                    <div className="flex flex-col items-end ml-2 justify-center">
                      <FaUserCircle className="text-3xl text-white" />
                    </div>
                  )}
                </div>
              ))}
              {!isNearBottom && (
                <button
                  onClick={scrollToBottom}
                  className="fixed bottom-24 right-4 md:right-auto md:left-1/2 md:transform md:-translate-x-1/2 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 shadow-lg transition-all duration-200 z-50"
                  aria-label="Scroll to bottom"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                  </svg>
                </button>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </main>
        {showTooltips && tooltips.length > 0 && (
          <div className="w-full px-6">
            <div className="w-full border-t border-white/30 mb-4" />
            <div className="flex flex-col gap-2 mb-2 items-center w-full md:hidden">
              <button
                className="w-full flex-1 px-4 py-2 rounded-lg bg-white/20 text-white/90 hover:bg-blue-400/80 transition-colors text-center"
                onClick={() => setShowTooltipsModal(true)}
              >
                Sugestões
              </button>
            </div>
            <div className="hidden md:flex flex-col gap-2 mb-4 items-center w-full">
              <div className="flex flex-col sm:flex-row gap-2 w-full justify-center">
                {tooltips.slice(0, 2).map((tip, idx) => (
                  <button
                    key={idx}
                    className="flex-1 px-4 py-2 text-sm rounded-lg bg-white/20 text-white/90 hover:bg-blue-400/80 transition-colors"
                    onClick={() => handleTooltipClick(tip)}
                  >
                    {tip}
                  </button>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full justify-center">
                {tooltips.slice(2, 4).map((tip, idx) => (
                  <button
                    key={idx + 2}
                    className="flex-1 px-4 py-2 text-sm rounded-lg bg-white/20 text-white/90 hover:bg-blue-400/80 transition-colors"
                    onClick={() => handleTooltipClick(tip)}
                  >
                    {tip}
                  </button>
                ))}
              </div>
            </div>
            {showTooltipsModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-auth-gradient bg-opacity-90 rounded-2xl shadow-2xl p-6 max-w-xs w-full flex flex-col items-center border border-white/30 backdrop-blur-md relative">
                  <button
                    className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl"
                    onClick={() => setShowTooltipsModal(false)}
                    aria-label="Close"
                    type="button"
                  >
                    &times;
                  </button>
                  <h2 className="text-lg font-bold text-white mb-4 drop-shadow">Sugestões</h2>
                  <div className="flex flex-col gap-3 w-full">
                    {tooltips.slice(0, 4).map((tip, idx) => (
                      <button
                        key={idx}
                        className="w-full px-4 py-2 rounded-lg bg-white/20 text-white/90 hover:bg-blue-400/80 transition-colors text-center"
                        onClick={() => { handleTooltipClick(tip); setShowTooltipsModal(false); }}
                      >
                        {tip}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <footer className="w-full p-3">
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-3 bg-transparent rounded-2xl px-4 py-2 shadow-md border border-white/30 relative"
          >
            <div className="flex items-center w-full">
              <button
                ref={emojiButtonRef}
                type="button"
                className="hidden md:inline-flex text-xl text-white hover:text-gray-200 mr-2"
                onClick={() => setShowEmojiPicker((v) => !v)}
                tabIndex={-1}
              >
                <FaRegSmile />
              </button>
              <input
                ref={inputRef}
                type="text"
                placeholder={t('chat.typeMessage')}
                className="flex-1 bg-transparent outline-none px-2 py-2 text-white dark:text-white placeholder-gray-200 dark:placeholder-gray-300"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={loading}
                style={{ background: 'transparent' }}
              />
              <button
                type="submit"
                className="text-xl text-white hover:text-gray-200 disabled:opacity-50 ml-2"
                disabled={!newMessage.trim() || loading}
              >
                <FaPaperPlane />
              </button>
              <button
                type="button"
                className="text-xl text-white hover:text-gray-200 ml-2"
                onClick={() => {
                  setVoiceModalOpen(true);
                  setVoiceModalMode('ready-to-record');
                }}
              >
                <FaMicrophone />
              </button>
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={handleImageSelect}
              />
              <button
                type="button"
                className="text-xl text-white hover:text-gray-200 ml-2"
                onClick={handleImageButtonClick}
                title="Upload Image"
                disabled={loading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V7.5A2.25 2.25 0 015.25 5.25h13.5A2.25 2.25 0 0121 7.5v9a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 16.5z" />
                  <circle cx="8.25" cy="9.75" r="1.25" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 16.5l-5.25-5.25a2.25 2.25 0 00-3.182 0L3 21" />
                </svg>
              </button>
            </div>
            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className="absolute bottom-12 left-0 z-50"
              >
                <EmojiPicker
                  data={data}
                  theme={dark ? 'dark' : 'light'}
                  onEmojiSelect={(e: any) => {
                    insertEmoji(e.native);
                  }}
                  previewPosition="none"
                />
              </div>
            )}
          </form>
        </footer>
      </div>
      <CommentModal
        isOpen={commentModal.open}
        onClose={() => setCommentModal({ open: false })}
        onSubmit={(comment) => {
          if (commentModal.message) {
            handleComment(commentModal.message.id, commentModal.message.content, comment);
          }
        }}
      />

      {/* Modal de UploadImage  */}
      <Modal
        isOpen={imageModalOpen}
        onRequestClose={handleImageModalClose}
        className="fixed inset-0 flex items-center justify-center z-50"
        overlayClassName="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 cursor-pointer"
        ariaHideApp={false}
        shouldCloseOnOverlayClick={true}
        shouldCloseOnEsc={true}
        closeTimeoutMS={200}
        onOverlayClick={handleImageModalClose}
        overlayElement={(props: React.HTMLAttributes<HTMLDivElement>, contentElement: React.ReactNode) => (
          <div {...props} onClick={handleImageModalClose}>
            {contentElement}
          </div>
        )}
      >
        <div
          className="bg-auth-gradient rounded-2xl p-6 flex flex-col items-center gap-4 w-[90vw] max-w-md border border-white/30 shadow-2xl transform transition-all duration-200 ease-in-out"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center w-full mb-2">
            <h2 className="text-xl font-bold text-white drop-shadow">{t('chat.uploadImage') || 'Upload de Imagem'}</h2>
            <button
              onClick={handleImageModalClose}
              className="text-white/70 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
              aria-label={t('common.cancel') || 'Fechar'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div
            className={`w-full h-48 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 ${imagePreview
              ? 'border-white/30 bg-white/5'
              : 'border-white/30 bg-white/5 hover:bg-white/10'
              }`}
            onDrop={handleImageDrop}
            onDragOver={e => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            {imagePreview ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-44 max-w-full object-contain rounded-lg"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadedImage(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                  aria-label={t('common.delete') || 'Remover imagem'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-white/70">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V7.5A2.25 2.25 0 015.25 5.25h13.5A2.25 2.25 0 0121 7.5v9a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 16.5z" />
                  <circle cx="8.25" cy="9.75" r="1.25" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 16.5l-5.25-5.25a2.25 2.25 0 00-3.182 0L3 21" />
                </svg>
                <span className="text-center px-4">{t('chat.dragAndDropImage') || 'Arraste e solte ou clique para selecionar uma imagem'}</span>
              </div>
            )}
          </div>
          <div className="w-full">
            <div className="flex items-center w-full bg-transparent rounded-2xl px-4 py-2 shadow-md border border-white/30">
              <input
                type="text"
                placeholder={t('chat.typeMessage') || 'Digite uma mensagem para a imagem...'}
                className="flex-1 bg-transparent outline-none px-2 py-2 text-white dark:text-white placeholder-gray-200 dark:placeholder-gray-300"
                value={imageText}
                onChange={(e) => setImageText(e.target.value)}
                style={{ background: 'transparent' }}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4 w-full">
            <button
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/20 text-white font-semibold hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={(e) => {
                e.stopPropagation();
                handleImageConfirm();
              }}
              disabled={!uploadedImage}
            >
              {t('common.confirm') || 'Confirmar'}
            </button>
            <button
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleImageModalClose();
              }}
            >
              {t('common.cancel') || 'Cancelar'}
            </button>
          </div>
        </div>
      </Modal>
      <VoiceModal
        isOpen={voiceModalOpen && (voiceModalMode === 'ready-to-record' || voiceModalMode === 'recording')}
        onClose={handleVoiceModalClose}
        onSubmit={handleAudioSubmit}
        mode={voiceModalMode}
        onToggleRecord={handleToggleRecord}
        modalRef={voiceModalRef}
        error={voiceError}
      />
    </div>
  );
};

export default ChatComponent; 