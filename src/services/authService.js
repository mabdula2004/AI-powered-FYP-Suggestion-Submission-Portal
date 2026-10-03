import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

const ALLOWED_DOMAIN = '@cuivehari.edu.pk'

function validateUniversityEmail(email) {
  if (!email.endsWith(ALLOWED_DOMAIN)) {
    throw new Error('Only @cuivehari.edu.pk email addresses are allowed')
  }
}

async function signIn(email, password) {
  validateUniversityEmail(email)

  const { user } = await signInWithEmailAndPassword(auth, email, password)

  const userDocRef = doc(db, 'users', user.uid)
  const userDocSnap = await getDoc(userDocRef)

  if (!userDocSnap.exists()) {
    throw new Error('User profile not found.')
  }

  const profile = userDocSnap.data()

  if (profile.status === 'suspended') {
    await signOut(auth)
    throw new Error('Your account has been suspended by the administrator.')
  }

  return { user, profile }
}

async function signUp(email, password, name, role, rollNumber = '') {
  validateUniversityEmail(email)

  const { user } = await createUserWithEmailAndPassword(auth, email, password)

  const userData = {
    uid: user.uid,
    email,
    name,
    role,
    rollNumber,
    status: 'active',
    createdAt: serverTimestamp(),
  }

  await setDoc(doc(db, 'users', user.uid), userData)

  if (role === 'student') {
    const studentProfile = {
      uid: user.uid,
      skills: [],
      experienceLevel: '',
      preferredDomains: [],
      preferredTechnologies: [],
      interests: '',
      groupId: null,
      profileComplete: false,
      updatedAt: serverTimestamp(),
    }
    await setDoc(doc(db, 'studentProfiles', user.uid), studentProfile)
  }

  return { user, profile: userData }
}

async function signOutUser() {
  await signOut(auth)
}

function onAuthChange(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid)
      const userDocSnap = await getDoc(userDocRef)
      const profile = userDocSnap.exists() ? userDocSnap.data() : null
      callback({ user, profile })
    } else {
      callback(null)
    }
  })
}

export const authService = {
  signIn,
  signUp,
  signOut: signOutUser,
  onAuthChange,
}
