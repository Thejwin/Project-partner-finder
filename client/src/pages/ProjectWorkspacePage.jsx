import { useParams } from 'react-router-dom';
import { useProjectDetails, useProposals, useRespondToProposal, useAddCollaborator, useFinishProject, useLeaveProject } from '../hooks/useProjects';
import { useProjectStore } from '../store/useProjectStore';
import { Users, LayoutTemplate, Sparkles, FolderKanban, Settings, Search, UserPlus, X, CheckCircle2, Star, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { projectService, userService } from '../services';
import { cn } from '../utils/cn';
import { useState, useEffect } from 'react';
import { EditProjectModal } from '../components/project/EditProjectModal';
import { RateMembersModal } from '../components/project/RateMembersModal';

export const ProjectWorkspacePage = () => {
  const { projectId } = useParams();
  const { data, isLoading, isError } = useProjectDetails(projectId);
  const { activeTab, setActiveTab } = useProjectStore();
  const { user } = useAuth();
  const { addToast } = useNotification();
  
  // State for user search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Fix isOwner logic - ensure we use user?._id and compare strings
  const isOwner = data?.data?.project?.ownerId?._id === user?._id || data?.data?.project?.ownerId === user?._id;
  const { data: proposalsData, isLoading: isLoadingProposals } = useProposals(isOwner ? projectId : null);
  const { mutate: respondToProposal, isLoading: isResponding } = useRespondToProposal(projectId);
  const { mutate: addMember, isLoading: isAddingMember } = useAddCollaborator(projectId);
  const { mutate: finishProject, isLoading: isFinishing } = useFinishProject(projectId);
  const { mutate: leaveProject, isLoading: isLeaving } = useLeaveProject(projectId);

  const isMember = data?.data?.project?.collaborators?.some(c => c._id === user?._id) || isOwner;

  // Search users effect
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await userService.searchUsers({ q: searchQuery });
        setSearchResults(res.data.users || []);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (isLoading) return <div className="p-8 animate-pulse text-surface-500">Loading workspace...</div>;
  if (isError || !data?.data?.project) return <div className="p-8 text-red-500">Failed to load project.</div>;

  const project = data.data.project;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutTemplate },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'proposals', label: 'Proposals', icon: Sparkles },
  ];

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-8 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2.5 py-1 bg-primary-50 text-primary-700 text-xs font-bold rounded-md uppercase tracking-wide">
                {project.visibility}
              </span>
              <span className="text-sm font-medium text-surface-500">
                Created {new Date(project.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-surface-900 mb-4">{project.title}</h1>
            <p className="text-surface-600 max-w-3xl leading-relaxed">
              {project.description || "No description provided."}
            </p>
          </div>
          
          <div className="flex sm:flex-col items-center gap-3 shrink-0">
            <Link 
              to={`/projects/${projectId}/tasks`}
              className="flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-primary-700 transition-colors w-full justify-center shadow-sm shadow-primary-600/20"
            >
              <FolderKanban className="w-5 h-5" />
              Task Board
            </Link>
            {isOwner && (
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-2 bg-surface-100 text-surface-700 px-5 py-2.5 rounded-lg font-medium hover:bg-surface-200 transition-colors w-full justify-center border border-surface-200"
              >
                <Settings className="w-5 h-5" />
                Settings
              </button>
            )}

            {/* Finish Project — owner only, not yet completed */}
            {isOwner && project.status !== 'completed' && project.status !== 'closed' && (
              <button
                onClick={() => setShowFinishConfirm(true)}
                disabled={isFinishing}
                className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors w-full justify-center shadow-sm shadow-green-600/20 disabled:opacity-50"
              >
                <CheckCircle2 className="w-5 h-5" />
                {isFinishing ? 'Finishing...' : 'Finish Project'}
              </button>
            )}

            {/* Rate Members — all members, only when completed */}
            {project.status === 'completed' && isMember && (
              <button
                onClick={() => setIsRateModalOpen(true)}
                className="flex items-center gap-2 bg-amber-500 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-amber-600 transition-colors w-full justify-center shadow-sm shadow-amber-500/20"
              >
                <Star className="w-5 h-5" />
                Rate Members
              </button>
            )}

            {/* Completed badge */}
            {project.status === 'completed' && (
              <span className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg font-semibold text-sm border border-green-200 w-full justify-center">
                <CheckCircle2 className="w-4 h-4" />
                Completed
              </span>
            )}
            
            {/* Leave Project — member only (not owner), not completed or closed */}
            {!isOwner && isMember && project.status !== 'completed' && project.status !== 'closed' && (
              <button 
                onClick={() => setShowLeaveConfirm(true)}
                disabled={isLeaving}
                className="flex items-center gap-2 bg-red-50 text-red-600 px-5 py-2.5 rounded-lg font-medium hover:bg-red-100 transition-colors w-full justify-center border border-red-200 shadow-sm disabled:opacity-50"
              >
                <LogOut className="w-5 h-5" />
                {isLeaving ? 'Leaving...' : 'Leave Project'}
              </button>
            )}

            {project.ownerId._id !== user._id && !project.collaborators.some(c => c._id === user._id) && project.status !== 'completed' && project.status !== 'closed' && (
              <button 
                onClick={async () => {
                  try {
                    await projectService.applyToProject(projectId);
                    addToast('Application sent successfully!', 'success');
                  } catch (err) {
                    addToast(err.response?.data?.error || 'Failed to apply', 'error');
                  }
                }}
                className="flex items-center gap-2 bg-amber-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-amber-700 transition-colors w-full justify-center shadow-sm shadow-amber-600/20"
              >
                <Sparkles className="w-5 h-5" />
                Apply to Join
              </button>
            )}
          </div>
        </div>

        {/* Required Skills */}
        {project.requiredSkills?.length > 0 && (
          <div className="mt-8 pt-6 border-t border-surface-100">
            <h3 className="text-sm font-semibold text-surface-700 mb-3 uppercase tracking-wider">Required Skills</h3>
            <div className="flex flex-wrap gap-2">
              {project.requiredSkills.map((skill, index) => {
                const skillName = typeof skill === 'string' ? skill : skill.name;
                return (
                  <span key={skillName || index} className="px-3 py-1 bg-surface-100 text-surface-800 rounded-full text-sm font-medium border border-surface-200/60">
                    {skillName}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Tabs Layout */}
      <div className="flex border-b border-surface-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id 
                ? 'border-primary-600 text-primary-700' 
                : 'border-transparent text-surface-500 hover:text-surface-800 hover:border-surface-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-white rounded-2xl border border-surface-200 p-6 shadow-sm min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-surface-900">Project Overview</h2>
            <div className="prose prose-surface max-w-none">
               <p>This is where the detailed README or wiki content for the project would go.</p>
               <p>It supports markdown rendering to allow project owners to document their architecture and goals.</p>
            </div>
          </div>
        )}
        
        {activeTab === 'members' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-bold text-surface-900 flex items-center gap-2">
                Collaborators
                <span className="text-sm font-normal text-surface-500 bg-surface-100 px-3 py-1 rounded-full">{project.collaborators.length + 1} members</span>
              </h2>
              
              {isOwner && (
                <div className="relative w-full sm:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-surface-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Add member by username..."
                    className="block w-full pl-10 pr-3 py-2 border border-surface-200 rounded-lg text-sm placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-surface-400 hover:text-surface-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Search Results */}
            {isOwner && searchQuery.length >= 2 && (
              <div className="mb-8 bg-surface-50 rounded-xl border border-surface-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-surface-200 bg-white">
                  <p className="text-xs font-bold text-surface-500 uppercase tracking-wider">Search Results</p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-sm text-surface-500">Searching...</div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-4 text-center text-sm text-surface-500">No users found.</div>
                  ) : (
                    <div className="divide-y divide-surface-100">
                      {searchResults.map((searchUser) => {
                        const isAlreadyMember = project.collaborators.some(c => c._id === searchUser.userId._id) || project.ownerId._id === searchUser.userId._id;
                        return (
                          <div key={searchUser._id} className="flex items-center justify-between p-4 bg-white hover:bg-surface-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center font-bold text-primary-700">
                                {searchUser.userId.username[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-surface-900">{searchUser.userId.username}</p>
                                <p className="text-xs text-surface-500">{searchUser.skills?.slice(0, 3).join(', ')}</p>
                              </div>
                            </div>
                            <button
                              disabled={isAlreadyMember || isAddingMember}
                              onClick={() => {
                                addMember(searchUser.userId._id, {
                                  onSuccess: () => {
                                    addToast(`${searchUser.userId.username} added to project`, 'success');
                                    setSearchQuery('');
                                  },
                                  onError: (err) => {
                                    addToast(err.response?.data?.error || 'Failed to add member', 'error');
                                  }
                                });
                              }}
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                                isAlreadyMember 
                                  ? "bg-surface-100 text-surface-400 cursor-not-allowed"
                                  : "bg-primary-600 text-white hover:bg-primary-700"
                              )}
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              {isAlreadyMember ? 'Member' : 'Add'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Owner */}
              <div className="flex items-center gap-4 p-4 rounded-xl border border-primary-200 bg-primary-50/50">
                <div className="w-12 h-12 bg-primary-200 rounded-full flex items-center justify-center font-bold text-primary-700 text-lg">
                  {project.ownerId?.username?.[0]?.toUpperCase() || 'O'}
                </div>
                <div>
                  <p className="font-bold text-surface-900">{project.ownerId?.username || 'Project Owner'}</p>
                  <p className="text-xs text-primary-700 font-medium tracking-wide uppercase mt-0.5">Owner</p>
                </div>
              </div>
              
              {/* Members */}
              {project.collaborators.map((c, i) => (
                <div key={c._id || i} className="flex items-center gap-4 p-4 rounded-xl border border-surface-200 bg-white shadow-sm">
                  <div className="w-12 h-12 bg-surface-200 rounded-full flex items-center justify-center font-bold text-surface-600 text-lg">
                    {c.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-bold text-surface-900">{c.username || 'Collaborator'}</p>
                    <p className="text-xs text-surface-500 font-medium tracking-wide uppercase mt-0.5">Member</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'proposals' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-surface-900">Member Proposals</h2>
              {isOwner && proposalsData?.data?.proposals && (
                <span className="text-sm font-normal text-surface-500 bg-surface-100 px-3 py-1 rounded-full">
                  {proposalsData.data.proposals.filter(p => p.status === 'pending').length} pending
                </span>
              )}
            </div>

            {!isOwner ? (
              <div className="text-center py-12">
                <Sparkles className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-surface-900 mb-2">Member Proposals & AI Matches</h3>
                <p className="text-surface-500 max-w-md mx-auto">
                  Only project owners can view and manage join requests.
                </p>
              </div>
            ) : isLoadingProposals ? (
              <div className="animate-pulse space-y-4">
                {[1, 2].map(i => <div key={i} className="h-24 bg-surface-100 rounded-xl"></div>)}
              </div>
            ) : !proposalsData?.data?.proposals || proposalsData.data.proposals.length === 0 ? (
              <div className="text-center py-12 bg-surface-50 rounded-xl border border-dashed border-surface-200">
                <p className="text-surface-500">No proposals received yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {proposalsData.data.proposals.map((proposal, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white border border-surface-200 rounded-xl shadow-sm gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center font-bold text-primary-700 text-lg">
                        {proposal.userId?.username?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-bold text-surface-900">{proposal.userId?.username}</p>
                        <p className="text-xs text-surface-500">
                          Applied {new Date(proposal.appliedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {proposal.status === 'pending' ? (
                        <>
                          <button
                            disabled={isResponding}
                            onClick={() => respondToProposal({ userId: proposal.userId._id, action: 'accept' })}
                            className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                          >
                            Accept
                          </button>
                          <button
                            disabled={isResponding}
                            onClick={() => respondToProposal({ userId: proposal.userId._id, action: 'reject' })}
                            className="px-4 py-2 bg-white border border-surface-200 text-surface-700 text-sm font-semibold rounded-lg hover:bg-surface-100 transition-colors disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                          proposal.status === 'accepted' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        )}>
                          {proposal.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <EditProjectModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        project={project} 
      />

      <RateMembersModal
        isOpen={isRateModalOpen}
        onClose={() => setIsRateModalOpen(false)}
        projectId={projectId}
      />

      {/* Finish project confirmation dialog */}
      {showFinishConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm" onClick={() => setShowFinishConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-surface-900 mb-2">Finish Project?</h3>
              <p className="text-surface-500 mb-6">
                This will mark the project as <strong>completed</strong> and increment the collaboration count for all members. Team members will be able to rate each other.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFinishConfirm(false)}
                  className="flex-1 px-4 py-2.5 bg-white border border-surface-200 text-surface-700 rounded-lg font-medium hover:bg-surface-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={isFinishing}
                  onClick={() => {
                    finishProject(undefined, {
                      onSuccess: () => {
                        addToast('Project completed! Members can now rate each other.', 'success');
                        setShowFinishConfirm(false);
                      },
                      onError: (err) => {
                        addToast(err.response?.data?.error || 'Failed to finish project', 'error');
                      },
                    });
                  }}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 shadow-sm shadow-green-600/20"
                >
                  {isFinishing ? 'Finishing...' : 'Yes, Complete It'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leave project confirmation dialog */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm" onClick={() => setShowLeaveConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-surface-900 mb-2">Leave Project?</h3>
              <p className="text-surface-500 mb-6">
                Are you sure you want to leave <strong>{project.title}</strong>? You will no longer have access to the task board or be listed as a collaborator.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLeaveConfirm(false)}
                  className="flex-1 px-4 py-2.5 bg-white border border-surface-200 text-surface-700 rounded-lg font-medium hover:bg-surface-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={isLeaving}
                  onClick={() => {
                    leaveProject(undefined, {
                      onSuccess: () => {
                        addToast('You have left the project.', 'success');
                        setShowLeaveConfirm(false);
                      },
                      onError: (err) => {
                        addToast(err.response?.data?.error || 'Failed to leave project', 'error');
                      },
                    });
                  }}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 shadow-sm shadow-red-600/20"
                >
                  {isLeaving ? 'Leaving...' : 'Yes, Leave'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
