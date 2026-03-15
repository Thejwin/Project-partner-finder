import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useCreateProject } from '../../hooks/useProjects';
import { useNotification } from '../../context/NotificationContext';

export const CreateProjectModal = ({ isOpen, onClose }) => {
  const { mutate: createProject, isLoading } = useCreateProject();
  const { addToast } = useNotification();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    type: 'Free',
    visibility: 'public'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createProject(formData, {
      onSuccess: () => {
        addToast('Project created successfully!', 'success');
        onClose();
        setFormData({
          title: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          type: 'Free',
          visibility: 'public'
        });
      },
      onError: (error) => {
        addToast(error.response?.data?.error || 'Failed to create project', 'error');
      }
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Project">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Title"
          name="title"
          placeholder="Enter project title"
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
            rows="4"
            placeholder="Describe your project..."
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Target Date"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
          
          <div className="w-full">
            <label className="block text-sm font-medium text-surface-700 mb-1.5">
              Project Type
            </label>
            <select
              name="type"
              className="block w-full rounded-lg border-surface-300 bg-white px-4 py-2 text-surface-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              value={formData.type}
              onChange={handleChange}
            >
              <option value="Chat">Chat</option>
              <option value="Free">Free</option>
            </select>
          </div>
        </div>

        <div className="w-full">
          <label className="block text-sm font-medium text-surface-700 mb-1.5">
            Visibility
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="visibility"
                value="public"
                checked={formData.visibility === 'public'}
                onChange={handleChange}
                className="text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-surface-700">Public</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="visibility"
                value="private"
                checked={formData.visibility === 'private'}
                onChange={handleChange}
                className="text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-surface-700">Private</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
};
