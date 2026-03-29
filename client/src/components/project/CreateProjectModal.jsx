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
    visibility: 'public',
    requiredSkills: [],
    readme: ''
  });

  const [skillInput, setSkillInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      requiredSkills: formData.requiredSkills.map(name => ({
        name,
        importance: 'required'
      }))
    };

    createProject(payload, {
      onSuccess: () => {
        addToast('Project created successfully!', 'success');
        onClose();
        setSkillInput('');
        setFormData({
          title: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          type: 'Free',
          visibility: 'public',
          requiredSkills: [],
          readme: ''
        });
      },
      onError: (error) => {
        addToast(error.response?.data?.error || 'Failed to create project', 'error');
      }
    });
  };

  const handleAddSkill = () => {
    const skill = skillInput.trim();
    if (skill && !formData.requiredSkills.includes(skill) && formData.requiredSkills.length < 30) {
      setFormData(prev => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, skill]
      }));
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter(s => s !== skillToRemove)
    }));
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
            Short Description
          </label>
          <textarea
            name="description"
            className="block w-full rounded-lg border-surface-300 bg-white px-4 py-2 text-surface-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            rows="3"
            placeholder="Describe your project briefly..."
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>

        <div className="w-full">
          <label className="block text-sm font-medium text-surface-700 mb-1.5">
            Project README (detailed overview)
          </label>
          <textarea
            name="readme"
            className="block w-full rounded-lg border-surface-300 bg-white px-4 py-2 text-surface-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-mono text-sm"
            rows="5"
            placeholder="Detailed project documentation, goals, and setup..."
            value={formData.readme}
            onChange={handleChange}
          />
          <p className="text-xs text-surface-500 mt-1">This will be displayed on the Project Overview tab.</p>
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

        {/* Required Skills */}
        <div className="w-full">
          <label className="block text-sm font-medium text-surface-700 mb-1.5">
            Required Skills (AI Matching)
          </label>
          <div className="flex gap-2 mb-3">
            <Input
              name="skillInput"
              placeholder="e.g. React, Node.js, Design"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
            />
            <Button type="button" variant="secondary" onClick={handleAddSkill}>
              Add
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {formData.requiredSkills.map(skill => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-primary-50 text-primary-700 border border-primary-200"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="text-primary-400 hover:text-primary-600 focus:outline-none"
                  aria-label="Remove skill"
                >
                  &times;
                </button>
              </span>
            ))}
            {formData.requiredSkills.length === 0 && (
              <span className="text-sm text-surface-500 italic block mt-1">No skills added. Non-skilled projects are rarely matched by AI.</span>
            )}
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
