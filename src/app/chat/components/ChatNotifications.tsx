import React from 'react';
import ChatNotification from './ChatNotification';

interface Notification {
  id: string;
  message: string;
}

interface ChatNotificationsProps {
  notifications: Notification[];
}

export default function ChatNotifications({ notifications }: ChatNotificationsProps) {
  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col-reverse gap-4">
      {notifications.map((notification) => (
        <div key={notification.id}>
          <ChatNotification 
            message={notification.message} 
            id={notification.id} 
          />
        </div>
      ))}
    </div>
  );
}