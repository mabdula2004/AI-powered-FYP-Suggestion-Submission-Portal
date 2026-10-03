import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  getDocs,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../lib/firebase'

async function sendNotification(recipientId, title, message, type) {
  const notification = {
    recipientId,
    title,
    message,
    type,
    isRead: false,
    createdAt: serverTimestamp(),
  }
  const docRef = await addDoc(collection(db, 'notifications'), notification)
  return { id: docRef.id, ...notification }
}

async function sendToMany(recipientIds, title, message, type) {
  const promises = recipientIds.map((recipientId) =>
    sendNotification(recipientId, title, message, type)
  )
  return await Promise.all(promises)
}

async function markAsRead(notificationId) {
  const ref = doc(db, 'notifications', notificationId)
  await updateDoc(ref, { isRead: true })
}

async function markAllAsRead(userId) {
  const q = query(
    collection(db, 'notifications'),
    where('recipientId', '==', userId),
    where('isRead', '==', false)
  )
  const snapshot = await getDocs(q)
  const batch = writeBatch(db)
  snapshot.docs.forEach((d) => {
    batch.update(d.ref, { isRead: true })
  })
  await batch.commit()
}

export const notificationService = {
  sendNotification,
  sendToMany,
  markAsRead,
  markAllAsRead,
}
