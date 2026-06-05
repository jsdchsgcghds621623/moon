import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, X } from 'lucide-react';
import { identifyHeapUser } from '@/lib/heap';

interface Profile {
  id: string;
  name: string;
  avatar: string;
  isKids?: boolean;
}

const ME_AVATAR = '/lovable-uploads/a8918201-a815-4479-ae74-1fce99787310.png';

const DEFAULT_AVATARS = [
  '/lovable-uploads/a8918201-a815-4479-ae74-1fce99787310.png',
  '/lovable-uploads/6687140f-57cf-4ac7-9e12-e54a2bb9e14f.png',
  '/lovable-uploads/8cd6d8fc-7af0-4a3e-b16c-cc4046308648.png',
  '/lovable-uploads/b39cfe51-d347-4b50-924c-4a5d672ff09c.png',
];

const AVATAR_COLORS = [
  '#E50914', '#831a9f', '#0071eb',
  '#e87c03', '#54b9c5', '#2db485',
  '#e5a00d', '#B20710',
];

const getColor   = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
const getInitial = (name: string) => name.trim().charAt(0).toUpperCase();

const createProfileId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
};

/* ══════════════════════════════════════
   FIRST VISIT OVERLAY
══════════════════════════════════════ */
const FirstVisitPrompt = ({ onComplete }: { onComplete: (name: string) => void }) => {
  const [name, setName]   = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 400);
  }, []);

  const handleSubmit = () => {
    const t = name.trim();
    if (!t)            { setError('Please enter your name to continue.'); return; }
    if (t.length > 30) { setError('Name must be 30 characters or less.'); return; }
    onComplete(t);
  };

  const previewBg      = name.trim() ? getColor(name.trim()) : '#2a2a2a';
  const previewInitial = name.trim() ? getInitial(name.trim()) : '?';

  return (
    <motion.div
      className="fixed inset-0 z-[999] bg-[#141414] flex flex-col items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Logo */}
      <div className="absolute top-6 left-6 sm:top-8 sm:left-10">
        <img
          src="/lovable-uploads/bffb51a3-45e8-4440-9ab1-94f7b01c1195.png"
          alt="Moonflix"
          className="h-7 sm:h-9 object-contain"
        />
      </div>

      <motion.div
        className="flex flex-col items-center gap-6 w-full max-w-[340px]"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        {/* Live avatar preview — shows ME image with name initial overlay */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28">
          <img
            src={ME_AVATAR}
            alt="Your avatar"
            className="w-full h-full rounded-[4px] object-cover"
          />
          {/* Color + initial overlay fades in as user types */}
          <motion.div
            className="absolute inset-0 rounded-[4px] flex items-center justify-center text-white font-black text-4xl select-none"
            style={{ backgroundColor: previewBg }}
            animate={{ opacity: name.trim() ? 0 : 1 }}
            transition={{ duration: 0.2 }}
          >
            ?
          </motion.div>
        </div>

        {/* Heading */}
        <div className="text-center space-y-2">
          <h1 className="text-white font-bold text-2xl sm:text-3xl tracking-tight">
            Who's watching?
          </h1>
          <p className="text-white/45 text-[14px] leading-relaxed">
            Enter your name to create your profile.
          </p>
        </div>

        {/* Input */}
        <div className="w-full space-y-1.5">
          <input
            ref={inputRef}
            type="text"
            value={name}
            maxLength={30}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Your name"
            className="
              w-full bg-[#454545] text-white text-[15px]
              px-4 py-3 rounded-[4px] outline-none
              border-2 border-transparent focus:border-white
              placeholder:text-white/30
              transition-colors duration-150
            "
          />
          {error
            ? <p className="text-[#E50914] text-[12px] pl-1">{error}</p>
            : <p className="text-white/20 text-[11px] text-right tabular-nums">{name.length}/30</p>
          }
        </div>

        {/* CTA */}
        <button
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="
            w-full py-3 text-[15px] font-bold rounded-[4px]
            bg-[#E50914] text-white
            hover:bg-[#f6121d] active:scale-[0.98]
            disabled:bg-white/10 disabled:text-white/25 disabled:cursor-not-allowed
            transition-all duration-150
          "
        >
          Get Started
        </button>

        <p className="text-white/20 text-[12px] text-center">
          You can add more profiles or change your name later.
        </p>
      </motion.div>
    </motion.div>
  );
};

/* ══════════════════════════════════════
   ADD PROFILE INLINE CARD
══════════════════════════════════════ */
const AddCard = ({ onAdd }: { onAdd: (name: string) => void }) => {
  const [step, setStep]   = useState<'idle' | 'naming'>('idle');
  const [name, setName]   = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 'naming') setTimeout(() => inputRef.current?.focus(), 60);
  }, [step]);

  const confirm = () => {
    const t = name.trim();
    if (!t)            { setError('Please enter a name.'); return; }
    if (t.length > 30) { setError('Max 30 characters.'); return; }
    onAdd(t);
    setStep('idle');
    setName('');
    setError('');
  };

  const cancel = () => { setStep('idle'); setName(''); setError(''); };

  if (step === 'idle') {
    return (
      <motion.div
        layout
        className="group flex flex-col items-center gap-4 cursor-pointer"
        onClick={() => setStep('naming')}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
      >
        <div className="
          w-[100px] h-[100px] sm:w-[130px] sm:h-[130px] lg:w-[155px] lg:h-[155px]
          rounded-[4px] bg-[#1a1a1a]
          flex items-center justify-center
          border-2 border-transparent group-hover:border-white
          transition-colors duration-200
        ">
          <Plus className="w-8 h-8 sm:w-10 sm:h-10 text-white/30 group-hover:text-white transition-colors duration-200" />
        </div>
        <span className="text-white/40 text-[14px] sm:text-[16px] group-hover:text-white transition-colors duration-200">
          Add Profile
        </span>
      </motion.div>
    );
  }

  const previewBg      = name.trim() ? getColor(name.trim()) : '#2a2a2a';
  const previewInitial = name.trim() ? getInitial(name.trim()) : '?';

  return (
    <motion.div layout className="flex flex-col items-center gap-4">
      <motion.div
        className="w-[100px] h-[100px] sm:w-[130px] sm:h-[130px] lg:w-[155px] lg:h-[155px] rounded-[4px] flex items-center justify-center text-white font-black text-4xl sm:text-5xl select-none"
        animate={{ backgroundColor: previewBg }}
        transition={{ duration: 0.2 }}
        style={{ backgroundColor: previewBg }}
      >
        {previewInitial}
      </motion.div>

      <div className="flex flex-col items-center gap-1.5 w-[150px] sm:w-[175px]">
        <input
          ref={inputRef}
          type="text"
          value={name}
          maxLength={30}
          onChange={(e) => { setName(e.target.value); setError(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') confirm(); if (e.key === 'Escape') cancel(); }}
          placeholder="Name"
          className="
            w-full bg-[#454545] text-white text-[14px] text-center
            px-3 py-2 rounded-[4px] outline-none
            border-2 border-transparent focus:border-white
            placeholder:text-white/30
            transition-colors duration-150
          "
        />
        {error && <p className="text-[#E50914] text-[11px] text-center">{error}</p>}

        <div className="flex gap-2 w-full mt-0.5">
          <button
            onClick={confirm}
            disabled={!name.trim()}
            className="
              flex-1 py-1.5 text-[12px] font-bold text-black
              bg-white rounded-[4px]
              hover:bg-white/85 active:scale-95
              disabled:bg-white/15 disabled:text-white/25 disabled:cursor-not-allowed
              transition-all duration-150
            "
          >
            Continue
          </button>
          <button
            onClick={cancel}
            className="
              flex-1 py-1.5 text-[12px] font-medium text-white/60
              bg-white/10 rounded-[4px]
              hover:bg-white/20 hover:text-white
              active:scale-95 transition-all duration-150
            "
          >
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  );
};

/* ══════════════════════════════════════
   PROFILE CARD
══════════════════════════════════════ */
const ProfileCard = ({
  profile,
  isEditMode,
  onSelect,
  onDelete,
}: {
  profile: Profile;
  isEditMode: boolean;
  onSelect: (p: Profile) => void;
  onDelete: (id: string) => void;
}) => {
  const hasImage = profile.avatar && !profile.avatar.includes('placeholder');

  return (
    <motion.div
      layout
      className="group flex flex-col items-center gap-4 cursor-pointer"
      onClick={() => !isEditMode && onSelect(profile)}
      whileHover={!isEditMode ? { scale: 1.04 } : {}}
      whileTap={!isEditMode ? { scale: 0.97 } : {}}
      initial={{ opacity: 0, scale: 0.85, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: -16 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative">
        {hasImage ? (
          <img
            src={profile.avatar}
            alt={profile.name}
            className={`
              w-[100px] h-[100px] sm:w-[130px] sm:h-[130px] lg:w-[155px] lg:h-[155px]
              rounded-[4px] object-cover
              border-2 border-transparent
              ${!isEditMode ? 'group-hover:border-white' : 'brightness-50'}
              transition-all duration-200
            `}
          />
        ) : (
          <div
            className={`
              w-[100px] h-[100px] sm:w-[130px] sm:h-[130px] lg:w-[155px] lg:h-[155px]
              rounded-[4px] flex items-center justify-center
              text-white font-black text-4xl sm:text-5xl lg:text-6xl select-none
              border-2 border-transparent
              ${!isEditMode ? 'group-hover:border-white' : 'brightness-50'}
              transition-all duration-200
            `}
            style={{ backgroundColor: getColor(profile.name) }}
          >
            {getInitial(profile.name)}
          </div>
        )}

        {/* Edit overlay */}
        <AnimatePresence>
          {isEditMode && (
            <motion.div
              className="absolute inset-0 rounded-[4px] flex items-center justify-center cursor-pointer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => { e.stopPropagation(); onDelete(profile.id); }}
            >
              <div className="w-9 h-9 rounded-full border-2 border-white bg-black/40 flex items-center justify-center">
                <Pencil className="w-4 h-4 text-white" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete X */}
        <AnimatePresence>
          {isEditMode && (
            <motion.button
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white flex items-center justify-center hover:bg-white/80 transition-colors z-10"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              onClick={(e) => { e.stopPropagation(); onDelete(profile.id); }}
              aria-label={`Remove ${profile.name}`}
            >
              <X className="w-3 h-3 text-black" strokeWidth={3} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Kids badge */}
        {profile.isKids && (
          <div className="absolute -top-2 -left-2 bg-[#E50914] text-white text-[10px] font-black tracking-wide px-1.5 py-0.5 rounded-[2px] select-none">
            KIDS
          </div>
        )}
      </div>

      <span className={`
        text-[14px] sm:text-[16px] text-center max-w-[140px] truncate
        transition-colors duration-200
        ${isEditMode ? 'text-white/60' : 'text-white/50 group-hover:text-white'}
      `}>
        {profile.name}
      </span>
    </motion.div>
  );
};

/* ══════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════ */
const ProfileSelection = () => {
  const navigate = useNavigate();

  const [profiles,       setProfiles]       = useState<Profile[]>([]);
  const [isEditMode,     setIsEditMode]     = useState(false);
  const [isExiting,      setIsExiting]      = useState(false);
  const [isReady,        setIsReady]        = useState(false);
  const [showFirstVisit, setShowFirstVisit] = useState(false);

  /* ── bootstrap ── */
  useEffect(() => {
    const lastVisit     = localStorage.getItem('moonflix_last_visit');
    const activeProfile = localStorage.getItem('moonflix_active_profile');
    const now           = Date.now();
    const DAY           = 24 * 60 * 60 * 1000;

    // Auto-skip to browse only if visited within last 24h
    if (lastVisit && activeProfile && now - parseInt(lastVisit) < DAY) {
      try {
        const profile: Profile = JSON.parse(activeProfile);
        if (profile.id) {
          identifyHeapUser(profile.id, { profile_name: profile.name });
        }
      } catch { /* ignore malformed profile data */ }

      navigate('/browse');
      return;
    }

    // Past 24h — clear active so they must pick again
    localStorage.removeItem('moonflix_active_profile');

    const saved = localStorage.getItem('moonflix_profiles');
    if (saved) {
      try {
        const parsed: Profile[] = JSON.parse(saved);
        if (parsed.length > 0) {
          setProfiles(parsed);
          setIsReady(true);
          return;
        }
      } catch { /* fall through */ }
    }

    // No saved profiles → first visit
    setShowFirstVisit(true);
    setIsReady(true);
  }, [navigate]);

  /* ── first visit complete ── */
  const handleFirstVisitComplete = (name: string) => {
    const profile: Profile = {
      id: createProfileId(),
      name,
      avatar: ME_AVATAR,
    };
    const updated = [profile];
    setProfiles(updated);
    localStorage.setItem('moonflix_profiles', JSON.stringify(updated));
    setShowFirstVisit(false);
  };

  /* ── select ── */
  const handleSelect = (profile: Profile) => {
    setIsExiting(true);
    localStorage.setItem('moonflix_active_profile', JSON.stringify(profile));
    localStorage.setItem('moonflix_last_visit', Date.now().toString());
    identifyHeapUser(profile.id, { profile_name: profile.name });
    setTimeout(() => navigate('/browse'), 350);
  };

  /* ── add ── */
  const handleAdd = (name: string) => {
    if (profiles.length >= 5) return;
    const newProfile: Profile = {
      id: createProfileId(),
      name,
      avatar: DEFAULT_AVATARS[profiles.length % DEFAULT_AVATARS.length],
    };
    const updated = [...profiles, newProfile];
    setProfiles(updated);
    localStorage.setItem('moonflix_profiles', JSON.stringify(updated));
  };

  /* ── delete ── */
  const handleDelete = (id: string) => {
    if (profiles.length <= 1) return;
    const updated = profiles.filter((p) => p.id !== id);
    setProfiles(updated);
    localStorage.setItem('moonflix_profiles', JSON.stringify(updated));
  };

  if (!isReady) return null;

  return (
    <>
      <AnimatePresence>
        {showFirstVisit && (
          <FirstVisitPrompt onComplete={handleFirstVisitComplete} />
        )}
      </AnimatePresence>

      <motion.div
        className={`min-h-screen bg-[#141414] flex flex-col ${showFirstVisit ? 'pointer-events-none' : ''}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: isExiting ? 0 : 1 }}
        transition={{ duration: 0.4 }}
        aria-hidden={showFirstVisit}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 sm:px-10 lg:px-16 py-5 sm:py-7">
          <img
            src="/lovable-uploads/bffb51a3-45e8-4440-9ab1-94f7b01c1195.png"
            alt="Moonflix"
            className="h-6 sm:h-8 object-contain"
          />
          {profiles.length > 0 && (
            <button
              className="text-white/50 hover:text-white text-[13px] font-medium tracking-wide border border-white/20 hover:border-white px-4 py-1.5 rounded-[3px] transition-all duration-150"
              onClick={() => setIsEditMode((m) => !m)}
            >
              {isEditMode ? 'Done' : 'Manage Profiles'}
            </button>
          )}
        </div>

        {/* Center */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
          <h1 className="text-white font-bold text-3xl sm:text-4xl lg:text-[2.75rem] mb-10 sm:mb-14 tracking-tight">
            Who's watching?
          </h1>

          <div className="flex flex-wrap items-start justify-center gap-5 sm:gap-8 lg:gap-10 mb-12">
            <AnimatePresence>
              {profiles.map((profile) => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  isEditMode={isEditMode}
                  onSelect={handleSelect}
                  onDelete={handleDelete}
                />
              ))}
              {!isEditMode && profiles.length < 5 && (
                <AddCard key="add" onAdd={handleAdd} />
              )}
            </AnimatePresence>
          </div>

          {!isEditMode && (
            <button
              className="
                text-white/40 hover:text-white text-[12px] font-medium tracking-widest uppercase
                border border-white/15 hover:border-white
                px-8 py-2.5 rounded-[3px]
                transition-all duration-150
              "
              onClick={() => setIsEditMode(true)}
            >
              Manage Profiles
            </button>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default ProfileSelection;