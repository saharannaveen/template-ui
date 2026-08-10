/** Redux slice for notifications state */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Notification } from '../../types/notification';
import { authenticatedFetch } from '../../services/authenticated-fetch';

export interface NotificationsState {
  list: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: NotificationsState = {
  list: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

export const fetchNotifications = createAsyncThunk('notifications/fetchAll', async () => {
  const response = await authenticatedFetch('/api/notifications', {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch notifications: ${response.statusText}`);
  }

  const data = await response.json();
  return data.notifications || [];
});

export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId: string) => {
    const response = await authenticatedFetch(`/api/notifications/${notificationId}/read`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to mark notification as read: ${response.statusText}`);
    }

    return notificationId;
  }
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotificationFromSSE(state, action: PayloadAction<Notification>) {
      state.list.unshift(action.payload);
      if (!action.payload.read) {
        state.unreadCount += 1;
      }
    },
    clearNotifications(state) {
      state.list = [];
      state.unreadCount = 0;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchNotifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
        state.unreadCount = action.payload.filter((n) => !n.read).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch notifications';
      })
      // markAsRead
      .addCase(markAsRead.fulfilled, (state, action) => {
        const notification = state.list.find((n) => n.id === action.payload);
        if (notification && !notification.read) {
          notification.read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      });
  },
});

export const { addNotificationFromSSE, clearNotifications, setError } =
  notificationsSlice.actions;

export function selectAllNotifications(state: { notifications: NotificationsState }) {
  return state.notifications.list;
}

export function selectUnreadCount(state: { notifications: NotificationsState }) {
  return state.notifications.unreadCount;
}

export function selectNotificationsLoading(state: { notifications: NotificationsState }) {
  return state.notifications.loading;
}

export function selectNotificationsError(state: { notifications: NotificationsState }) {
  return state.notifications.error;
}

export default notificationsSlice.reducer;
