'use strict';

const { Project, SkillMatchScore, Profile } = require('../models');
const nlpService = require('./nlp.service');

/**
 * Get recommended projects for a user based on AI skill matching.
 * 
 * Logic:
 * 1. Fetch existing high-quality matches from SkillMatchScore.
 * 2. If matches are few, trigger computation for the most recent public projects.
 * 3. Return a list of projects enriched with their match scores.
 * 
 * @param {string} userId - ID of the user to get recommendations for
 * @returns {Promise<Array>} - Array of recommended projects
 */
const getRecommendedProjects = async (userId) => {
  // 1. Get existing matches from the database
  let matches = await SkillMatchScore.find({ userId })
    .sort({ cosineSimilarity: -1 })
    .limit(10)
    .populate({
      path: 'projectId',
      select: '-aggregateRequiredVector -adminActions -proposalList',
      populate: { path: 'ownerId', select: 'username' }
    })
    .lean();

  // Filter to ensure projects are still valid (public and open)
  matches = matches.filter(m => 
    m.projectId && 
    m.projectId.visibility === 'public' && 
    m.projectId.status === 'open'
  );

  // 2. If we don't have enough matches (e.g. < 3), try to compute new ones
  if (matches.length < 3) {
    const existingProjectIds = matches.map(m => m.projectId._id.toString());
    
    // Check if user even has skills before trying to compute
    const userProfile = await Profile.findOne({ userId }).select('skills');
    if (!userProfile || !userProfile.skills || userProfile.skills.length === 0) {
      // Fallback: return the most recent projects without scores
      const recentProjects = await Project.find({
        visibility: 'public',
        status: 'open',
        ownerId: { $ne: userId }
      })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('ownerId', 'username')
      .lean();
      
      return recentProjects.map(p => ({ ...p, matchScore: null }));
    }

    // Attempt to compute matches for the 10 most recent projects the user hasn't matched with yet
    const candidateProjects = await Project.find({
      _id: { $nin: existingProjectIds },
      visibility: 'public',
      status: 'open',
      ownerId: { $ne: userId }
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('_id');

    if (candidateProjects.length > 0) {
      const computePromises = candidateProjects.map(p => 
        nlpService.computeMatch(userId, p._id).catch(() => null)
      );
      
      // We await these to ensure the user gets data on the first load
      await Promise.all(computePromises);

      // Re-fetch matches after computation
      matches = await SkillMatchScore.find({ userId })
        .sort({ cosineSimilarity: -1 })
        .limit(10)
        .populate({
          path: 'projectId',
          select: '-aggregateRequiredVector -adminActions -proposalList',
          populate: { path: 'ownerId', select: 'username' }
        })
        .lean();

      matches = matches.filter(m => 
        m.projectId && 
        m.projectId.visibility === 'public' && 
        m.projectId.status === 'open'
      );
    }
  }

  // 3. Transform and return
  return matches.map(m => ({
    ...m.projectId,
    matchScore: {
      score: m.cosineSimilarity,
      matchedSkills: m.matchedSkills,
      missingSkills: m.missingSkills,
      computedAt: m.computedAt
    }
  }));
};

/**
 * Get recommended users for a project based on AI skill matching.
 * 
 * Logic:
 * 1. Fetch existing high-quality matches from SkillMatchScore for a project.
 * 2. If matches are few, trigger computation for recent active users.
 * 3. Return a list of users enriched with their match scores and profile info.
 * 
 * @param {string} projectId - ID of the project to get recommendations for
 * @returns {Promise<Array>} - Array of recommended users
 */
const getRecommendedUsers = async (projectId) => {
  // 1. Get current project members to exclude them
  const project = await Project.findById(projectId).select('ownerId collaborators').lean();
  if (!project) throw Object.assign(new Error('Project not found'), { statusCode: 404 });

  const members = [project.ownerId.toString(), ...project.collaborators.map(id => id.toString())];

  // 2. Get existing matches from the database
  let matches = await SkillMatchScore.find({ 
    projectId,
    userId: { $nin: members } 
  })
    .sort({ cosineSimilarity: -1 })
    .limit(10)
    .populate({
      path: 'userId',
      select: 'username profileId',
      populate: { path: 'profileId', select: 'profilePicture skills description name header' }
    })
    .lean();

  // 3. If we don't have enough matches (e.g. < 5), try to compute new ones
  if (matches.length < 5) {
    const existingUserIds = matches.map(m => (m.userId?._id || m.userId).toString());
    
    // Find potential candidates: Profiles who are NOT members and NOT already matched
    const candidateProfiles = await Profile.find({
      userId: { $nin: [...members, ...existingUserIds] },
      skills: { $exists: true, $not: { $size: 0 } }
    })
    .sort({ updatedAt: -1 })
    .limit(10)
    .select('userId');

    if (candidateProfiles.length > 0) {
      const computePromises = candidateProfiles.map(p => 
        nlpService.computeMatch(p.userId, projectId).catch(() => null)
      );
      
      await Promise.all(computePromises);

      // Re-fetch matches after computation
      matches = await SkillMatchScore.find({ 
        projectId,
        userId: { $nin: members } 
      })
        .sort({ cosineSimilarity: -1 })
        .limit(10)
        .populate({
          path: 'userId',
          select: 'username profileId',
          populate: { path: 'profileId', select: 'profilePicture skills description name header' }
        })
        .lean();
    }
  }

  // 4. Return formatted data
  return matches.map(m => ({
    userId: m.userId._id,
    username: m.userId.username,
    profile: m.userId.profileId,
    matchScore: {
      score: m.cosineSimilarity,
      matchedSkills: m.matchedSkills,
      missingSkills: m.missingSkills,
      computedAt: m.computedAt
    }
  }));
};

module.exports = {
  getRecommendedProjects,
  getRecommendedUsers,
};
