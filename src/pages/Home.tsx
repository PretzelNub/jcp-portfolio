import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  ChevronDown, 
  Send, 
  X, 
  CheckCircle2, 
  Circle, 
  AlertTriangle,
  Github,
  Linkedin,
  Mail,
  Sparkles,
  ArrowRight,
  Loader2,
  Sprout,
  Check,
  CircleChevronRight,
  ChevronRight
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Markdown from 'react-markdown';
import { chatWithAI, analyzeJD } from '../services/geminiService';
import { supabase } from '../services/supabaseClient';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Navbar = ({ onOpenChat, profile }: { onOpenChat: () => void, profile: any }) => {
  const initials = profile?.name 
    ? profile.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : 'JP';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <a href="/" className="text-xl font-serif font-bold tracking-tighter hover:opacity-80 transition-opacity">
          {initials}<span className="text-brand-teal">.</span>
        </a>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
          <a href="#experience" className="hover:text-white transition-colors">Experience</a>
          <a href="#fit-check" className="hover:text-white transition-colors">Fit Check</a>
        </div>
        <button 
          onClick={onOpenChat}
          className="flex items-center gap-2 bg-brand-teal text-bg-dark px-4 py-2 rounded-full text-sm font-medium hover:bg-opacity-90 transition-all active:scale-95"
        >
          <MessageSquare size={16} />
          Ask AI
        </button>
      </div>
    </nav>
  );
};

const Hero = ({ onOpenChat, profile, selectedRoles, onToggleRole }: { onOpenChat: () => void, profile: any, selectedRoles: string[], onToggleRole: (role: string) => void }) => {
  console.log('Hero rendering with selectedRoles:', selectedRoles);
  return (
    <section className="relative pt-32 pb-20 px-6 overflow-hidden">
    <div className="max-w-4xl mx-auto text-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-brand-teal mb-8"
      >
        <span className="w-2 h-2 rounded-full bg-brand-teal animate-pulse" />
        {profile?.availability_status || 'Open to Senior/Staff Roles'}
      </motion.div>
      
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-6xl md:text-8xl font-serif font-bold mb-6 tracking-tight"
      >
        {profile?.name || 'Joe Peterlin'}
      </motion.h1>
      
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xl md:text-2xl text-brand-teal font-medium mb-8"
      >
        {profile?.title || 'Digital Workplace – Collaboration & AI Transformation Lead'}
      </motion.p>
      
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed"
      >
        {profile?.elevator_pitch || "I am a data and AI transformation leader with 20 plus years of experience turning business strategy into platforms people actually use. I build governed, scalable data foundations and then drive AI and analytics into measurable business outcomes. My work focuses on value realization, not slideware."}
      </motion.p>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-wrap justify-center gap-4 mb-16"
      >
        {['Director', 'Sr. Director', 'VP AI', 'CAIO', 'CDAIO'].map((role: string) => {
          const isSelected = selectedRoles.includes(role);
          return (
            <button 
              key={role} 
              onClick={() => onToggleRole(role)}
              className={cn(
                "px-4 py-2 rounded-full border text-sm font-mono transition-all active:scale-95",
                isSelected 
                  ? "bg-transparent border-brand-teal text-brand-teal shadow-[0_0_15px_rgba(255,203,5,0.1)]" 
                  : "bg-white/5 border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300"
              )}
            >
              {role}
            </button>
          );
        })}
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col items-center gap-6"
      >
        <div className="flex flex-wrap justify-center gap-4">
          <button 
            onClick={onOpenChat}
            className="group flex items-center gap-3 bg-brand-teal text-bg-dark px-8 py-4 rounded-full text-lg font-medium hover:scale-105 transition-all"
          >
            <MessageSquare size={20} />
            Ask AI About Me
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        
        <div className="animate-bounce mt-12 text-gray-600">
          <ChevronDown size={32} />
        </div>
      </motion.div>
    </div>
  </section>
  );
};

