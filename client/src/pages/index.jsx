import React from 'react';
import { useNotification } from '../context/NotificationContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as friendService from '../services/friendship.service';

export const NotificationsPage = () => {
    const { toasts, markAllRead } = useNotification();
    return (
      <div className="max-w-4xl mx-auto h-full flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-surface-900">Notifications</h1>
          <button 
            onClick={markAllRead}
            className="text-sm font-medium text-primary-600 hover:text-primary-700 bg-primary-50 px-4 py-2 rounded-lg"
          >
            Mark all as read
          </button>
        </div>
  
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-2 relative">
            {/* Empty State shown since we aren't fetching API data in this scaffold yet */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-surface-900 mb-1">You're all caught up!</h3>
                <p className="text-surface-500">No new notifications right now. Check back later.</p>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // ─── Profile Page ─────────────────────────────────────────────────────────────

  // Helper: empty objects for each array section
  const emptySkill       = () => ({ name: '', level: 'intermediate' });
  const emptyEducation   = () => ({ institution: '', degree: '', fieldOfStudy: '', startYear: '', endYear: '' });
  const emptyExperience  = () => ({ company: '', role: '', description: '', startDate: '', endDate: '', current: false });
  const emptyLink        = () => ({ platform: 'github', url: '' });

  export const ProfilePage = () => {
    const [profile, setProfile]     = React.useState(null);
    const [loading, setLoading]     = React.useState(true);
    const [error, setError]         = React.useState(null);
    const [isEditing, setIsEditing] = React.useState(false);
    const [saving, setSaving]       = React.useState(false);
    const [activeSection, setActiveSection] = React.useState('basic'); // basic | skills | education | experience | links

    // Basic fields
    const [form, setForm] = React.useState({
      name: '', header: '', location: '', description: '', areasOfInterest: '',
    });

    // Array section state
    const [skills, setSkills]         = React.useState([]);
    const [education, setEducation]   = React.useState([]);
    const [experience, setExperience] = React.useState([]);
    const [links, setLinks]           = React.useState([]);

    const apiRef = React.useRef(null);

    React.useEffect(() => {
      const fetchProfile = async () => {
        try {
          const { default: api } = await import('../config/api');
          apiRef.current = api;
          const res = await api.get('/profiles/me');
          const p = res.data.data.profile;
          setProfile(p);
          setForm({
            name:            p?.name            || '',
            header:          p?.header          || '',
            location:        p?.location        || '',
            description:     p?.description     || '',
            areasOfInterest: (p?.areasOfInterest || []).join(', '),
          });
          setSkills((p?.skills     || []).map(s  => ({ name: s.name, level: s.level })));
          setEducation(p?.education  || []);
          setExperience(p?.experience || []);
          setLinks(p?.links        || []);
        } catch (err) {
          setError(err.response?.data?.error || 'Failed to load profile');
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    }, []);

    const handleSave = async () => {
      setSaving(true);
      try {
        const api = apiRef.current;
        // 1. Save basic info + education + experience + links via PUT
        const payload = {
          name:            form.name        || undefined,
          header:          form.header      || undefined,
          location:        form.location    || undefined,
          description:     form.description || undefined,
          areasOfInterest: form.areasOfInterest
            ? form.areasOfInterest.split(',').map(s => s.trim()).filter(Boolean)
            : [],
          education:  education.filter(e => e.institution),
          experience: experience.filter(e => e.company && e.role),
          links:      links.filter(l => l.url),
        };
        const res = await api.put('/profiles/me', payload);
        let updatedProfile = res.data.data.profile;

        // 2. Save skills separately via PATCH if any exist
        const validSkills = skills.filter(s => s.name.trim());
        const skillRes = await api.patch('/profiles/me/skills', {
          skills: validSkills.map(s => ({ name: s.name.trim(), level: s.level })),
        });
        // Merge skills back in
        updatedProfile = { ...updatedProfile, skills: skillRes.data.data.skills || validSkills };

        setProfile(updatedProfile);
        setIsEditing(false);
        setActiveSection('basic');
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to save profile');
      } finally {
        setSaving(false);
      }
    };

    const handleCancel = () => {
      // Reset array state back from profile
      setSkills((profile?.skills  || []).map(s => ({ name: s.name, level: s.level })));
      setEducation(profile?.education  || []);
      setExperience(profile?.experience || []);
      setLinks(profile?.links       || []);
      setForm({
        name:            profile?.name            || '',
        header:          profile?.header          || '',
        location:        profile?.location        || '',
        description:     profile?.description     || '',
        areasOfInterest: (profile?.areasOfInterest || []).join(', '),
      });
      setIsEditing(false);
      setActiveSection('basic');
    };

    // ── Generic array helpers ────────────────────────────────────────────────
    const addItem    = (setter, empty) => setter(prev => [...prev, empty()]);
    const removeItem = (setter, idx)   => setter(prev => prev.filter((_, i) => i !== idx));
    const updateItem = (setter, idx, field, val) =>
      setter(prev => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item));

    if (loading) return (
      <div className="max-w-4xl mx-auto h-full flex flex-col">
        <h1 className="text-2xl font-bold text-surface-900 mb-8">My Profile</h1>
        <div className="bg-white rounded-2xl border border-surface-200 p-8 shadow-sm animate-pulse space-y-4">
          <div className="h-6 bg-surface-100 rounded w-1/3"></div>
          <div className="h-4 bg-surface-100 rounded w-2/3"></div>
          <div className="h-4 bg-surface-100 rounded w-1/2"></div>
        </div>
      </div>
    );

    if (error) return (
      <div className="max-w-4xl mx-auto h-full flex flex-col">
        <h1 className="text-2xl font-bold text-surface-900 mb-8">My Profile</h1>
        <div className="bg-white rounded-2xl border border-surface-200 p-8 shadow-sm">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );

    const inp = "block w-full px-3 py-2 border border-surface-200 rounded-lg text-sm text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent";
    const sel = inp + " bg-white";

    const matchScore = profile?.performanceAnalytics?.averageMatchScore;
    const SECTIONS = [
      { id: 'basic',      label: 'Basic Info' },
      { id: 'skills',     label: `Skills (${skills.length})` },
      { id: 'education',  label: `Education (${education.length})` },
      { id: 'experience', label: `Experience (${experience.length})` },
      { id: 'links',      label: `Links (${links.length})` },
    ];

    return (
      <div className="max-w-4xl mx-auto h-full flex flex-col gap-6 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-surface-900">My Profile</h1>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors"
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleCancel}
                className="px-4 py-2 bg-white border border-surface-200 text-surface-700 text-sm font-semibold rounded-lg hover:bg-surface-50 transition-colors">
                Cancel
              </button>
              <button disabled={saving} onClick={handleSave}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        {/* ── VIEW MODE ─────────────────────────────────────────────────────── */}
        {!isEditing && (
          <>
            {/* Header Card */}
            <div className="bg-white rounded-2xl border border-surface-200 p-8 shadow-sm">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-2xl font-bold shrink-0">
                  {profile?.profilePicture
                    ? <img src={profile.profilePicture} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
                    : (profile?.name?.[0] || '?').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-xl font-bold text-surface-900">{profile?.name || 'No name set'}</h2>
                    {matchScore != null && matchScore > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ⭐ {Math.round(matchScore * 100)}% match score
                      </span>
                    )}
                  </div>
                  {profile?.header      && <p className="text-surface-600 mt-1">{profile.header}</p>}
                  {profile?.location    && <p className="text-sm text-surface-500 mt-1">📍 {profile.location}</p>}
                  {profile?.description && <p className="text-surface-600 mt-3 leading-relaxed">{profile.description}</p>}
                </div>
              </div>

              {/* Performance stats row */}
              {profile?.performanceAnalytics && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-surface-100">
                  {[
                    { label: 'Profile Views',          value: profile.performanceAnalytics.profileViews ?? 0 },
                    { label: 'Applications Received',  value: profile.performanceAnalytics.projectApplicationsReceived ?? 0 },
                    { label: 'Collaborations Done',    value: profile.performanceAnalytics.collaborationsCompleted ?? 0 },
                    { label: 'Avg Match Score',        value: matchScore != null ? `${Math.round(matchScore * 100)}%` : '–' },
                  ].map(stat => (
                    <div key={stat.label} className="text-center">
                      <p className="text-2xl font-bold text-primary-600">{stat.value}</p>
                      <p className="text-xs text-surface-500 mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Skills */}
            {profile?.skills?.length > 0 && (
              <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-surface-700 mb-3 uppercase tracking-wider">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((s, i) => (
                    <span key={i} className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm font-medium border border-primary-200/60">
                      {s.name}
                      <span className="ml-1.5 text-xs text-primary-500 capitalize">· {s.level}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Areas of Interest */}
            {profile?.areasOfInterest?.length > 0 && (
              <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-surface-700 mb-3 uppercase tracking-wider">Areas of Interest</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.areasOfInterest.map((area, i) => (
                    <span key={i} className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm font-medium border border-amber-200/60">{area}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {profile?.education?.length > 0 && (
              <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-surface-700 mb-4 uppercase tracking-wider">Education</h3>
                <div className="space-y-4">
                  {profile.education.map((edu, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-10 h-10 bg-surface-100 rounded-lg flex items-center justify-center text-surface-500 shrink-0">🎓</div>
                      <div>
                        <p className="font-semibold text-surface-900">{edu.institution}</p>
                        {edu.degree && <p className="text-sm text-surface-600">{edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}</p>}
                        {edu.startYear && <p className="text-xs text-surface-500 mt-0.5">{edu.startYear}{edu.endYear ? ` – ${edu.endYear}` : ' – Present'}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {profile?.experience?.length > 0 && (
              <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-surface-700 mb-4 uppercase tracking-wider">Experience</h3>
                <div className="space-y-4">
                  {profile.experience.map((exp, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-10 h-10 bg-surface-100 rounded-lg flex items-center justify-center text-surface-500 shrink-0">💼</div>
                      <div>
                        <p className="font-semibold text-surface-900">{exp.role}</p>
                        <p className="text-sm text-surface-600">{exp.company}</p>
                        {exp.description && <p className="text-sm text-surface-500 mt-1">{exp.description}</p>}
                        {(exp.startDate || exp.current) && (
                          <p className="text-xs text-surface-400 mt-0.5">
                            {exp.startDate ? new Date(exp.startDate).getFullYear() : ''}
                            {exp.current ? ' – Present' : exp.endDate ? ` – ${new Date(exp.endDate).getFullYear()}` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Links */}
            {profile?.links?.length > 0 && (
              <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-surface-700 mb-3 uppercase tracking-wider">Links</h3>
                <div className="flex flex-wrap gap-3">
                  {profile.links.map((link, i) => (
                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-surface-50 border border-surface-200 rounded-lg text-sm font-medium text-primary-700 hover:bg-primary-50 hover:border-primary-200 transition-colors">
                      {link.platform === 'github' ? '🔗 GitHub'
                        : link.platform === 'linkedin' ? '🔗 LinkedIn'
                        : link.platform === 'twitter' ? '🔗 Twitter'
                        : link.platform === 'portfolio' ? '🔗 Portfolio'
                        : `🔗 ${link.platform}`}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!profile?.skills?.length && !profile?.education?.length && !profile?.experience?.length && !profile?.areasOfInterest?.length && !profile?.description && (
              <div className="bg-white rounded-2xl border border-dashed border-surface-300 p-8 shadow-sm text-center">
                <p className="text-surface-500 mb-3">Your profile is empty.</p>
                <button onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors">
                  Add Your Details
                </button>
              </div>
            )}
          </>
        )}

        {/* ── EDIT MODE ─────────────────────────────────────────────────────── */}
        {isEditing && (
          <div className="flex flex-col gap-4">
            {/* Section tabs */}
            <div className="flex gap-1 bg-surface-100 p-1 rounded-xl flex-wrap">
              {SECTIONS.map(s => (
                <button key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    activeSection === s.id
                      ? 'bg-white text-primary-700 shadow-sm'
                      : 'text-surface-500 hover:text-surface-700'
                  }`}>
                  {s.label}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-sm">

              {/* ── BASIC INFO ── */}
              {activeSection === 'basic' && (
                <div className="space-y-5">
                  <h3 className="text-sm font-semibold text-surface-700 uppercase tracking-wider">Basic Information</h3>
                  <div>
                    <label className="block text-sm font-semibold text-surface-700 mb-1">Display Name</label>
                    <input type="text" className={inp} placeholder="Your full name"
                      value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-surface-700 mb-1">Headline</label>
                    <input type="text" className={inp} placeholder="e.g. Full-stack developer | Open source enthusiast"
                      value={form.header} onChange={e => setForm(f => ({ ...f, header: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-surface-700 mb-1">Location</label>
                    <input type="text" className={inp} placeholder="e.g. San Francisco, CA"
                      value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-surface-700 mb-1">Bio</label>
                    <textarea className={inp + " min-h-[100px] resize-y"} placeholder="Tell others about yourself..."
                      value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-surface-700 mb-1">Areas of Interest</label>
                    <input type="text" className={inp} placeholder="e.g. Machine Learning, Web Dev (comma separated)"
                      value={form.areasOfInterest} onChange={e => setForm(f => ({ ...f, areasOfInterest: e.target.value }))} />
                    <p className="text-xs text-surface-400 mt-1">Separate with commas</p>
                  </div>
                </div>
              )}

              {/* ── SKILLS ── */}
              {activeSection === 'skills' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-surface-700 uppercase tracking-wider">Skills</h3>
                    <button onClick={() => addItem(setSkills, emptySkill)}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                      + Add Skill
                    </button>
                  </div>
                  {skills.length === 0 && (
                    <p className="text-surface-400 text-sm text-center py-6">No skills added yet. Click "Add Skill" to get started.</p>
                  )}
                  <div className="space-y-3">
                    {skills.map((skill, i) => (
                      <div key={i} className="flex gap-3 items-center bg-surface-50 rounded-xl p-3">
                        <input type="text" className={inp} placeholder="Skill name (e.g. React, Python)"
                          value={skill.name}
                          onChange={e => updateItem(setSkills, i, 'name', e.target.value)} />
                        <select className={sel} value={skill.level}
                          onChange={e => updateItem(setSkills, i, 'level', e.target.value)}>
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="expert">Expert</option>
                        </select>
                        <button onClick={() => removeItem(setSkills, i)}
                          className="text-surface-400 hover:text-red-500 transition-colors shrink-0 p-1" title="Remove">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── EDUCATION ── */}
              {activeSection === 'education' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-surface-700 uppercase tracking-wider">Education</h3>
                    <button onClick={() => addItem(setEducation, emptyEducation)}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                      + Add Education
                    </button>
                  </div>
                  {education.length === 0 && (
                    <p className="text-surface-400 text-sm text-center py-6">No education added yet.</p>
                  )}
                  {education.map((edu, i) => (
                    <div key={i} className="border border-surface-200 rounded-xl p-4 space-y-3 relative">
                      <button onClick={() => removeItem(setEducation, i)}
                        className="absolute top-3 right-3 text-surface-300 hover:text-red-500 transition-colors" title="Remove">✕</button>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-surface-600 mb-1">Institution *</label>
                          <input type="text" className={inp} placeholder="University / School name"
                            value={edu.institution}
                            onChange={e => updateItem(setEducation, i, 'institution', e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-surface-600 mb-1">Degree</label>
                          <input type="text" className={inp} placeholder="e.g. B.Sc, M.Eng"
                            value={edu.degree}
                            onChange={e => updateItem(setEducation, i, 'degree', e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-surface-600 mb-1">Field of Study</label>
                          <input type="text" className={inp} placeholder="e.g. Computer Science"
                            value={edu.fieldOfStudy}
                            onChange={e => updateItem(setEducation, i, 'fieldOfStudy', e.target.value)} />
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="block text-xs font-semibold text-surface-600 mb-1">Start Year</label>
                            <input type="number" className={inp} placeholder="e.g. 2018" min="1900" max="2100"
                              value={edu.startYear}
                              onChange={e => updateItem(setEducation, i, 'startYear', e.target.value)} />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs font-semibold text-surface-600 mb-1">End Year</label>
                            <input type="number" className={inp} placeholder="e.g. 2022" min="1900" max="2100"
                              value={edu.endYear}
                              onChange={e => updateItem(setEducation, i, 'endYear', e.target.value)} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── EXPERIENCE ── */}
              {activeSection === 'experience' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-surface-700 uppercase tracking-wider">Experience</h3>
                    <button onClick={() => addItem(setExperience, emptyExperience)}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                      + Add Experience
                    </button>
                  </div>
                  {experience.length === 0 && (
                    <p className="text-surface-400 text-sm text-center py-6">No experience added yet.</p>
                  )}
                  {experience.map((exp, i) => (
                    <div key={i} className="border border-surface-200 rounded-xl p-4 space-y-3 relative">
                      <button onClick={() => removeItem(setExperience, i)}
                        className="absolute top-3 right-3 text-surface-300 hover:text-red-500 transition-colors" title="Remove">✕</button>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-surface-600 mb-1">Company *</label>
                          <input type="text" className={inp} placeholder="Company name"
                            value={exp.company}
                            onChange={e => updateItem(setExperience, i, 'company', e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-surface-600 mb-1">Role *</label>
                          <input type="text" className={inp} placeholder="e.g. Software Engineer"
                            value={exp.role}
                            onChange={e => updateItem(setExperience, i, 'role', e.target.value)} />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-surface-600 mb-1">Description</label>
                          <textarea className={inp + " resize-y"} rows={2} placeholder="Describe what you did..."
                            value={exp.description}
                            onChange={e => updateItem(setExperience, i, 'description', e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-surface-600 mb-1">Start Date</label>
                          <input type="date" className={inp}
                            value={exp.startDate ? exp.startDate.slice(0, 10) : ''}
                            onChange={e => updateItem(setExperience, i, 'startDate', e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-surface-600 mb-1">End Date</label>
                          <input type="date" className={inp} disabled={exp.current}
                            value={exp.endDate ? exp.endDate.slice(0, 10) : ''}
                            onChange={e => updateItem(setExperience, i, 'endDate', e.target.value)} />
                          <label className="flex items-center gap-2 mt-1.5 text-xs text-surface-500 cursor-pointer">
                            <input type="checkbox" checked={!!exp.current}
                              onChange={e => updateItem(setExperience, i, 'current', e.target.checked)} />
                            Currently working here
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── LINKS ── */}
              {activeSection === 'links' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-surface-700 uppercase tracking-wider">Links</h3>
                    <button onClick={() => addItem(setLinks, emptyLink)}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                      + Add Link
                    </button>
                  </div>
                  {links.length === 0 && (
                    <p className="text-surface-400 text-sm text-center py-6">No links added yet.</p>
                  )}
                  <div className="space-y-3">
                    {links.map((link, i) => (
                      <div key={i} className="flex gap-3 items-center bg-surface-50 rounded-xl p-3">
                        <select className={sel + " w-36 shrink-0"} value={link.platform}
                          onChange={e => updateItem(setLinks, i, 'platform', e.target.value)}>
                          <option value="github">GitHub</option>
                          <option value="linkedin">LinkedIn</option>
                          <option value="twitter">Twitter</option>
                          <option value="portfolio">Portfolio</option>
                          <option value="other">Other</option>
                        </select>
                        <input type="url" className={inp} placeholder="https://..."
                          value={link.url}
                          onChange={e => updateItem(setLinks, i, 'url', e.target.value)} />
                        <button onClick={() => removeItem(setLinks, i)}
                          className="text-surface-400 hover:text-red-500 transition-colors shrink-0 p-1" title="Remove">✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    );
  };
  
  export const UserProfilePage = () => {
    return (
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          <h1 className="text-2xl font-bold text-surface-900 mb-8">User Profile</h1>
          <div className="bg-white rounded-2xl border border-surface-200 p-8 shadow-sm">
            <p className="text-surface-500">Public profile view.</p>
          </div>
        </div>
    );
  };
  
import * as userService from '../services/user.service';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

  export const FriendsPage = () => {
    const [activeTab, setActiveTab] = React.useState('friends'); // friends, incoming, outgoing, search
    const [searchQuery, setSearchQuery] = React.useState('');
    const qc = useQueryClient();
    const { addToast } = useNotification();
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();

    const { data: friendsData, isLoading: friendsLoading } = useQuery({
      queryKey: ['friends'],
      queryFn: () => friendService.getFriends(),
    });

    const { data: incomingData, isLoading: incomingLoading } = useQuery({
      queryKey: ['friends', 'incoming'],
      queryFn: () => friendService.getIncoming(),
    });

    const { data: outgoingData, isLoading: outgoingLoading } = useQuery({
      queryKey: ['friends', 'outgoing'],
      queryFn: () => friendService.getOutgoing(),
    });

    // Search query hook
    const { data: searchData, isLoading: searchLoading } = useQuery({
      queryKey: ['users', 'search', searchQuery],
      queryFn: () => userService.searchUsers(searchQuery),
      enabled: searchQuery.length >= 2,
    });

    const sendRequestMutation = useMutation({
      mutationFn: (id) => friendService.sendRequest(id),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['friends', 'outgoing'] });
        addToast('Friend request sent!', 'success');
      },
      onError: (err) => addToast(err.response?.data?.error || 'Failed to send request', 'error')
    });

    const respondMutation = useMutation({
      mutationFn: ({ id, action }) => friendService.respondToRequest({ friendshipId: id, action }),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['friends'] });
        addToast('Request updated', 'success');
      },
      onError: (err) => addToast(err.response?.data?.error || 'Failed to respond', 'error'),
    });

    const removeFriendMutation = useMutation({
      mutationFn: (id) => friendService.removeFriend(id),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['friends'] });
        addToast('Friend removed', 'success');
      },
    });

    const friends = friendsData?.data?.friends || [];
    const incoming = incomingData?.data?.requests || [];
    const outgoing = outgoingData?.data?.requests || [];
    const searchResults = searchData?.data?.users || [];

    const handleAccept = (id) => respondMutation.mutate({ id, action: 'accept' });
    const handleReject = (id) => respondMutation.mutate({ id, action: 'reject' });
    const handleRemove = (id) => removeFriendMutation.mutate(id);
    const handleSendRequest = (id) => sendRequestMutation.mutate(id);

    return (
        <div className="max-w-5xl mx-auto h-full flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-surface-900">Connections</h1>
          </div>

          <div className="flex gap-4 border-b border-surface-200">
            <button 
              className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'friends' ? 'border-primary-600 text-primary-600' : 'border-transparent text-surface-500 hover:text-surface-700'}`}
              onClick={() => setActiveTab('friends')}
            >
              My Friends ({friends.length})
            </button>
            <button 
              className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'incoming' ? 'border-primary-600 text-primary-600' : 'border-transparent text-surface-500 hover:text-surface-700'}`}
              onClick={() => setActiveTab('incoming')}
            >
              Incoming Requests
              {incoming.length > 0 && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs">{incoming.length}</span>}
            </button>
            <button 
              className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'outgoing' ? 'border-primary-600 text-primary-600' : 'border-transparent text-surface-500 hover:text-surface-700'}`}
              onClick={() => setActiveTab('outgoing')}
            >
              Sent Requests ({outgoing.length})
            </button>
            <button 
              className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'search' ? 'border-primary-600 text-primary-600' : 'border-transparent text-surface-500 hover:text-surface-700'}`}
              onClick={() => setActiveTab('search')}
            >
              Find People
            </button>
          </div>


          <div className="bg-white rounded-2xl border border-surface-200 shadow-sm flex-1 p-6 overflow-y-auto">
            {activeTab === 'friends' && (
              <div className="space-y-4">
                {friendsLoading ? <p className="text-surface-500 animate-pulse">Loading friends...</p> : 
                 friends.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">👥</div>
                    <h3 className="text-lg font-medium text-surface-900 mb-1">No friends yet</h3>
                    <p className="text-surface-500">Connect with others to collaborate!</p>
                  </div>
                 ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {friends.map(f => {
                      const partner = f.friend || {};
                      const partnerName = partner.username || 'Unknown User';
                      return (
                        <div key={f.friendshipId} className="border border-surface-200 p-4 rounded-xl flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-700 shrink-0">
                            {partnerName.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-surface-900 truncate">{partnerName}</h4>
                            <p className="text-xs text-surface-500 truncate">Friends since {new Date(f.since).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button 
                              onClick={() => navigate(`/chat/${f.friendshipId}`)}
                              className="text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                            >
                              Message
                            </button>
                            <button 
                              onClick={() => handleRemove(f.friendshipId)}
                              className="text-surface-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                              title="Remove Friend"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                 )}
              </div>
            )}

            {activeTab === 'incoming' && (
              <div className="space-y-4">
                {incomingLoading ? <p className="text-surface-500 animate-pulse">Loading requests...</p> : 
                 incoming.length === 0 ? (
                  <div className="text-center py-12 text-surface-500">No incoming requests</div>
                 ) : (
                  <div className="flex flex-col gap-3">
                    {incoming.map(req => {
                      const requesterName = req.requester?.username || 'Unknown User';
                      return (
                      <div key={req._id} className="border border-surface-200 p-4 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-700">
                            {requesterName.substring(0,2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-semibold text-surface-900">{requesterName}</h4>
                            <p className="text-xs text-surface-500">Wants to connect</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleReject(req._id)} className="px-3 py-1.5 text-sm font-medium text-surface-600 bg-surface-100 rounded-lg hover:bg-surface-200">Decline</button>
                          <button onClick={() => handleAccept(req._id)} className="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700">Accept</button>
                        </div>
                      </div>
                    )})}
                  </div>
                 )}
              </div>
            )}

            {activeTab === 'outgoing' && (
              <div className="space-y-4">
                {outgoingLoading ? <p className="text-surface-500 animate-pulse">Loading requests...</p> : 
                 outgoing.length === 0 ? (
                  <div className="text-center py-12 text-surface-500">No pending sent requests</div>
                 ) : (
                  <div className="flex flex-col gap-3">
                    {outgoing.map(req => {
                      const recipientName = req.recipient?.username || 'Unknown User';
                      return (
                      <div key={req._id} className="border border-surface-200 p-4 rounded-xl flex items-center justify-between opacity-70">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-surface-200 flex items-center justify-center font-bold text-surface-600">
                            {recipientName.substring(0,2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-semibold text-surface-900">{recipientName}</h4>
                            <p className="text-xs text-surface-500">Pending response...</p>
                          </div>
                        </div>
                        <button onClick={() => handleRemove(req._id)} className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100">Cancel</button>
                      </div>
                    )})}
                  </div>
                 )}
              </div>
            )}

            {activeTab === 'search' && (
              <div className="space-y-6">
                <div className="relative">
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users by username..." 
                    className="w-full bg-white border border-surface-200 rounded-xl pl-4 pr-4 py-3 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                {searchQuery.length < 2 ? (
                  <div className="text-center py-12 text-surface-500">
                    Type at least 2 characters to search for people
                  </div>
                ) : searchLoading ? (
                  <p className="text-surface-500 animate-pulse text-center">Searching...</p>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-12 text-surface-500">No users found matching "{searchQuery}"</div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {searchResults.map(profile => {
                      const actualUserId = profile.userId?._id || profile.userId;
                      const username = profile.userId?.username || profile.name || 'Unknown User';
                      
                      // Find if already friends or requested
                      const isFriend = friends.some(f => f.friend?._id === actualUserId);
                      const isOutgoing = outgoing.some(r => r.recipient?._id === actualUserId);
                      const isIncoming = incoming.some(r => r.requester?._id === actualUserId);
                      const isSelf = currentUser?._id === actualUserId;

                      return (
                        <div key={profile._id} className="border border-surface-200 p-4 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-surface-200 flex items-center justify-center font-bold text-surface-600">
                              {username.substring(0,2).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-semibold text-surface-900">{username}</h4>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {isSelf ? (
                               <span className="text-sm text-surface-500 bg-surface-100 px-3 py-1.5 rounded-lg">You</span>
                            ) : isFriend ? (
                               <span className="text-sm text-surface-500 bg-surface-100 px-3 py-1.5 rounded-lg">Friends</span>
                            ) : isOutgoing ? (
                               <span className="text-sm text-surface-500 bg-surface-100 px-3 py-1.5 rounded-lg">Request Sent</span>
                            ) : isIncoming ? (
                               <button onClick={() => handleAccept(incoming.find(r => r.requester._id === actualUserId)?._id)} className="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700">Accept Request</button>
                            ) : (
                              <button 
                                onClick={() => handleSendRequest(actualUserId)} 
                                disabled={sendRequestMutation.isPending}
                                className="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                              >
                                Add Friend
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
    );
  };
