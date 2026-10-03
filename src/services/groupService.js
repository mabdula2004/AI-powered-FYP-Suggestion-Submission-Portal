import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { generateInviteCode } from '../lib/utils'

async function createGroup(leaderId) {
  const inviteCode = generateInviteCode()
  const groupData = {
    leaderId,
    members: [leaderId],
    inviteCode,
    lockedProjectId: null,
    lockStatus: 'none',
    createdAt: serverTimestamp(),
  }
  const docRef = await addDoc(collection(db, 'groups'), groupData)
  await updateDoc(doc(db, 'studentProfiles', leaderId), { groupId: docRef.id })
  return { id: docRef.id, ...groupData }
}

async function joinGroup(inviteCode, studentId) {
  const q = query(collection(db, 'groups'), where('inviteCode', '==', inviteCode))
  const snapshot = await getDocs(q)

  if (snapshot.empty) {
    throw new Error('Invalid invite code')
  }

  const groupDoc = snapshot.docs[0]
  const group = groupDoc.data()

  if (group.members.length >= 3) {
    throw new Error('Group is full (maximum 3 members)')
  }

  const studentProfileSnap = await getDoc(doc(db, 'studentProfiles', studentId))
  const studentProfile = studentProfileSnap.data()

  if (studentProfile?.groupId) {
    throw new Error('You are already in a group')
  }

  await updateDoc(groupDoc.ref, {
    members: arrayUnion(studentId),
  })
  await updateDoc(doc(db, 'studentProfiles', studentId), { groupId: groupDoc.id })

  return { id: groupDoc.id, ...group, members: [...group.members, studentId] }
}

async function leaveGroup(groupId, studentId) {
  const groupRef = doc(db, 'groups', groupId)
  await updateDoc(groupRef, {
    members: arrayRemove(studentId),
  })
  await updateDoc(doc(db, 'studentProfiles', studentId), { groupId: null })
}

async function disbandGroup(groupId, memberIds) {
  const groupSnap = await getDoc(doc(db, 'groups', groupId))
  const group = groupSnap.data()

  if (group?.lockedProjectId) {
    throw new Error('Cannot disband a group with an active project')
  }

  await deleteDoc(doc(db, 'groups', groupId))

  const promises = memberIds.map((memberId) =>
    updateDoc(doc(db, 'studentProfiles', memberId), { groupId: null })
  )
  await Promise.all(promises)
}

export const groupService = {
  createGroup,
  joinGroup,
  leaveGroup,
  disbandGroup,
}
