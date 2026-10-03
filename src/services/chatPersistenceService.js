import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  deleteDoc,
  getDoc
} from 'firebase/firestore'
import { db } from '../lib/firebase'

export const chatPersistenceService = {
  // Create a new chat session
  async createChat(userId, title = 'New Chat') {
    const chatData = {
      userId,
      title,
      createdAt: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
    }
    const docRef = await addDoc(collection(db, 'chats'), chatData)
    return { id: docRef.id, ...chatData }
  },

  // Get all chats for a user
  async getUserChats(userId) {
    const q = query(
      collection(db, 'chats'),
      where('userId', '==', userId)
    )
    const snapshot = await getDocs(q)
    const chats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    return chats.sort((a, b) => {
      const timeA = a.lastMessageAt?.toMillis ? a.lastMessageAt.toMillis() : 0
      const timeB = b.lastMessageAt?.toMillis ? b.lastMessageAt.toMillis() : 0
      return timeB - timeA
    })
  },

  // Add a message to a chat
  async addMessage(chatId, message) {
    const messageData = {
      chatId,
      ...message,
      timestamp: serverTimestamp()
    }
    await addDoc(collection(db, 'chatMessages'), messageData)
    
    // Update last message time in chat
    const chatRef = doc(db, 'chats', chatId)
    await updateDoc(chatRef, {
      lastMessageAt: serverTimestamp()
    })
  },

  // Get messages for a chat
  async getChatMessages(chatId) {
    const q = query(
      collection(db, 'chatMessages'),
      where('chatId', '==', chatId)
    )
    const snapshot = await getDocs(q)
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    return messages.sort((a, b) => {
      const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0
      const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0
      return timeA - timeB
    })
  },

  // Delete a chat and its messages
  async deleteChat(chatId) {
    // Delete chat doc
    await deleteDoc(doc(db, 'chats', chatId))
    
    // Delete messages
    const q = query(collection(db, 'chatMessages'), where('chatId', '==', chatId))
    const snapshot = await getDocs(q)
    const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'chatMessages', d.id)))
    await Promise.all(deletePromises)
  },

  // Update chat title
  async updateChatTitle(chatId, title) {
    const chatRef = doc(db, 'chats', chatId)
    await updateDoc(chatRef, { title })
  },

  // Save/Get Notepads (Multiple)
  async createNotepad(userId, title = 'New Idea') {
    const notepadData = {
      userId,
      title,
      content: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    const docRef = await addDoc(collection(db, 'userNotepads'), notepadData)
    return { id: docRef.id, ...notepadData }
  },

  async getUserNotepads(userId) {
    const q = query(
      collection(db, 'userNotepads'),
      where('userId', '==', userId)
    )
    const snapshot = await getDocs(q)
    const notepads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    return notepads.sort((a, b) => {
      const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0
      const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0
      return timeB - timeA
    })
  },

  async updateNotepad(notepadId, updates) {
    const notepadRef = doc(db, 'userNotepads', notepadId)
    await updateDoc(notepadRef, {
      ...updates,
      updatedAt: serverTimestamp()
    })
  },

  async deleteNotepad(notepadId) {
    await deleteDoc(doc(db, 'userNotepads', notepadId))
  },

  async getNotepad(notepadId) {
    const snap = await getDoc(doc(db, 'userNotepads', notepadId))
    return snap.exists() ? { id: snap.id, ...snap.data() } : null
  }
}

