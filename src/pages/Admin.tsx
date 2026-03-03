import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { 
  User, Briefcase, Award, AlertTriangle, Heart, HelpCircle, 
  Settings, Save, LogOut, ExternalLink, Plus, Trash2, 
  ChevronDown, ChevronUp, Check, AlertCircle, Clock, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

type Tab = 'profile' | 'experience' | 'skills' | 'gaps' | 'values' | 'faq' | 'ai';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const navigate = useNavigate();

  // State for all data
  const [profile, setProfile] = useState<any>({});
  const [experiences, setExperiences] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [gaps, setGaps] = useState<any[]>([]);
  const [values, setValues] = useState<any>({});
  const [faqs, setFaqs] = useState<any[]>([]);
  const [aiInstructions, setAiInstructions] = useState<any[]>([]);

  const [loadingStatus, setLoadingStatus] = useState('Initializing...');

  const [profiles, setProfiles] = useState<any[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

  const fetchData = async () => {
    if (!isSupabaseConfigured) {
      setMessage({ type: 'error', text: 'Supabase is not configured. Please set your environment variables.' });
      setLoading(false);
      return;
    }

    // Only show full screen loader if we don't have a profile yet
    if (!profile.id) setLoading(true);
    setLoadingStatus('Connecting to Supabase...');
    
    // Add a safety timeout
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setMessage({ type: 'error', text: 'Loading timed out. Please check your Supabase connection.' });
      }
    }, 15000);

    try {
      setLoadingStatus('Fetching profiles...');
      // Get all profiles to allow switching if multiple exist
      const { data: profileListData, error: profileError } = await (supabase
        .from('candidate_profile') as any)
        .select('*')
        .order('updated_at', { ascending: false });

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        throw profileError;
      }
      
      console.log('Detected profiles:', profileListData?.length, profileListData);
      setProfiles(profileListData || []);
      
      const profileData = activeProfileId 
        ? (profileListData?.find(p => p.id === activeProfileId) || profileListData?.[0])
        : profileListData?.[0];
      
      if (profileData) {
        setProfile(profileData);
        setActiveProfileId(profileData.id);
        setLoadingStatus('Fetching portfolio data...');
        
        // If profile exists, fetch everything else related to this candidate
        const [
          { data: expData, error: expErr },
          { data: skillsData, error: skillErr },
          { data: gapsData, error: gapErr },
          { data: valuesListData, error: valErr },
          { data: faqData, error: faqErr },
          { data: aiData, error: aiErr }
        ] = await Promise.all([
          (supabase.from('experiences') as any).select('*').eq('candidate_id', (profileData as any).id).order('display_order', { ascending: true }),
          (supabase.from('skills') as any).select('*').eq('candidate_id', (profileData as any).id),
          (supabase.from('gaps_weaknesses') as any).select('*').eq('candidate_id', (profileData as any).id),
          (supabase.from('values_culture') as any).select('*').eq('candidate_id', (profileData as any).id).limit(1),
          (supabase.from('faq_responses') as any).select('*').eq('candidate_id', (profileData as any).id),
          (supabase.from('ai_instructions') as any).select('*').eq('candidate_id', (profileData as any).id).order('priority', { ascending: true })
        ]);

        if (expData) setExperiences(expData);
        if (skillsData) setSkills(skillsData);
        if (gapsData) setGaps(gapsData);
        if (valuesListData?.[0]) setValues(valuesListData[0]);
        if (faqData) setFaqs(faqData);
        if (aiData) setAiInstructions(aiData);
      } else {
        // No profiles found, initialize with defaults
        setProfile({ 
          name: 'Joe Peterlin',
          email: 'joe.peterli@gmail.com',
          linkedin_url: 'https://linkedin.com/in/joepeterlin'
        });
      }
      clearTimeout(timeoutId);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to fetch data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      if (!loading && !saving) {
        // We don't want to show success message for auto-save to avoid distraction
        handleSave(true);
      }
    }, 60000); // Auto-save every minute

    return () => clearInterval(timer);
  }, [profile, experiences, skills, gaps, values, faqs, aiInstructions, loading, saving]);

  const handleProfileSwitch = (id: string) => {
    setActiveProfileId(id);
  };

  useEffect(() => {
    fetchData();
  }, [activeProfileId]);

  const handleSave = async (isAutoSave = false) => {
    // Don't auto-save if we don't have an ID yet - we want the first save to be manual
    if (isAutoSave && !profile.id) return;
    
    if (!isAutoSave) setSaving(true);
    if (!isAutoSave) setMessage(null);
    try {
      // 1. Upsert Profile first to get/ensure ID
      // If profile is empty, we need at least a name to satisfy NOT NULL constraint
      const profileToSave = { ...profile };
      if (!profileToSave.name) profileToSave.name = 'Unnamed Candidate';
      
      const { data: savedProfileData, error: pErr } = await (supabase
        .from('candidate_profile') as any)
        .upsert(profileToSave)
        .select();
        
      if (pErr) throw pErr;
      const savedProfile = savedProfileData?.[0];
      if (!savedProfile) throw new Error('Failed to save profile - no data returned');
      
      const candidateId = savedProfile.id;
      setProfile(savedProfile);

      // 2. Values
      const valuesToSave = { ...values, candidate_id: candidateId };
      const { data: savedValuesData, error: vErr } = await (supabase
        .from('values_culture') as any)
        .upsert(valuesToSave)
        .select();
      if (vErr) throw vErr;
      const savedValues = savedValuesData?.[0];
      if (savedValues) setValues(savedValues);

      // 3. Experiences
      const experiencesToSave = experiences.map(exp => {
        const { id, created_at, ...rest } = exp;
        return { ...rest, candidate_id: candidateId, ...(id && id.length > 10 ? { id } : {}) };
      });
      if (experiencesToSave.length > 0) {
        const { data: savedExps, error: eErr } = await (supabase
          .from('experiences') as any)
          .upsert(experiencesToSave as any)
          .select();
        if (eErr) throw eErr;
        if (savedExps) setExperiences(savedExps);
      }

      // 4. Skills
      const skillsToSave = skills.map(s => {
        const { id, created_at, ...rest } = s;
        return { ...rest, candidate_id: candidateId, ...(id && id.length > 10 ? { id } : {}) };
      });
      if (skillsToSave.length > 0) {
        const { data: savedSkills, error: sErr } = await (supabase
          .from('skills') as any)
          .upsert(skillsToSave as any)
          .select();
        if (sErr) throw sErr;
        if (savedSkills) setSkills(savedSkills);
      }

      // 5. Gaps
      const gapsToSave = gaps.map(g => {
        const { id, created_at, ...rest } = g;
        return { ...rest, candidate_id: candidateId, ...(id && id.length > 10 ? { id } : {}) };
      });
      if (gapsToSave.length > 0) {
        const { data: savedGaps, error: gErr } = await (supabase
          .from('gaps_weaknesses') as any)
          .upsert(gapsToSave as any)
          .select();
        if (gErr) throw gErr;
        if (savedGaps) setGaps(savedGaps);
      }

      // 6. FAQs
      const faqsToSave = faqs.map(f => {
        const { id, created_at, ...rest } = f;
        return { ...rest, candidate_id: candidateId, ...(id && id.length > 10 ? { id } : {}) };
      });
      if (faqsToSave.length > 0) {
        const { data: savedFaqs, error: fErr } = await (supabase
          .from('faq_responses') as any)
          .upsert(faqsToSave as any)
          .select();
        if (fErr) throw fErr;
        if (savedFaqs) setFaqs(savedFaqs);
      }

      // 7. AI Instructions
      const aiToSave = aiInstructions.map(i => {
        const { id, created_at, ...rest } = i;
        return { ...rest, candidate_id: candidateId, ...(id && id.length > 10 ? { id } : {}) };
      });
      if (aiToSave.length > 0) {
        const { data: savedAi, error: aiErr } = await (supabase
          .from('ai_instructions') as any)
          .upsert(aiToSave as any)
          .select();
        if (aiErr) throw aiErr;
        if (savedAi) setAiInstructions(savedAi);
      }

      if (!isAutoSave) setMessage({ type: 'success', text: 'All changes saved successfully!' });
    } catch (err: any) {
      console.error('Save error:', err);
      let errorMsg = err.message || 'Failed to save changes.';
      if (err.message?.includes('permission denied')) {
        errorMsg = 'Permission denied. Please check your Supabase RLS policies.';
      } else if (err.message?.includes('relation') && err.message?.includes('does not exist')) {
        errorMsg = 'Database table not found. Please run the SQL schema in Supabase.';
      }
      if (!isAutoSave) setMessage({ type: 'error', text: errorMsg });
    } finally {
      if (!isAutoSave) setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-4 border-brand-teal/30 border-t-brand-teal rounded-full animate-spin" />
        <p className="text-gray-500 font-mono text-xs animate-pulse uppercase tracking-widest">{loadingStatus}</p>
        {message && (
          <div className="mt-4 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm">
            {message.text}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-dark text-white flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 flex flex-col fixed h-full">
        <div className="p-6 border-b border-white/10">
          <div className="text-xl font-serif font-bold tracking-tighter">
            JP<span className="text-brand-teal">.</span> Admin
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User size={18} />} label="Profile" />
          <TabButton active={activeTab === 'experience'} onClick={() => setActiveTab('experience')} icon={<Briefcase size={18} />} label="Experience" />
          <TabButton active={activeTab === 'skills'} onClick={() => setActiveTab('skills')} icon={<Award size={18} />} label="Skills" />
          <TabButton active={activeTab === 'gaps'} onClick={() => setActiveTab('gaps')} icon={<AlertTriangle size={18} />} label="Gaps" />
          <TabButton active={activeTab === 'values'} onClick={() => setActiveTab('values')} icon={<Heart size={18} />} label="Values & Culture" />
          <TabButton active={activeTab === 'faq'} onClick={() => setActiveTab('faq')} icon={<HelpCircle size={18} />} label="FAQ" />
          <TabButton active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} icon={<Settings size={18} />} label="AI Instructions" />
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
          <button 
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
          >
            <ExternalLink size={18} />
            View Site
          </button>
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-10 pb-32">
        <header className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-serif font-bold capitalize">{activeTab} Management</h1>
            <p className="text-gray-400">Manage your portfolio data and AI context.</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => fetchData()}
              disabled={loading || saving}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
              title="Refresh Data"
            >
              <Clock className={cn("w-5 h-5", loading && "animate-spin")} />
            </button>
            {message && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm flex items-center gap-2",
                  message.type === 'success' ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                )}
              >
                {message.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                {message.text}
              </motion.div>
            )}
            <button 
              onClick={() => handleSave()}
              disabled={saving}
              className="bg-brand-teal text-bg-dark font-medium px-6 py-2 rounded-full flex items-center gap-2 hover:bg-opacity-90 transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? <div className="w-4 h-4 border-2 border-bg-dark/30 border-t-bg-dark rounded-full animate-spin" /> : <Save size={18} />}
              Save All Changes
            </button>
          </div>
        </header>

        <div className="max-w-4xl">
          {activeTab === 'profile' && (
            <ProfileTab 
              data={profile} 
              onChange={setProfile} 
              profiles={profiles} 
              onSwitch={handleProfileSwitch} 
              setSaving={setSaving}
              saving={saving}
            />
          )}
          {activeTab === 'experience' && <ExperienceTab data={experiences} onChange={setExperiences} />}
          {activeTab === 'skills' && <SkillsTab data={skills} onChange={setSkills} />}
          {activeTab === 'gaps' && <GapsTab data={gaps} onChange={setGaps} />}
          {activeTab === 'values' && <ValuesTab data={values} onChange={setValues} />}
          {activeTab === 'faq' && <FaqTab data={faqs} onChange={setFaqs} />}
          {activeTab === 'ai' && <AiTab data={aiInstructions} onChange={setAiInstructions} />}
        </div>
      </main>
    </div>
  );
}

const TabButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={() => {
      console.log(`Tab clicked: ${label}`);
      onClick();
    }}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all",
      active ? "bg-brand-teal text-bg-dark" : "text-gray-400 hover:text-white hover:bg-white/5"
    )}
  >
    {icon}
    {label}
  </button>
);

const ProfileTab = ({ data, onChange, profiles, onSwitch, setSaving, saving }: { data: any, onChange: (d: any) => void, profiles: any[], onSwitch: (id: string) => void, setSaving: (s: boolean) => void, saving: boolean }) => {
  const [showNukeConfirm, setShowNukeConfirm] = useState(false);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);

  const handleChange = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleNuke = async () => {
    console.log('handleNuke started');
    const currentId = data.id;
    if (!currentId) {
      alert('Error: Current profile has no ID. Save it first.');
      return;
    }

    setSaving(true);
    setShowNukeConfirm(false);
    try {
      // 1. Get all other profile IDs explicitly
      const { data: allProfiles, error: fetchErr } = await (supabase.from('candidate_profile') as any).select('id');
      if (fetchErr) throw fetchErr;
      
      const otherIds = allProfiles?.filter((p: any) => p.id !== currentId).map((p: any) => p.id) || [];
      console.log('Found other profile IDs to delete:', otherIds);

      if (otherIds.length === 0) {
        alert('No other profiles found to delete.');
        setSaving(false);
        return;
      }

      const tables = ['experiences', 'skills', 'gaps_weaknesses', 'values_culture', 'faq_responses', 'ai_instructions'];
      
      // 2. Delete related records for other profiles
      for (const table of tables) {
        console.log(`Cleaning table ${table} for other profiles...`);
        const { error: delErr } = await (supabase.from(table) as any).delete().in('candidate_id', otherIds);
        if (delErr) console.warn(`Error cleaning ${table}:`, delErr);
      }
      
      // 3. Delete other profiles
      console.log('Deleting other profiles...');
      const { error: pErr } = await (supabase.from('candidate_profile') as any).delete().in('id', otherIds);
      if (pErr) throw pErr;
      
      // 4. Final cleanup of any orphans
      for (const table of tables) {
        await (supabase.from(table) as any).delete().is('candidate_id', null);
      }
      
      alert(`Cleanup successful. Deleted ${otherIds.length} other profiles.`);
      window.location.reload();
    } catch (err: any) {
      console.error('Nuke error:', err);
      alert('Cleanup failed: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleWipe = async () => {
    console.log('handleWipe started');
    setSaving(true);
    setShowWipeConfirm(false);
    try {
      const subTables = ['experiences', 'skills', 'gaps_weaknesses', 'values_culture', 'faq_responses', 'ai_instructions'];
      for (const table of subTables) {
        console.log(`Wiping sub-table: ${table}`);
        const { error } = await (supabase.from(table) as any).delete().not('id', 'is', null);
        if (error) console.warn(`Wipe error for ${table}:`, error);
      }
      
      console.log('Wiping candidate_profile table');
      const { error: pErr } = await (supabase.from('candidate_profile') as any).delete().not('id', 'is', null);
      if (pErr) throw pErr;
      
      alert('Database wiped. Starting fresh.');
      window.location.reload();
    } catch (err: any) {
      console.error('Wipe error:', err);
      alert('Wipe failed: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Custom Confirmation Modals */}
      <AnimatePresence>
        {(showNukeConfirm || showWipeConfirm) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-bg-dark border border-white/10 p-8 rounded-3xl max-w-md w-full shadow-2xl"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-6 mx-auto">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-2xl font-serif font-bold text-center mb-2">
                {showNukeConfirm ? 'Ultimate Nuke' : 'Total Wipe'}
              </h3>
              <p className="text-gray-400 text-center mb-8">
                {showNukeConfirm 
                  ? `This will delete EVERY other profile and ALL records not linked to "${data.name || 'this profile'}". This is irreversible.`
                  : 'This will delete EVERY SINGLE RECORD in your database. You will start with a completely blank portfolio.'}
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => { setShowNukeConfirm(false); setShowWipeConfirm(false); }}
                  className="flex-1 px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all font-bold"
                >
                  CANCEL
                </button>
                <button 
                  onClick={showNukeConfirm ? handleNuke : handleWipe}
                  className="flex-1 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 transition-all font-bold text-white shadow-lg shadow-red-600/20"
                >
                  PROCEED
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {profiles.length > 1 && (
        <div className="p-4 rounded-xl bg-brand-teal/10 border border-brand-teal/20 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-brand-teal uppercase tracking-wider mb-1">Multiple Profiles Detected</h4>
              <p className="text-xs text-gray-400">We found {profiles.length} profile records. Switch below if you're seeing the wrong data.</p>
            </div>
            <div className="flex items-center gap-2">
              <select 
                value={data.id} 
                onChange={(e) => onSwitch(e.target.value)}
                className="bg-bg-dark border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:ring-brand-teal focus:border-brand-teal"
              >
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name || 'Unnamed'} ({new Date(p.updated_at).toLocaleString()})
                  </option>
                ))}
              </select>
              <button 
                onClick={() => setShowNukeConfirm(true)}
                disabled={saving}
                className={cn(
                  "px-4 py-2 bg-red-600 text-white border border-red-800 rounded-lg text-xs font-bold transition-all shadow-lg flex items-center gap-2",
                  saving ? "opacity-50 cursor-not-allowed" : "hover:bg-red-700 active:scale-95"
                )}
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'ULTIMATE NUKE'}
              </button>
              <button 
                onClick={() => setShowWipeConfirm(true)}
                disabled={saving}
                className={cn(
                  "px-4 py-2 bg-black text-red-500 border border-red-900 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                  saving ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-900 active:scale-95"
                )}
                title="Delete everything and start over"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'TOTAL WIPE'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <Input label="Full Name" value={data.name || ''} onChange={(v) => handleChange('name', v)} />
        <Input label="Email" value={data.email || ''} onChange={(v) => handleChange('email', v)} />
        <Input label="Current Title" value={data.title || ''} onChange={(v) => handleChange('title', v)} />
        <Input label="Location" value={data.location || ''} onChange={(v) => handleChange('location', v)} />
      </div>

      <div className="space-y-4">
        <label className="block text-xs font-mono uppercase tracking-widest text-gray-500">Target roles</label>
        <div className="flex flex-wrap gap-4">
          {['Director', 'Sr. Director', 'VP AI', 'CAIO', 'CDAIO'].map(role => (
            <label key={role} className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={data.target_company_stages?.includes(role)}
                onChange={(e) => {
                  const current = data.target_company_stages || [];
                  const next = e.target.checked ? [...current, role] : current.filter((r: string) => r !== role);
                  handleChange('target_company_stages', next);
                }}
                className="w-4 h-4 rounded border-white/10 bg-white/5 text-brand-teal focus:ring-brand-teal"
              />
              <span className="text-sm text-gray-400 group-hover:text-white transition-colors">{role}</span>
            </label>
          ))}
        </div>
      </div>

      <Textarea label="Elevator Pitch (2-3 sentences)" value={data.elevator_pitch || ''} onChange={(v) => handleChange('elevator_pitch', v)} />
      <Textarea label="Career Narrative (Your story)" value={data.career_narrative || ''} onChange={(v) => handleChange('career_narrative', v)} rows={6} />
      
      <div className="grid grid-cols-2 gap-6">
        <Textarea label="What you're looking for" value={data.looking_for || ''} onChange={(v) => handleChange('looking_for', v)} />
        <Textarea label="What you're NOT looking for" value={data.not_looking_for || ''} onChange={(v) => handleChange('not_looking_for', v)} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Textarea label="Management Style" value={data.management_style || ''} onChange={(v) => handleChange('management_style', v)} />
        <Textarea label="Work Style Preferences" value={data.work_style || ''} onChange={(v) => handleChange('work_style', v)} />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Input label="Salary Min" type="number" value={data.salary_min || ''} onChange={(v) => handleChange('salary_min', parseInt(v))} />
        <Input label="Salary Max" type="number" value={data.salary_max || ''} onChange={(v) => handleChange('salary_max', parseInt(v))} />
        <Select 
          label="Availability" 
          value={data.availability_status || ''} 
          onChange={(v) => handleChange('availability_status', v)}
          options={[
            { value: 'Actively looking', label: 'Actively looking' },
            { value: 'Open to opportunities', label: 'Open to opportunities' },
            { value: 'Not looking', label: 'Not looking' }
          ]}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Input label="Available Starting" type="date" value={data.availability_date || ''} onChange={(v) => handleChange('availability_date', v)} />
        <Select 
          label="Remote Preference" 
          value={data.remote_preference || ''} 
          onChange={(v) => handleChange('remote_preference', v)}
          options={[
            { value: 'Remote only', label: 'Remote only' },
            { value: 'Hybrid', label: 'Hybrid' },
            { value: 'On-site', label: 'On-site' },
            { value: 'Flexible', label: 'Flexible' }
          ]}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Input label="LinkedIn URL" value={data.linkedin_url || ''} onChange={(v) => handleChange('linkedin_url', v)} />
      </div>
    </div>
  );
};

