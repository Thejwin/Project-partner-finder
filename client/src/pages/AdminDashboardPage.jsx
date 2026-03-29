import React, { useState } from 'react';
import { useAdminStats, useAdminReports, useUpdateReportStatus, useToggleUserBan, useAdminDeleteProject, useAdminUsers, useAdminProjects } from '../hooks/useAdmin';
import { Shield, ShieldAlert, Users, FolderKanban, AlertTriangle, Check, X, ShieldCheck, Mail, Calendar, UserX, Trash2 } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export const AdminDashboardPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('reports');
  const { addToast } = useNotification();

  const { data: statsData, isLoading: isLoadingStats } = useAdminStats();
  const { data: reportsData, isLoading: isLoadingReports } = useAdminReports();
  const { data: usersData, isLoading: isLoadingUsers } = useAdminUsers();
  const { data: projectsData, isLoading: isLoadingProjects } = useAdminProjects();
  
  const updateStatusMutation = useUpdateReportStatus();
  const toggleBanMutation = useToggleUserBan();
  const deleteProjectMutation = useAdminDeleteProject();

  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-full">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-surface-900 mb-2">Access Denied</h1>
        <p className="text-surface-500">You do not have permission to view the Admin Dashboard.</p>
      </div>
    );
  }

  const handleUpdateStatus = (id, status) => {
    updateStatusMutation.mutate({ id, status }, {
      onSuccess: () => addToast(`Report marked as ${status}`, 'success'),
      onError: () => addToast('Failed to update report status', 'error')
    });
  };

  const handleToggleBan = (userId, action) => {
    const reason = action === 'ban' ? 'Violation of terms' : null;
    toggleBanMutation.mutate({ id: userId, action, reason }, {
      onSuccess: () => addToast(`User successfully ${action}ned`, 'success'),
      onError: (err) => addToast(err.response?.data?.message || `Failed to ${action} user`, 'error')
    });
  };

  const handleDeleteProject = (projectId) => {
    if (!window.confirm("Are you sure you want to forcibly delete this project? This cannot be undone.")) return;
    deleteProjectMutation.mutate(projectId, {
      onSuccess: () => addToast('Project deleted', 'success'),
      onError: () => addToast('Failed to delete project', 'error')
    });
  };

  const stats = statsData?.data?.stats;
  const reports = reportsData?.data?.reports || [];
  const users = usersData?.data?.users || [];
  const projects = projectsData?.data?.projects || [];

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-8 h-8 text-primary-600" />
        <h1 className="text-2xl font-bold text-surface-900">Admin Dashboard</h1>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-surface-200 rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 flex items-center justify-center rounded-full shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-surface-500">Total Users</p>
            <p className="text-2xl font-bold text-surface-900">{isLoadingStats ? '-' : stats?.totalUsers}</p>
          </div>
        </div>
        <div className="bg-white border border-surface-200 rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 flex items-center justify-center rounded-full shrink-0">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-surface-500">Active Projects</p>
            <p className="text-2xl font-bold text-surface-900">{isLoadingStats ? '-' : stats?.activeProjects}</p>
          </div>
        </div>
        <div className="bg-white border border-surface-200 rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 flex items-center justify-center rounded-full shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-surface-500">Pending Reports</p>
            <p className="text-2xl font-bold text-surface-900">{isLoadingStats ? '-' : stats?.pendingReports}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 border-b border-surface-200">
        <button
          className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'reports' ? 'border-primary-600 text-primary-600' : 'border-transparent text-surface-500 hover:text-surface-700'}`}
          onClick={() => setActiveTab('reports')}
        >
          Reports ({reports.filter(r => r.status === 'pending').length})
        </button>
        <button
          className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'users' ? 'border-primary-600 text-primary-600' : 'border-transparent text-surface-500 hover:text-surface-700'}`}
          onClick={() => setActiveTab('users')}
        >
          Manage Users ({users.length})
        </button>
        <button
          className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'projects' ? 'border-primary-600 text-primary-600' : 'border-transparent text-surface-500 hover:text-surface-700'}`}
          onClick={() => setActiveTab('projects')}
        >
          Manage Projects ({projects.length})
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'reports' && (
          isLoadingReports ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white/50 border border-surface-200 rounded-xl animate-pulse" />)}
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 text-surface-500">No reports found. Great job!</div>
          ) : (
            <div className="space-y-4">
              {reports.map(report => (
                <div key={report._id} className="bg-white border border-surface-200 rounded-xl p-5 shadow-sm hover:border-surface-300 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                          report.status === 'pending' ? 'bg-red-100 text-red-700' : 
                          report.status === 'reviewed' ? 'bg-amber-100 text-amber-700' : 
                          'bg-green-100 text-green-700'
                        }`}>
                          {report.status}
                        </span>
                        <span className="text-sm font-semibold text-surface-600 bg-surface-100 px-2 py-0.5 rounded italic">
                          "{report.reason}"
                        </span>
                      </div>
                      <p className="text-xs text-surface-400">Recorded on {new Date(report.createdAt).toLocaleString()}</p>
                    </div>
                    
                    {report.status !== 'resolved' && (
                      <div className="flex items-center gap-2 text-xs">
                        <button 
                          onClick={() => handleUpdateStatus(report._id, 'reviewed')} 
                          disabled={updateStatusMutation.isPending}
                          className="font-bold px-3 py-1.5 border border-surface-200 rounded-lg text-surface-600 hover:bg-surface-50 disabled:opacity-50"
                        >
                          Reviewed
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(report._id, 'resolved')} 
                          disabled={updateStatusMutation.isPending}
                          className="font-bold px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          Resolve
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="bg-surface-50 rounded-lg p-3 mb-4 text-sm text-surface-700 border border-surface-100">
                    <span className="font-bold block mb-1 text-[10px] text-surface-400 uppercase tracking-wider">Statement:</span>
                    {report.description || <span className="text-surface-400 italic">No detailed description.</span>}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between border-t border-surface-100 pt-3 text-[13px]">
                    <div className="flex items-center gap-2">
                      <span className="text-surface-500">From:</span>
                      <Link to={`/users/${report.reporter?._id}`} className="font-bold text-primary-600 hover:underline">
                        @{report.reporter?.username}
                      </Link>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {report.reportedUser && (
                        <div className="flex items-center gap-2 bg-red-50 text-red-900 px-3 py-1.5 rounded-lg border border-red-100">
                          <span className="font-semibold text-xs uppercase opacity-70">Target User:</span>
                          <Link to={`/users/${report.reportedUser._id}`} className="hover:underline text-red-700 font-bold">
                            {report.reportedUser.username}
                          </Link>
                          <div className="h-4 w-px bg-red-200 mx-1"></div>
                          <button 
                            onClick={() => handleToggleBan(report.reportedUser._id, 'ban')}
                            className="bg-red-600 text-white p-1 rounded hover:bg-red-700 transition-colors"
                            title="Ban User"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      
                      {report.reportedProject && (
                        <div className="flex items-center gap-2 bg-amber-50 text-amber-900 px-3 py-1.5 rounded-lg border border-amber-100">
                          <span className="font-semibold text-xs uppercase opacity-70">Target Project:</span>
                          <Link to={`/projects/${report.reportedProject._id}`} className="hover:underline text-amber-700 font-bold max-w-[120px] truncate">
                            {report.reportedProject.title}
                          </Link>
                          <div className="h-4 w-px bg-amber-200 mx-1"></div>
                          <button 
                            onClick={() => handleDeleteProject(report.reportedProject._id)}
                            className="bg-red-600 text-white p-1 rounded hover:bg-red-700 transition-colors"
                            title="Delete Project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'users' && (
          isLoadingUsers ? (
            <div className="flex items-center justify-center p-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>
          ) : (
            <div className="bg-white border border-surface-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-50 text-xs font-bold text-surface-500 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4 border-b border-surface-200">User</th>
                    <th className="px-6 py-4 border-b border-surface-200">Email / Role</th>
                    <th className="px-6 py-4 border-b border-surface-200">Status</th>
                    <th className="px-6 py-4 border-b border-surface-200">Joined</th>
                    <th className="px-6 py-4 border-b border-surface-200 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {users.map(u => (
                    <tr key={u._id} className="hover:bg-surface-50/50 transition-colors group">
                      <td className="px-6 py-4 border-b border-surface-100">
                        <Link to={`/users/${u._id}`} className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white ${u.role === 'admin' ? 'bg-primary-600' : 'bg-surface-400'}`}>
                            {u.username[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-surface-900">@{u.username}</p>
                            {u.isActive ? <span className="text-[10px] text-green-500 font-bold uppercase tracking-tighter">Active</span> : <span className="text-[10px] text-red-500 font-bold uppercase tracking-tighter">Banned</span>}
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 border-b border-surface-100">
                        <div className="flex items-center gap-1.5 text-surface-600 mb-1">
                          <Mail className="w-3.5 h-3.5" />
                          {u.email}
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${u.role === 'admin' ? 'bg-primary-100 text-primary-700' : 'bg-surface-100 text-surface-600'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 border-b border-surface-100">
                        {!u.isActive && u.bannedReason ? (
                          <div className="max-w-[150px]">
                            <p className="text-xs text-red-600 font-medium italic line-clamp-1">"{u.bannedReason}"</p>
                          </div>
                        ) : (
                          <span className="text-surface-400 italic">No restrictions</span>
                        )}
                      </td>
                      <td className="px-6 py-4 border-b border-surface-100 text-surface-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(u.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 border-b border-surface-100 text-right">
                        {u._id !== user._id && (
                          u.isActive ? (
                            <button 
                              onClick={() => handleToggleBan(u._id, 'ban')}
                              className="text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg border border-red-100 hover:bg-red-50 font-bold text-xs"
                            >
                              Ban Account
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleToggleBan(u._id, 'unban')}
                              className="text-green-600 hover:text-green-700 px-3 py-1.5 rounded-lg border border-green-100 hover:bg-green-50 font-bold text-xs"
                            >
                              Unban Account
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {activeTab === 'projects' && (
          isLoadingProjects ? (
            <div className="flex items-center justify-center p-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map(p => (
                <div key={p._id} className="bg-white border border-surface-200 rounded-xl p-5 shadow-sm hover:border-surface-300 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${p.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-surface-100 text-surface-500'}`}>
                        {p.status}
                      </div>
                      <span className="text-[10px] text-surface-400 font-medium">{new Date(p.createdAt).toLocaleDateString()}</span>
                    </div>
                    <Link to={`/projects/${p._id}`} className="block mb-2">
                      <h4 className="font-bold text-surface-900 group-hover:text-primary-600 transition-colors">{p.title}</h4>
                    </Link>
                    <div className="flex items-center gap-2 text-xs mb-4">
                      <span className="text-surface-500">Owner:</span>
                      <Link to={`/users/${p.ownerId?._id}`} className="font-bold text-primary-600 hover:underline flex items-center gap-1">
                        @{p.ownerId?.username || 'unknown'}
                        <Mail className="w-3 h-3 opacity-50" />
                      </Link>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-surface-100">
                    <div className="flex items-center gap-3 text-surface-500 text-xs font-medium">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        {p.collaborators?.length || 0} members
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(p.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteProject(p._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                      title="Forced Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};
