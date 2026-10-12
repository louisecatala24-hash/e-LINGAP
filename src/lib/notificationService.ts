import { collection, query, where, orderBy, onSnapshot, writeBatch, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError } from './firebase';
import { Notification } from '../types';

export function subscribeToNotifications(userId: string, callback: (notifications: Notification[]) => void) {
  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Notification[];
    callback(data);
  }, (error) => {
    handleFirestoreError(error, 'list', 'notifications');
  });
}

export async function markNotificationsAsRead(notifications: Notification[]) {
  const unreadNotifications = notifications.filter(n => !n.isRead);
  if (unreadNotifications.length === 0) return;

  const batch = writeBatch(db);
  unreadNotifications.forEach(n => {
    const ref = doc(db, 'notifications', n.id);
    batch.update(ref, { isRead: true });
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, 'update', 'notifications (batch)');
  }
}

export async function createNotification(notification: Omit<Notification, 'id'>) {
  try {
    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
      ...notification,
      isRead: false,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, 'create', 'notifications');
  }
}
