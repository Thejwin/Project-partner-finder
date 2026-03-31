import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useCreateTask } from '../../hooks/useTasks';
import { useProjectDetails } from '../../hooks/useProjects';
import { useNotification } from '../../context/NotificationContext';

export const CreateTaskModal = ({ isOpen, onClose, projectId }) => {
  const { mutate: createTask, isLoading } = useCreateTask(projectId);
  const { data: projectData } = useProjectDetails(projectId);
  const { addToast } = useNotification();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assignedTo: '',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 week from now
  });

  const project = projectData?.data?.project;
  const members = project ? [
    { _id: project.ownerId?._id, username: project.ownerId?.username, role: 'Owner' },
    ...(project.collaborators || []).map(c => ({ _id: c?._id, username: c?.username, role: 'Collaborator' }))
  ].filter(m => m._id) : [];

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      assignedTo: formData.assignedTo || null
    };

    createTask(payload, {
      onSuccess: () => {
        addToast('Task created successfully!', 'success');
        onClose();
        setFormData({
          title: '',
          description: '',
          priority: 'medium',
          assignedTo: '',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });
      },
      onError: (error) => {
        addToast(error.response?.data?.error || 'Failed to create task', 'error');
      }
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Task">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Task Title"
          name="title"
          placeholder="What needs to be done?"
          value={formData.title}
          onChange={handleChange}
          required
        />
        
        <div className="w-full">
          <label className="block text-sm font-medium text-surface-700 mb-1.5">
            Description
          </label>
          <textarea
            name="description"
            className="block w-full rounded-lg border-surface-300 bg-white px-4 py-2 text-surface-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            rows="3"
            placeholder="Add some details..."
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="w-full">
            <label className="block text-sm font-medium text-surface-700 mb-1.5">
              Priority
            </label>
            <select
              name="priority"
              className="block w-full rounded-lg border-surface-300 bg-white px-4 py-2 text-surface-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              value={formData.priority}
              onChange={handleChange}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <Input
            label="Due Date"
            name="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={handleChange}
          />
        </div>

        <div className="w-full">
          <label className="block text-sm font-medium text-surface-700 mb-1.5">
            Assign To
          </label>
          <select
            name="assignedTo"
            className="block w-full rounded-lg border-surface-300 bg-white px-4 py-2 text-surface-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            value={formData.assignedTo}
            onChange={handleChange}
          >
            <option value="">Not assigned</option>
            {members.map(member => (
              <option key={member._id} value={member._id}>
                {member.username} ({member.role})
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Create Task
          </Button>
        </div>
      </form>
    </Modal>
  );
};
