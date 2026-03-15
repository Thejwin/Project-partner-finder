import { useState } from 'react';
import { useMyProjects, useCollaboratingProjects } from '../hooks/useProjects';
import { ProjectCard } from '../components/project/ProjectCard';
import { FolderKanban, Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { CreateProjectModal } from '../components/project/CreateProjectModal';

export const ProjectsPage = () => {
  const [activeTab, setActiveTab] = useState('my_projects'); // 'my_projects' | 'collaborating'
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const myProjectsQuery = useMyProjects();
  const collabProjectsQuery = useCollaboratingProjects();

  const currentQuery = activeTab === 'my_projects' ? myProjectsQuery : collabProjectsQuery;

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-primary-600" />
            Projects
          </h1>
          <p className="text-surface-500 mt-1 text-sm">Manage your technical projects and collaborations.</p>
        </div>
        
        <Button 
          className="shrink-0 group"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-1.5 transition-transform group-hover:rotate-90" />
          New Project
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-200 mb-6">
        <button
          onClick={() => setActiveTab('my_projects')}
          className={`pb-3 px-1 mr-8 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'my_projects' 
              ? 'border-primary-600 text-primary-600' 
              : 'border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300'
          }`}
        >
          My Projects
        </button>
        <button
          onClick={() => setActiveTab('collaborating')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'collaborating' 
              ? 'border-primary-600 text-primary-600' 
              : 'border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300'
          }`}
        >
          Collaborating On
        </button>
      </div>

      {/* Content */}
      <div className="flex-1">
        {currentQuery.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-surface-100 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : currentQuery.isError ? (
          <div className="text-center py-12 bg-red-50 text-red-600 rounded-xl border border-red-100">
            Failed to load projects. Please try again.
          </div>
        ) : currentQuery.data?.data?.projects?.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-surface-200 border-dashed">
            <div className="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderKanban className="w-8 h-8 text-surface-400" />
            </div>
            <h3 className="text-lg font-medium text-surface-900 mb-1">No projects found</h3>
            <p className="text-surface-500 max-w-sm mx-auto mb-6">
              {activeTab === 'my_projects' 
                ? "You haven't created any projects yet. Start by creating your first project."
                : "You aren't collaborating on any projects right now. Browse the dashboard to find projects."}
            </p>
            {activeTab === 'my_projects' && (
              <Button onClick={() => setIsCreateModalOpen(true)}>Create Project</Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentQuery.data?.data?.projects?.map(project => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        )}
      </div>

      <CreateProjectModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
};
