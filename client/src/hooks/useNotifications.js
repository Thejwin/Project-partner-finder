import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as notificationService from '../services/notification.service';
import { useSocketEvent } from '../context/SocketContext';

export const useNotifications = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getNotifications({ limit: 50 }),
  });

  // Handle real-time notifications via socket
  useSocketEvent('notification:new', (newNotification) => {
    queryClient.setQueryData(['notifications'], (old) => {
      if (!old || !old.data?.notifications) return old;
      return {
        ...old,
        data: {
          ...old.data,
          notifications: [newNotification, ...old.data.notifications],
          unreadCount: (old.data.unreadCount || 0) + 1,
        },
      };
    });
  }, [queryClient]);

  useSocketEvent('notification:markRead', ({ notificationId }) => {
    queryClient.setQueryData(['notifications'], (old) => {
      if (!old || !old.data?.notifications) return old;
      return {
        ...old,
        data: {
          ...old.data,
          // decrease unread count
          unreadCount: Math.max(0, (old.data.unreadCount || 1) - 1),
          notifications: old.data.notifications.map((n) =>
            n._id === notificationId ? { ...n, read: true } : n
          ),
        },
      };
    });
  }, [queryClient]);

  return {
    ...query,
    notifications: query.data?.data?.notifications || [],
    unreadCount: query.data?.data?.unreadCount || 0,
  };
};

export const useMarkAllRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationService.markAllRead,
    onSuccess: () => {
      queryClient.setQueryData(['notifications'], (old) => {
        if (!old || !old.data?.notifications) return old;
        return {
          ...old,
          data: {
            ...old.data,
            unreadCount: 0,
            notifications: old.data.notifications.map(n => ({ ...n, read: true }))
          }
        };
      });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useMarkOneRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id) => notificationService.markOneRead(id),
      onSuccess: (_, id) => {
        // We optimistically update above, but this ensures it syncs if missed
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      },
    });
};

export const useDeleteNotification = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id) => notificationService.deleteNotification(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      },
    });
};