const ExperienceCard = ({ role }: { role: any }) => {
  const [showAI, setShowAI] = useState(false);
  
  return (
    <div className="glass rounded-2xl overflow-hidden mb-8 transition-all hover:border-white/20">
      <div className="p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-2xl font-serif font-bold">{role.company_name}</h3>
            <p className="text-brand-teal font-medium">{role.title}</p>
          </div>
          <div className="text-sm font-mono text-gray-500 bg-white/5 px-3 py-1 rounded-full self-start">
            {role.start_date ? new Date(role.start_date).getFullYear() : ''} — {role.is_current ? 'Present' : (role.end_date ? new Date(role.end_date).getFullYear() : '')}
          </div>
        </div>
        
        <ul className="space-y-3 mb-8">
          {(role.bullet_points || []).map((item: string, i: number) => (
            <li key={i} className="flex gap-3 text-gray-300">
              <span className="text-brand-teal mt-1.5">•</span>
              {item}
            </li>
          ))}
        </ul>
        
        {role.aiContext && (
          <button 
            onClick={() => setShowAI(!showAI)}
            className="flex items-center gap-2 text-sm font-bold text-brand-teal hover:underline"
          >
            <Sparkles size={16} />
            {showAI ? 'Hide AI Context' : 'Show AI Context'}
          </button>
        )}
      </div>
      
      <AnimatePresence>
        {showAI && role.aiContext && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-black/40 border-t border-white/5"
          >
            <div className="p-8 grid md:grid-cols-2 gap-8">
              {role.aiContext.situation && (
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-2">Situation</h4>
                  <p className="text-sm text-gray-300 leading-relaxed">{role.aiContext.situation}</p>
                </div>
              )}
              {role.aiContext.approach && (
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-2">Approach</h4>
                  <p className="text-sm text-gray-300 leading-relaxed">{role.aiContext.approach}</p>
                </div>
              )}
              {role.aiContext.technical && (
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-2">Technical Work</h4>
                  <p className="text-sm text-gray-300 leading-relaxed">{role.aiContext.technical}</p>
                </div>
              )}
              {role.aiContext.lessons && (
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-2">Lessons Learned</h4>
                  <p className="text-sm text-gray-400 italic leading-relaxed">"{role.aiContext.lessons}"</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Experience = ({ experiences, profile }: { experiences: any[], profile: any }) => {
  return (
    <section id="experience" className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-serif font-bold mb-4">Experience</h2>
        <p className="text-gray-400 mb-12">
          Each role includes queryable AI context—the real story behind the bullet points.
        </p>
        
        <div className="space-y-8">
          {experiences.length > 0 ? (
            experiences.map((role, i) => (
              <ExperienceCard key={i} role={role} />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 italic mb-4">No experience data found for profile: {profile?.name || 'Unknown'}</p>
              <p className="text-xs text-gray-600 font-mono">Profile ID: {profile?.id || 'None'}</p>
              <p className="text-xs text-gray-600 mt-2">If you added data in the admin panel, please ensure you have only ONE profile or use the "ULTIMATE NUKE" tool in Admin.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const SkillsMatrix = ({ skills }: { skills: any[] }) => {
  const categories = [
    {
      id: 'strong',
      title: 'STRONG',
      icon: <CheckCircle2 className="text-brand-teal" />,
      accent: 'border-brand-teal/20',
      skillIcon: <Check size={16} className="text-[#FFCB05]" />
    },
    {
      id: 'moderate',
      title: 'MODERATE',
      icon: <CircleChevronRight className="text-brand-teal" />,
      accent: 'border-brand-teal/20',
      skillIcon: <ChevronRight size={16} className="text-brand-teal" />
    },
    {
      id: 'gap',
      title: 'GROWTH',
      icon: <Sprout className="text-brand-teal" />,
      accent: 'border-brand-teal/20',
      skillIcon: <X size={16} className="text-brand-teal" />
    }
  ];

  return (
    <section className="py-20 px-6 bg-white/[0.02]">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {categories.map((cat, i) => {
            const catSkills = skills.filter(s => s.category === cat.id);
            return (
              <div key={i} className={cn("glass p-8 rounded-2xl border-t-4", cat.accent)}>
                <div className="flex items-center gap-3 mb-6">
                  {cat.icon}
                  <h3 className="text-lg font-mono font-bold tracking-widest">{cat.title}</h3>
                </div>
                <ul className="space-y-4">
                  {catSkills.length > 0 ? (
                    catSkills.map((skill, j) => (
                      <li key={j} className="text-gray-300 font-medium flex items-center gap-3">
                        <span className="shrink-0">{cat.skillIcon}</span>
                        <span>{skill.skill_name}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-600 italic text-sm">None listed</li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const JDAnalyzer = ({ fullContext }: { fullContext: any }) => {
  const [jd, setJd] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!jd.trim()) return;
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    try {
      const analysis = await analyzeJD(jd, fullContext);
      if (analysis.headline === "Analysis Error") {
        setError(analysis.opening);
      } else {
        setResult(analysis);
      }
    } catch (error) {
      console.error(error);
      setError("Something went wrong during the analysis. Please try again with a shorter job description.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fillExample = (type: 'strong' | 'weak') => {
    if (type === 'strong') {
      setJd("We are seeking a Senior Director of AI to own enterprise AI strategy and execution. You should bring proven experience transforming fragmented systems into governed, scalable data platforms and delivering measurable impact across revenue, margin, and customer experience. A background in cloud modernization, executive stakeholder alignment, and operationalizing analytics at scale is critical. We value leaders who treat AI as a business lever, not a science project.");
    } else {
      setJd("We are hiring a Senior Director of AI to build and scale a core machine learning research organization. This role requires deep hands-on experience developing, training, and optimizing proprietary models at scale.");
    }
  };

  return (
    <section id="fit-check" className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-serif font-bold mb-4">Honest Fit Assessment</h2>
        <p className="text-gray-400 mb-8">
          Paste a job description. Get an honest assessment of whether I'm the right person—including when I'm not.
        </p>
        
        <div className="flex gap-4 mb-6">
          <button 
            onClick={() => fillExample('strong')}
            className="text-xs font-bold px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
          >
            Strong Fit Example
          </button>
          <button 
            onClick={() => fillExample('weak')}
            className="text-xs font-bold px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
          >
            Weak Fit Example
          </button>
        </div>
        
        <div className="glass rounded-2xl p-6 mb-8">
          <textarea 
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste job description here..."
            className="w-full h-48 bg-transparent border-none focus:ring-0 text-gray-300 resize-none placeholder:text-gray-600"
          />
          <div className="flex justify-end mt-4 items-center gap-4">
            {error && <p className="text-red-400 text-xs font-medium">{error}</p>}
            <button 
              onClick={handleAnalyze}
              disabled={isAnalyzing || !jd.trim() || !fullContext}
              className="bg-brand-teal text-bg-dark px-6 py-3 rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-90 transition-all flex items-center gap-2 min-w-[140px] justify-center"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                'Analyze Fit'
              )}
            </button>
          </div>
        </div>
        
        <AnimatePresence>
          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "glass rounded-2xl overflow-hidden border-t-4",
                result.verdict === 'strong_fit' ? 'border-brand-teal' : 
                result.verdict === 'probably_not' ? 'border-brand-amber' : 'border-gray-500'
              )}
            >
              <div className="p-8">
                <div className={cn(
                  "inline-block px-4 py-1 rounded-full text-black text-xs font-bold mb-6 uppercase tracking-wider",
                  result.verdict === 'strong_fit' ? 'bg-brand-teal' : 
                  result.verdict === 'probably_not' ? 'bg-brand-amber' : 'border-gray-500 bg-gray-500'
                )}>
                  {result.verdict.replace('_', ' ')}
                </div>
                
                <h3 className="text-2xl font-serif font-bold mb-4 text-white">{result.headline}</h3>
                
                <p className="text-lg text-gray-300 mb-8 leading-relaxed italic">
                  "{result.opening}"
                </p>
                
                <div className="space-y-8 mb-8">
                  <div>
                    <h4 className="text-xs font-mono uppercase tracking-widest text-brand-amber mb-4">The Gaps</h4>
                    <div className="grid gap-4">
                      {result.gaps.map((gap: any, i: number) => (
                        <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5">
                          <div className="flex items-start gap-3">
                            <span className="text-brand-amber font-bold mt-1">✗</span>
                            <div>
                              <p className="text-sm font-bold text-white mb-1">{gap.gap_title}</p>
                              <p className="text-xs text-gray-500 mb-2 font-mono uppercase tracking-tighter">Requirement: {gap.requirement}</p>
                              <p className="text-sm text-gray-400">{gap.explanation}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-mono uppercase tracking-widest text-brand-teal mb-4">What Transfers</h4>
                    <div className="p-6 bg-brand-teal/5 rounded-xl border border-brand-teal/10">
                      <p className="text-sm text-gray-300 leading-relaxed">{result.transfers}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                  <h4 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-2">My Recommendation</h4>
                  <p className="text-sm text-gray-300">{result.recommendation}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="mt-12 p-8 border border-dashed border-white/10 rounded-2xl text-center">
          <p className="text-sm text-gray-500 italic">
            "From enterprise infrastructure to AI transformation, I create disciplined systems that convert complexity into measurable business leverage."
          </p>
        </div>
      </div>
    </section>
  );
};

const AIChatDrawer = ({ isOpen, onClose, profile, experiences, fullContext }: { isOpen: boolean, onClose: () => void, profile: any, experiences: any[], fullContext: any }) => {
  const firstName = profile?.name ? profile.name.split(' ')[0] : 'Joe';
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: `Hi! A resume only scratches the surface. Ask me anything about ${firstName}'s professional experience through this interactive AI conversation!` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;
    
    const userMsg = { role: 'user' as const, text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    
    try {
      const history = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      const response = await chatWithAI(text, history, fullContext);
      setMessages(prev => [...prev, { role: 'model', text: response || "I'm sorry, I couldn't process that." }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "Error connecting to AI. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const getSuggestions = () => {
    const base = [
      "What's your biggest weakness?",
      "Tell me about a project that failed"
    ];

    if (experiences && experiences.length > 0) {
      const latest = experiences[0];
      if (latest.is_current) {
        base.push(`What's your favorite part about working at ${latest.company_name}?`);
        base.push(`Why are you looking for a new challenge after ${latest.company_name}?`);
      } else {
        base.push(`Why did you leave ${latest.company_name}?`);
        base.push(`What was your biggest impact at ${latest.company_name}?`);
      }
    } else {
      base.push("What are your core technical strengths?");
      base.push("What kind of roles are you looking for?");
    }

    return base;
  };

  const suggestions = getSuggestions();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-bg-dark border-l border-white/10 z-[70] flex flex-col shadow-2xl"
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-teal flex items-center justify-center text-bg-dark">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="font-bold">Ask AI</h3>
                  <p className="text-[10px] font-mono text-brand-teal uppercase tracking-widest">Online & Ready</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className={cn(
                    "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed",
                    msg.role === 'user' 
                      ? 'bg-brand-teal text-bg-dark font-bold rounded-tr-none' 
                      : 'bg-white/5 border border-white/10 text-gray-300 rounded-tl-none'
                  )}>
                    <div className={cn(msg.role === 'user' ? "" : "markdown-body")}>
                      <Markdown>{msg.text}</Markdown>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-white/10 space-y-4">
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                  <button 
                    key={i}
                    onClick={() => handleSend(s)}
                    className="text-[10px] font-bold px-3 py-1.5 rounded-full border border-white/10 hover:border-brand-teal transition-colors text-gray-400 hover:text-brand-teal"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="relative">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me anything..."
                  className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-6 pr-14 focus:outline-none focus:border-brand-teal transition-colors text-sm"
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-2 w-10 h-10 bg-brand-teal text-bg-dark rounded-full flex items-center justify-center hover:scale-105 transition-all disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const Footer = ({ profile }: { profile: any }) => (
  <footer className="py-20 px-6 border-t border-white/5">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
      <div className="text-center md:text-left">
        <h3 className="text-2xl font-serif font-bold mb-2">{profile?.name || 'Joe Peterlin'}</h3>
        <p className="text-brand-teal font-medium">{profile?.title || 'Full-Stack Engineer & Product Architect'}</p>
      </div>
      
      <div className="flex gap-6">
        <a href={profile?.linkedin_url ? (profile.linkedin_url.startsWith('http') ? profile.linkedin_url : `https://${profile.linkedin_url}`) : "https://linkedin.com/in/joepeterlin"} target="_blank" rel="noopener noreferrer" className="p-3 rounded-full bg-white/5 border border-white/10 hover:text-brand-teal transition-all">
          <Linkedin size={24} />
        </a>
        <a href={profile?.email ? `mailto:${profile.email}` : "mailto:joe.peterli@gmail.com"} className="p-3 rounded-full bg-white/5 border border-white/10 hover:text-brand-teal transition-all">
          <Mail size={24} />
        </a>
      </div>
      
      <p className="text-sm text-gray-500 max-w-xs text-center md:text-right">
        No AI theater. Just scalable platforms, clean data, and measurable impact.
      </p>
    </div>
  </footer>
);

export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [fullContext, setFullContext] = useState<any>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const toggleRole = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch all profiles to find the best one
        // Try base table first to get IDs
        let { data: profileListData, error: pErr } = await supabase
          .from('candidate_profile')
          .select('*')
          .order('updated_at', { ascending: false }) as any;

        // Fallback to public view if base table is blocked
        if (pErr || !profileListData || profileListData.length === 0) {
          console.log('Base profile table blocked or empty, trying public view...');
          const { data: viewData, error: vErr } = await supabase
            .from('candidate_profile_public')
            .select('*')
            .order('updated_at', { ascending: false }) as any;
          
          if (vErr) throw vErr;
          profileListData = viewData;
        }

        if (!profileListData || profileListData.length === 0) {
          console.warn('No profiles found');
          return;
        }

        // 2. Find the best profile (most recent one named Joe Peterlin, or just most recent)
        let profileData = profileListData[0];
        const namedJoe = profileListData.find((p: any) => p.name && p.name.toLowerCase().includes('joe peterlin'));
        const anyNamed = profileListData.find((p: any) => p.name && p.name !== 'Unnamed Candidate');
        
        if (namedJoe) profileData = namedJoe;
        else if (anyNamed) profileData = anyNamed;
        else {
          // Fallback if no profile found at all
          profileData = {
            name: 'Joe Peterlin',
            email: 'joe.peterli@gmail.com',
            linkedin_url: 'https://linkedin.com/in/joepeterlin',
            title: 'Digital Workplace – Collaboration & AI Transformation Lead',
            availability_status: 'Open to Senior/Staff Roles'
          };
        }

        console.log('Using profile:', profileData.name, profileData.id || 'NO_ID');
        console.log('Target roles from DB (raw):', profileData.target_company_stages);
        setProfile(profileData);
        
        // Initialize selected roles from profile data
        let roles = profileData.target_company_stages;
        if (roles && typeof roles === 'string') {
          try {
            // Handle Postgres array format "{Role1,Role2}" or JSON "[\"Role1\"]"
            if (roles.startsWith('{')) {
              roles = roles.slice(1, -1).split(',').map(r => r.trim().replace(/^"|"$/g, ''));
            } else if (roles.startsWith('[')) {
              roles = JSON.parse(roles);
            }
          } catch (e) {
            console.error('Error parsing roles:', e);
          }
        }
        
        if (roles && Array.isArray(roles)) {
          const validRoles = roles.filter(r => typeof r === 'string' && r.length > 0);
          console.log('Setting selected roles to:', validRoles);
          setSelectedRoles(validRoles);
        }

        // 3. Fetch everything for THIS specific profile
        // If we have an ID, we use it. If not (from public view), we fetch all and hope for the best
        const idFilter = profileData.id ? { candidate_id: profileData.id } : {};
        
        const fetchFromTable = async (table: string, publicTable: string) => {
          // Try base table first
          let { data, error } = await (profileData.id 
            ? supabase.from(table).select('*').eq('candidate_id', profileData.id)
            : supabase.from(table).select('*')) as any;
          
          if (error || !data) {
            console.log(`Base table ${table} blocked, trying ${publicTable}...`);
            const { data: vData } = await supabase.from(publicTable).select('*') as any;
            return vData || [];
          }
          return data;
        };

        const [expData, skillsData, gapsDataRes, valuesDataRes, faqDataRes, aiInstrDataRes] = await Promise.all([
          fetchFromTable('experiences', 'experiences_public'),
          fetchFromTable('skills', 'skills_public'),
          profileData.id ? supabase.from('gaps_weaknesses').select('*').eq('candidate_id', profileData.id) : supabase.from('gaps_weaknesses').select('*'),
          profileData.id ? supabase.from('values_culture').select('*').eq('candidate_id', profileData.id).limit(1) : supabase.from('values_culture').select('*').limit(1),
          profileData.id ? supabase.from('faq_responses').select('*').eq('candidate_id', profileData.id) : supabase.from('faq_responses').select('*'),
          profileData.id ? supabase.from('ai_instructions').select('*').eq('candidate_id', profileData.id).order('priority', { ascending: true }) : supabase.from('ai_instructions').select('*').order('priority', { ascending: true })
        ]);

        const gapsData = gapsDataRes.data;
        const valuesData = valuesDataRes.data;
        const faqData = faqDataRes.data;
        const aiInstrData = aiInstrDataRes.data;

        let mappedExps: any[] = [];
        if (expData) {
          console.log(`Loaded ${expData.length} experiences`);
          mappedExps = expData.map((exp: any) => ({
            ...exp,
            aiContext: {
              situation: exp.why_joined,
              approach: exp.actual_contributions,
              technical: exp.challenges_faced,
              lessons: exp.lessons_learned
            }
          }));
          // Sort by display_order if it exists
          mappedExps.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
          setExperiences(mappedExps);
        }
        
        if (skillsData) {
          setSkills(skillsData);
        }

        // Set full context for AI
        setFullContext({
          profile: profileData,
          experiences: mappedExps,
          skills: skillsData || [],
          gaps: gapsData || [],
          values: valuesData?.[0] || {},
          faqs: faqData || [],
          aiInstructions: aiInstrData || []
        });
      } catch (err) {
        console.error('Error fetching public data:', err);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar onOpenChat={() => setIsChatOpen(true)} profile={profile} />
      
      <main>
        <Hero 
          onOpenChat={() => setIsChatOpen(true)} 
          profile={profile} 
          selectedRoles={selectedRoles}
          onToggleRole={toggleRole}
        />
        <Experience experiences={experiences} profile={profile} />
        <SkillsMatrix skills={skills} />
        <JDAnalyzer fullContext={fullContext} />
      </main>
      
      <Footer profile={profile} />
      
      <AIChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} profile={profile} experiences={experiences} fullContext={fullContext} />
    </div>
  );
}
