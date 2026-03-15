'use strict';

const { Project }        = require('../models');
const { EVENTS, ROOMS }  = require('../config/socket');

/**
 * Task Socket Handler
 *
 * Rooms used:
 *   project:<projectId>  — all project members receive task events
 *
 * Client → Server events:
 *   project:join   Join a project room to receive task broadcasts
 *   project:leave  Leave a project room
 *
 * Server → Client events (emitted from task.service.js via getIO()):
 *   task:created        New task created in a project
 *   task:updated        Task fields changed
 *   task:statusChanged  Task moved between kanban columns
 *   task:deleted        Task removed from project
 *   task:assigned       Task assigned/reassigned to a member
 */
module.exports = (io, socket) => {
  // ── Join a project room ────────────────────────────────────────────────────
  socket.on(EVENTS.JOIN_PROJECT, async ({ projectId }) => {
    if (!projectId) return;
    try {
      // Guard: only project members may join the room
      const project = await Project.findById(projectId)
        .select('ownerId collaborators visibility')
        .lean();
      if (!project) return;

      const isMember =
        project.ownerId.toString() === socket.userId ||
        project.collaborators.some((id) => id.toString() === socket.userId);

      // Public projects are viewable by anyone (read-only events)
      const canJoin = isMember || project.visibility === 'public';
      if (!canJoin) return;

      socket.join(ROOMS.project(projectId));
      // Notify room that a member came online (only for private/members)
      if (isMember) {
        socket.to(ROOMS.project(projectId)).emit(EVENTS.USER_ONLINE, {
          userId: socket.userId,
          projectId,
        });
      }
    } catch (err) {
      socket.emit(EVENTS.ERROR, { message: err.message });
    }
  });

  // ── Leave a project room ───────────────────────────────────────────────────
  socket.on(EVENTS.LEAVE_PROJECT, ({ projectId }) => {
    if (projectId) {
      socket.leave(ROOMS.project(projectId));
    }
  });
};
