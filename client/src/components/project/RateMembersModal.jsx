import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useRatings, useSubmitRating } from '../../hooks/useProjects';
import { useNotification } from '../../context/NotificationContext';
import { Star } from 'lucide-react';

export const RateMembersModal = ({ isOpen, onClose, projectId }) => {
  const { data, isLoading } = useRatings(isOpen ? projectId : null);
  const { mutate: submitRating, isLoading: isSubmitting } = useSubmitRating(projectId);
  const { addToast } = useNotification();

  // Local state: { [userId]: { score, comment } }
  const [ratings, setRatings] = useState({});

  const members = data?.data?.members || [];

  const handleStarClick = (userId, score) => {
    setRatings((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], score },
    }));
  };

  const handleCommentChange = (userId, comment) => {
    setRatings((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], comment },
    }));
  };

  const handleSubmitRating = (userId) => {
    const { score, comment } = ratings[userId] || {};
    if (!score) {
      addToast('Please select a rating (1–5 stars)', 'error');
      return;
    }

    submitRating(
      { rateeId: userId, score, comment: comment || '' },
      {
        onSuccess: () => {
          addToast('Rating submitted!', 'success');
          // Clear local state for this user
          setRatings((prev) => {
            const next = { ...prev };
            delete next[userId];
            return next;
          });
        },
        onError: (err) => {
          addToast(err.response?.data?.error || 'Failed to submit rating', 'error');
        },
      }
    );
  };

  const renderStars = (userId, currentScore) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleStarClick(userId, star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={`w-7 h-7 transition-colors ${
                star <= (currentScore || 0)
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-none text-surface-300 hover:text-amber-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rate Team Members" size="md">
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-surface-100 rounded-xl" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-12">
          <Star className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-surface-900 mb-2">No Members to Rate</h3>
          <p className="text-surface-500">
            There are no other members in this project to rate.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-sm text-surface-500 mb-2">
            Rate your collaborators to help build their reputation. Your ratings are anonymous.
          </p>

          {members.map((member) => {
            const localRating = ratings[member._id];
            return (
              <div
                key={member._id}
                className="p-5 bg-white border border-surface-200 rounded-xl shadow-sm"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center font-bold text-primary-700 text-lg shrink-0">
                    {member.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-surface-900 truncate">{member.username}</p>
                    <p className="text-xs text-surface-500 uppercase tracking-wider font-medium mt-0.5">
                      {member.role}
                    </p>
                  </div>

                  {member.alreadyRated && (
                    <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200 uppercase tracking-wider shrink-0">
                      ✓ Rated ({member.myRating?.score}★)
                    </span>
                  )}
                </div>

                {member.alreadyRated ? (
                  <div className="bg-surface-50 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-surface-600">Your rating:</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${
                              s <= member.myRating?.score
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-none text-surface-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {member.myRating?.comment && (
                      <p className="text-sm text-surface-500 mt-1 italic">
                        "{member.myRating.comment}"
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    {renderStars(member._id, localRating?.score)}

                    {localRating?.score && (
                      <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                        <textarea
                          placeholder="Optional: Leave a comment..."
                          value={localRating?.comment || ''}
                          onChange={(e) => handleCommentChange(member._id, e.target.value)}
                          className="block w-full rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
                          rows="2"
                          maxLength={500}
                        />
                        <Button
                          onClick={() => handleSubmitRating(member._id)}
                          isLoading={isSubmitting}
                          className="w-full"
                        >
                          Submit Rating ({localRating.score} ★)
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
};