const ExperienceTab = ({ data, onChange }: { data: any[], onChange: (d: any[]) => void }) => {
  const [expanded, setExpanded] = useState<string | null>(null);

  const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  const addExperience = () => {
    const newExp = {
      id: generateId(),
      company_name: 'New Company',
      title: 'New Role',
      bullet_points: [],
      display_order: data.length,
      is_current: false
    };
    onChange([...data, newExp]);
    setExpanded(newExp.id);
  };

  const updateExp = (id: string, updates: any) => {
    onChange(data.map(exp => exp.id === id ? { ...exp, ...updates } : exp));
  };

  const deleteExp = (id: string) => {
    if (confirm('Are you sure you want to delete this experience?')) {
      onChange(data.filter(exp => exp.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-serif font-bold">Work History</h2>
        <button onClick={addExperience} className="flex items-center gap-2 text-brand-teal hover:bg-brand-teal/10 px-4 py-2 rounded-lg transition-all">
          <Plus size={18} />
          Add Experience
        </button>
      </div>

      <div className="space-y-4">
        {data.map((exp) => (
          <div key={exp.id} className="glass rounded-2xl overflow-hidden">
            <div 
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all"
              onClick={() => setExpanded(expanded === exp.id ? null : exp.id)}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-400">
                  <Briefcase size={20} />
                </div>
                <div>
                  <h3 className="font-bold">{exp.company_name}</h3>
                  <p className="text-xs text-gray-500">{exp.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={(e) => { e.stopPropagation(); deleteExp(exp.id); }} className="p-2 text-gray-500 hover:text-red-400 transition-colors">
                  <Trash2 size={18} />
                </button>
                {expanded === exp.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </div>

            <AnimatePresence>
              {expanded === exp.id && (
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-6 border-t border-white/10 space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                      <Input label="Company Name" value={exp.company_name || ''} onChange={(v) => updateExp(exp.id, { company_name: v })} />
                      <Input label="Title" value={exp.title || ''} onChange={(v) => updateExp(exp.id, { title: v })} />
                      <Input label="Title Progression" value={exp.title_progression || ''} onChange={(v) => updateExp(exp.id, { title_progression: v })} placeholder="e.g. Senior → Staff" />
                      <div className="grid grid-cols-2 gap-4">
                        <Input label="Start Date" type="date" value={exp.start_date || ''} onChange={(v) => updateExp(exp.id, { start_date: v })} />
                        <Input label="End Date" type="date" value={exp.end_date || ''} onChange={(v) => updateExp(exp.id, { end_date: v })} disabled={exp.is_current} />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={!!exp.is_current}
                        onChange={(e) => updateExp(exp.id, { is_current: e.target.checked })}
                        className="w-4 h-4 rounded border-white/10 bg-white/5 text-brand-teal focus:ring-brand-teal"
                      />
                      <span className="text-sm text-gray-400">I currently work here</span>
                    </label>

                    <div className="space-y-4">
                      <label className="block text-xs font-mono uppercase tracking-widest text-gray-500">Achievement Bullets</label>
                      <div className="space-y-2">
                        {(exp.bullet_points || []).map((bullet: string, i: number) => (
                          <div key={i} className="flex gap-2">
                            <input 
                              value={bullet || ''}
                              onChange={(e) => {
                                const next = [...exp.bullet_points];
                                next[i] = e.target.value;
                                updateExp(exp.id, { bullet_points: next });
                              }}
                              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brand-teal"
                            />
                            <button 
                              onClick={() => {
                                const next = exp.bullet_points.filter((_: any, idx: number) => idx !== i);
                                updateExp(exp.id, { bullet_points: next });
                              }}
                              className="p-2 text-gray-500 hover:text-red-400"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                        <button 
                          onClick={() => updateExp(exp.id, { bullet_points: [...(exp.bullet_points || []), ''] })}
                          className="text-xs text-brand-teal hover:underline flex items-center gap-1"
                        >
                          <Plus size={14} /> Add Bullet
                        </button>
                      </div>
                    </div>

                    <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-6">
                      <div className="flex items-center gap-2 text-brand-amber">
                        <AlertTriangle size={18} />
                        <h4 className="text-sm font-bold uppercase tracking-widest">Private AI Context</h4>
                      </div>
                      <p className="text-xs text-gray-500">This data is NOT shown on the site. It's only used by the AI to answer questions honestly.</p>
                      
                      <div className="grid grid-cols-2 gap-6">
                        <Textarea label="Why did you join?" value={exp.why_joined || ''} onChange={(v) => updateExp(exp.id, { why_joined: v })} />
                        <Textarea label="Why did you leave?" value={exp.why_left || ''} onChange={(v) => updateExp(exp.id, { why_left: v })} />
                        <Textarea label="What did YOU actually do?" value={exp.actual_contributions || ''} onChange={(v) => updateExp(exp.id, { actual_contributions: v })} />
                        <Textarea label="Proudest achievement" value={exp.proudest_achievement || ''} onChange={(v) => updateExp(exp.id, { proudest_achievement: v })} />
                        <Textarea label="What would you do differently?" value={exp.would_do_differently || ''} onChange={(v) => updateExp(exp.id, { would_do_differently: v })} />
                        <Textarea label="Challenges faced" value={exp.challenges_faced || ''} onChange={(v) => updateExp(exp.id, { challenges_faced: v })} />
                        <Textarea label="Lessons learned" value={exp.lessons_learned || ''} onChange={(v) => updateExp(exp.id, { lessons_learned: v })} />
                        <Textarea label="What would your manager say?" value={exp.manager_would_say || ''} onChange={(v) => updateExp(exp.id, { manager_would_say: v })} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

const SkillsTab = ({ data, onChange }: { data: any[], onChange: (d: any[]) => void }) => {
  const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  const addSkill = () => {
    onChange([...data, { id: generateId(), skill_name: 'New Skill', category: 'moderate', self_rating: 3 }]);
  };

  const updateSkill = (id: string, updates: any) => {
    onChange(data.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-serif font-bold">Skills Matrix</h2>
        <button onClick={addSkill} className="flex items-center gap-2 text-brand-teal hover:bg-brand-teal/10 px-4 py-2 rounded-lg transition-all">
          <Plus size={18} />
          Add Skill
        </button>
      </div>

      <div className="grid gap-4">
        {data.map(skill => (
          <div key={skill.id} className="glass p-6 rounded-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 grid grid-cols-2 gap-4">
                <Input label="Skill Name" value={skill.skill_name || ''} onChange={(v) => updateSkill(skill.id, { skill_name: v })} />
                <Select 
                  label="Category" 
                  value={skill.category || ''} 
                  onChange={(v) => updateSkill(skill.id, { category: v })}
                  options={[
                    { value: 'strong', label: 'Strong' },
                    { value: 'moderate', label: 'Moderate' },
                    { value: 'gap', label: 'Gap' }
                  ]}
                />
              </div>
              <button onClick={() => onChange(data.filter(s => s.id !== skill.id))} className="ml-4 p-2 text-gray-500 hover:text-red-400">
                <Trash2 size={18} />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono uppercase tracking-widest text-gray-500">
                <span>Self Rating</span>
                <span>{skill.self_rating}/5</span>
              </div>
              <input 
                type="range" min="1" max="5" step="1"
                value={skill.self_rating || 3}
                onChange={(e) => updateSkill(skill.id, { self_rating: parseInt(e.target.value) })}
                className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-brand-teal"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Textarea label="Evidence" value={skill.evidence || ''} onChange={(v) => updateSkill(skill.id, { evidence: v })} placeholder="Projects, years, certifications..." />
              <Textarea label="Honest Notes" value={skill.honest_notes || ''} onChange={(v) => updateSkill(skill.id, { honest_notes: v })} placeholder="e.g. Haven't used this in 2 years" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const GapsTab = ({ data, onChange }: { data: any[], onChange: (d: any[]) => void }) => {
  const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  const addGap = () => {
    onChange([...data, { id: generateId(), gap_type: 'skill', description: 'New Gap', interest_in_learning: true }]);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-serif font-bold">Gaps & Weaknesses</h2>
          <p className="text-sm text-gray-500">Be honest about your gaps—this is what makes the AI valuable.</p>
        </div>
        <button onClick={addGap} className="flex items-center gap-2 text-brand-teal hover:bg-brand-teal/10 px-4 py-2 rounded-lg transition-all">
          <Plus size={18} />
          Add Gap
        </button>
      </div>

      <div className="grid gap-4">
        {data.map(gap => (
          <div key={gap.id} className="glass p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <Select 
                label="Gap Type" 
                value={gap.gap_type || ''} 
                onChange={(v) => onChange(data.map(g => g.id === gap.id ? { ...g, gap_type: v } : g))}
                options={[
                  { value: 'skill', label: 'Skill Gap' },
                  { value: 'experience', label: 'Experience Gap' },
                  { value: 'environment', label: 'Environment Mismatch' },
                  { value: 'role_type', label: 'Role Type Mismatch' }
                ]}
              />
              <button onClick={() => onChange(data.filter(g => g.id !== gap.id))} className="p-2 text-gray-500 hover:text-red-400">
                <Trash2 size={18} />
              </button>
            </div>
            <Input label="Description" value={gap.description || ''} onChange={(v) => onChange(data.map(g => g.id === gap.id ? { ...g, description: v } : g))} />
            <Textarea label="Why it's a gap" value={gap.why_its_a_gap || ''} onChange={(v) => onChange(data.map(g => g.id === gap.id ? { ...g, why_its_a_gap: v } : g))} />
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={!!gap.interest_in_learning}
                onChange={(e) => onChange(data.map(g => g.id === gap.id ? { ...g, interest_in_learning: e.target.checked } : g))}
                className="w-4 h-4 rounded border-white/10 bg-white/5 text-brand-teal focus:ring-brand-teal"
              />
              <span className="text-sm text-gray-400">Interested in learning?</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

const ValuesTab = ({ data, onChange }: { data: any, onChange: (d: any) => void }) => {
  const handleChange = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-6">
        <Textarea label="Must-haves in a company" value={data.must_haves?.join('\n') || ''} onChange={(v) => handleChange('must_haves', v.split('\n'))} placeholder="One per line" />
        <Textarea label="Dealbreakers" value={data.dealbreakers?.join('\n') || ''} onChange={(v) => handleChange('dealbreakers', v.split('\n'))} placeholder="One per line" />
      </div>
      <Textarea label="Management Style Preferences" value={data.management_style_preferences || ''} onChange={(v) => handleChange('management_style_preferences', v)} />
      <Input label="Team Size Preferences" value={data.team_size_preferences || ''} onChange={(v) => handleChange('team_size_preferences', v)} />
      <Textarea label="How do you handle conflict?" value={data.how_handle_conflict || ''} onChange={(v) => handleChange('how_handle_conflict', v)} />
      <Textarea label="How do you handle ambiguity?" value={data.how_handle_ambiguity || ''} onChange={(v) => handleChange('how_handle_ambiguity', v)} />
      <Textarea label="How do you handle failure?" value={data.how_handle_failure || ''} onChange={(v) => handleChange('how_handle_failure', v)} />
    </div>
  );
};

const FaqTab = ({ data, onChange }: { data: any[], onChange: (d: any[]) => void }) => {
  const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  const addFaq = () => {
    onChange([...data, { id: generateId(), question: 'New Question', answer: '', is_common_question: false }]);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-serif font-bold">Common Questions</h2>
        <button onClick={addFaq} className="flex items-center gap-2 text-brand-teal hover:bg-brand-teal/10 px-4 py-2 rounded-lg transition-all">
          <Plus size={18} />
          Add FAQ
        </button>
      </div>

      <div className="grid gap-4">
        {data.map(faq => (
          <div key={faq.id} className="glass p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <Input label="Question" value={faq.question || ''} onChange={(v) => onChange(data.map(f => f.id === faq.id ? { ...f, question: v } : f))} />
              <button onClick={() => onChange(data.filter(f => f.id !== faq.id))} className="ml-4 p-2 text-gray-500 hover:text-red-400">
                <Trash2 size={18} />
              </button>
            </div>
            <Textarea label="Answer" value={faq.answer || ''} onChange={(v) => onChange(data.map(f => f.id === faq.id ? { ...f, answer: v } : f))} />
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={!!faq.is_common_question}
                onChange={(e) => onChange(data.map(f => f.id === faq.id ? { ...f, is_common_question: e.target.checked } : f))}
                className="w-4 h-4 rounded border-white/10 bg-white/5 text-brand-teal focus:ring-brand-teal"
              />
              <span className="text-sm text-gray-400">Mark as common question</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

const AiTab = ({ data, onChange }: { data: any[], onChange: (d: any[]) => void }) => {
  const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  const addInstruction = () => {
    onChange([...data, { id: generateId(), instruction_type: 'honesty', instruction: '', priority: 0 }]);
  };

  return (
    <div className="space-y-8">
      <div className="p-6 bg-brand-teal/5 rounded-2xl border border-brand-teal/10">
        <h3 className="text-lg font-bold mb-2">Tell the AI how to behave</h3>
        <p className="text-sm text-gray-400">These rules guide the AI's personality and boundaries. Be explicit about how direct you want it to be.</p>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-serif font-bold">Instruction Rules</h2>
        <button onClick={addInstruction} className="flex items-center gap-2 text-brand-teal hover:bg-brand-teal/10 px-4 py-2 rounded-lg transition-all">
          <Plus size={18} />
          Add Rule
        </button>
      </div>

      <div className="grid gap-4">
        {data.map(rule => (
          <div key={rule.id} className="glass p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between gap-4">
              <Select 
                label="Type" 
                value={rule.instruction_type || ''} 
                onChange={(v) => onChange(data.map(r => r.id === rule.id ? { ...r, instruction_type: v } : r))}
                options={[
                  { value: 'honesty', label: 'Honesty Level' },
                  { value: 'tone', label: 'Tone/Voice' },
                  { value: 'boundaries', label: 'Boundaries' }
                ]}
              />
              <Input label="Priority" type="number" value={rule.priority || 0} onChange={(v) => onChange(data.map(r => r.id === rule.id ? { ...r, priority: parseInt(v) } : r))} />
              <button onClick={() => onChange(data.filter(r => r.id !== rule.id))} className="p-2 text-gray-500 hover:text-red-400">
                <Trash2 size={18} />
              </button>
            </div>
            <Textarea label="Instruction" value={rule.instruction || ''} onChange={(v) => onChange(data.map(r => r.id === rule.id ? { ...r, instruction: v } : r))} placeholder="e.g. Never oversell me. If they need X and I don't have it, say so directly." />
          </div>
        ))}
      </div>
    </div>
  );
};

// UI Components
const Input = ({ label, value, onChange, type = 'text', placeholder, disabled }: any) => (
  <div className="space-y-2">
    <label className="block text-xs font-mono uppercase tracking-widest text-gray-500">{label}</label>
    <input 
      type={type}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-teal transition-colors disabled:opacity-50"
    />
  </div>
);

const Textarea = ({ label, value, onChange, rows = 3, placeholder }: any) => (
  <div className="space-y-2">
    <label className="block text-xs font-mono uppercase tracking-widest text-gray-500">{label}</label>
    <textarea 
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-teal transition-colors resize-none"
    />
  </div>
);

const Select = ({ label, value, onChange, options }: any) => (
  <div className="space-y-2">
    <label className="block text-xs font-mono uppercase tracking-widest text-gray-500">{label}</label>
    <select 
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-teal transition-colors appearance-none"
    >
      <option value="" disabled className="bg-bg-dark">Select option</option>
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value} className="bg-bg-dark">{opt.label}</option>
      ))}
    </select>
  </div>
);
