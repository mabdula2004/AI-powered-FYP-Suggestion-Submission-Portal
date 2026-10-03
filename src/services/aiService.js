import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

async function resolveGeminiKey() {
  return import.meta.env.VITE_GEMINI_API_KEY || ''
}

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent'




async function callGemini(prompt, inlineData = null) {
  const apiKey = await resolveGeminiKey()
  if (!apiKey) throw new Error('Gemini API key is not configured')

  const url = `${GEMINI_BASE}?key=${apiKey}`
  
  const parts = [{ text: prompt }]
  if (inlineData) {
    parts.push({
      inline_data: {
        mime_type: inlineData.mimeType,
        data: inlineData.data
      }
    })
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
    }),
  })

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}))
    const msg = errBody?.error?.message || `HTTP ${response.status}`
    throw new Error(`Gemini API error: ${msg}`)
  }

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

async function getRecommendations(studentProfile) {
  const prompt = `Based on the following student profile, suggest exactly 5 Final Year Project ideas.
Skills: ${studentProfile.skills?.join(', ') || 'None'}
Experience Level: ${studentProfile.experienceLevel || 'Not specified'}
Preferred Domains: ${studentProfile.preferredDomains?.join(', ') || 'None'}
Interests: ${studentProfile.interests || 'None'}

Return ONLY a valid JSON array with no markdown formatting. Each element must have these exact fields:
- title (string)
- description (string, 2-3 sentences)
- features (array of exactly 3 strings)
- technologies (array of strings)
- difficulty (string: Beginner, Intermediate, or Advanced)
- matchReason (string, 1 sentence explaining why it matches the student)

IMPORTANT: You must return a valid JSON array even if the student profile is empty or lacks details. DO NOT return any conversational text.`

  let text;
  try {
    text = await callGemini(prompt)
  } catch (err) {
    console.warn('Gemini failed for recommendations:', err)
    throw err;
  }

  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("Invalid JSON response from AI");
  const recommendations = JSON.parse(match[0]);
  return recommendations.map((r) => ({ ...r, isLocalFallback: false }))
}

async function getLocalRecommendations(studentProfile) {
  const q = query(collection(db, 'projects'), where('isLocked', '==', false))
  const snapshot = await getDocs(q)
  const projects = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))

  const studentSkills = studentProfile.skills || []
  const preferredDomains = studentProfile.preferredDomains || []

  const scored = projects.map((project) => {
    const matchingTechs = project.technologies?.filter((t) =>
      studentSkills.some((s) => s.toLowerCase() === t.toLowerCase())
    ) || []
    const totalTechs = project.technologies?.length || 1
    let matchScore = (matchingTechs.length / totalTechs) * 100
    if (preferredDomains.includes(project.domain)) matchScore += 15

    return {
      title: project.title,
      description: project.description,
      features: project.features?.slice(0, 3) || [],
      technologies: project.technologies || [],
      difficulty: project.difficultyLevel,
      matchReason: `Matches ${matchingTechs.length} of your skills${preferredDomains.includes(project.domain) ? ' and aligns with your preferred domain' : ''}`,
      matchScore: Math.round(matchScore),
      matchingTechs,
      isLocalFallback: true,
      projectId: project.id,
    }
  })

  scored.sort((a, b) => b.matchScore - a.matchScore)
  return scored.slice(0, 5)
}

async function extractProjectFromPdf(base64Data) {
  const prompt = `Analyze this document content and extract details. 
Return ONLY a valid JSON object with fields: title, description, objectives, features, technologies, domain, difficulty.`;

  const text = await callGemini(prompt, {
    mimeType: 'application/pdf',
    data: base64Data
  });
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Invalid JSON response from AI");
  return JSON.parse(match[0]);
}

async function analyzeNotes(notes) {
  const prompt = `Here are some ideas and notes saved by a student:
${notes.map((n, i) => `${i + 1}. ${n}`).join('\n')}

Analyze these ideas and suggest the BEST project or concept they should build. 
Provide a detailed project title, a compelling description, key features, and why this is the best fit for their interests.

IMPORTANT: Even if the notes are very short or vague (e.g. just 1 or 2 words), you MUST invent and return a full, creative project concept. DO NOT return any text outside the JSON object.
Return ONLY a valid JSON object with exactly these fields:
{
  "bestProject": "Title",
  "rationale": "Why it fits",
  "description": "Project description",
  "keyFeatures": ["feature1", "feature2", "feature3"],
  "techStack": ["tech1", "tech2"]
}`

  const text = await callGemini(prompt)
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Invalid JSON response from AI");
  return JSON.parse(match[0]);
}

async function getProjectEnhancements(project) {
  const prompt = `Based on the following Final Year Project details:
Title: ${project.title}
Domain: ${project.domain}
Technologies: ${project.technologies?.join(', ') || 'None'}

Suggest exactly 3 possible enhancements, improvements, advanced features, or field-related recommendations for this project.
Return ONLY a valid JSON array of objects with fields:
- title (string, short name of the enhancement)
- description (string, concise explanation of how it improves the project)
- difficulty (string, e.g., Beginner, Intermediate, Advanced)
`

  let text;
  try {
    text = await callGemini(prompt)
  } catch (err) {
    console.warn('Gemini failed:', err)
    throw err;
  }

  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("Invalid JSON response from AI");
  return JSON.parse(match[0]);
}

export const aiService = {
  getRecommendations,
  getLocalRecommendations,
  callGemini,
  resolveGeminiKey,
  extractProjectFromPdf,
  analyzeNotes,
  getProjectEnhancements
}

