import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { aiService } from './aiService'
import { chatPersistenceService } from './chatPersistenceService'

async function fetchLiveContext(userId, groupId) {
  const projectsQuery = query(collection(db, 'projects'), where('isLocked', '==', false))
  const projectsSnap = await getDocs(projectsQuery)
  const availableProjects = projectsSnap.docs
    .slice(0, 10)
    .map((d) => ({ id: d.id, title: d.data().title }))

  const studentProfileSnap = await getDoc(doc(db, 'studentProfiles', userId))
  const studentProfile = studentProfileSnap.exists() ? studentProfileSnap.data() : null

  let group = null
  if (groupId) {
    const groupSnap = await getDoc(doc(db, 'groups', groupId))
    group = groupSnap.exists() ? { id: groupSnap.id, ...groupSnap.data() } : null
  }

  return { availableProjects, studentProfile, group }
}

async function handleLocalIntent(message, userId, groupId) {
  const lower = message.toLowerCase()

  if (lower.includes('available projects') || lower.includes('show projects')) {
    const snap = await getDocs(query(collection(db, 'projects'), where('isLocked', '==', false)))
    const projects = snap.docs.map((d) => d.data().title)
    if (projects.length === 0) return 'No available projects at the moment.'
    return `Here are the available projects:\n${projects.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
  }

  if (lower.includes('my group') && groupId) {
    const groupSnap = await getDoc(doc(db, 'groups', groupId))
    if (!groupSnap.exists()) return null
    const group = groupSnap.data()
    return `Your group has ${group.members?.length || 0} member(s). Invite code: ${group.inviteCode}`
  }

  if ((lower.includes('my project') || lower.includes('locked project')) && groupId) {
    const groupSnap = await getDoc(doc(db, 'groups', groupId))
    if (!groupSnap.exists()) return null
    const group = groupSnap.data()
    if (!group.lockedProjectId) return 'Your group has not locked a project yet.'
    const projectSnap = await getDoc(doc(db, 'projects', group.lockedProjectId))
    if (!projectSnap.exists()) return null
    return `Your locked project is: ${projectSnap.data().title}`
  }

  return null
}

async function sendMessage(message, conversationHistory, userId, groupId, chatId = null) {
  // Try local intent first (no API call needed)
  const localResponse = await handleLocalIntent(message, userId, groupId)
  if (localResponse) {
    if (chatId) {
      await chatPersistenceService.addMessage(chatId, { role: 'user', content: message })
      await chatPersistenceService.addMessage(chatId, { role: 'bot', content: localResponse })
    }
    return localResponse
  }

  try {
    const { availableProjects, studentProfile, group } = await fetchLiveContext(userId, groupId)

    const projectTitles = availableProjects.map((p) => p.title).join(', ')
    const skills = studentProfile?.skills?.join(', ') || 'None'
    const level = studentProfile?.experienceLevel || 'Not specified'
    const currentProject = group?.lockedProjectId ? 'a locked project' : 'no project locked'
    const groupInfo = group
      ? `Group with ${group.members?.length || 0} member(s), lock status: ${group.lockStatus}`
      : 'Not in a group'

    const recentMessages = conversationHistory
      .slice(-10)
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n')

    const fullPrompt = `You are an AI assistant for a university Final Year Project (FYP) portal. 
Your name is "Gemini FYP Assistant". You are professional, creative, and highly intelligent.

Context:
- Available projects: ${projectTitles}
- Student skills: ${skills}
- Experience level: ${level}
- Current project: ${currentProject}
- Group info: ${groupInfo}

Conversation History:
${recentMessages}

Current Message: ${message}`

    const responseText = await aiService.callGemini(fullPrompt)

    if (chatId) {
      // User message is usually added by the UI before calling sendMessage, 
      // but we add the bot response here.
      await chatPersistenceService.addMessage(chatId, { role: 'bot', content: responseText })
    }

    return responseText;

  } catch (err) {
    console.error('[chatbotService] Gemini API failed:', err)
    return `I'm having trouble connecting right now. Please try again later.`
  }
}

export const chatbotService = {
  fetchLiveContext,
  handleLocalIntent,
  sendMessage,
}

