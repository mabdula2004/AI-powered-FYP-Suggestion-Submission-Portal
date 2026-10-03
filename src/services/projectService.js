import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
} from 'firebase/firestore'
import { db } from '../lib/firebase'

async function fetchProjects(filters = {}) {
  const snapshot = await getDocs(collection(db, 'projects'))
  let projects = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))

  if (filters.domain) {
    projects = projects.filter((p) => p.domain === filters.domain)
  }
  if (filters.difficultyLevel) {
    projects = projects.filter((p) => p.difficultyLevel === filters.difficultyLevel)
  }
  if (filters.isLocked !== undefined) {
    projects = projects.filter((p) => p.isLocked === filters.isLocked)
  }

  return projects
}

function searchProjects(queryStr, projects) {
  const lowerQuery = queryStr.toLowerCase().trim()
  if (!lowerQuery) return projects
  return projects.filter(
    (p) =>
      p.title?.toLowerCase().includes(lowerQuery) ||
      p.technologies?.some((t) => t.toLowerCase().includes(lowerQuery))
  )
}

async function getProjectById(projectId) {
  const snap = await getDoc(doc(db, 'projects', projectId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

async function submitLockRequest(groupId, projectId, leaderId, note) {
  const requestData = {
    groupId,
    projectId,
    leaderId,
    note,
    status: 'pending',
    supervisorNote: null,
    createdAt: serverTimestamp(),
    resolvedAt: null,
  }
  const docRef = await addDoc(collection(db, 'lockRequests'), requestData)

  await updateDoc(doc(db, 'groups', groupId), {
    lockStatus: 'pending',
  })

  return { id: docRef.id, ...requestData }
}

async function getProjectByGroupId(groupId) {
  const groupSnap = await getDoc(doc(db, 'groups', groupId))
  const group = groupSnap.data()
  if (!group?.lockedProjectId) return null
  return await getProjectById(group.lockedProjectId)
}

export const projectService = {
  fetchProjects,
  searchProjects,
  getProjectById,
  submitLockRequest,
  getProjectByGroupId,
}
