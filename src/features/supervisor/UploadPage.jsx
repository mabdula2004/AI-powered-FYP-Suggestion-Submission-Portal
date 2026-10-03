import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import {
  Upload,
  FileText,
  PenTool,
  Loader2,
  X,
  Plus,
  Save,
  Trash2,
} from 'lucide-react'
import {
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuthStore } from '../../stores/authStore'
import { githubStorageService } from '../../services/githubStorageService'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import toast from 'react-hot-toast'
import { aiService } from '../../services/aiService'

const DOMAINS = [
  'Web Development',
  'Mobile App',
  'Machine Learning',
  'Data Science',
  'Cybersecurity',
  'IoT',
  'Blockchain',
  'Cloud Computing',
  'Natural Language Processing',
  'Computer Vision',
  'Other',
]

const DIFFICULTIES = [
  { value: 'Beginner', label: 'Beginner', desc: 'Suitable for students new to the domain' },
  { value: 'Intermediate', label: 'Intermediate', desc: 'Requires some prior knowledge' },
  { value: 'Advanced', label: 'Advanced', desc: 'Complex project for experienced students' },
]

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

const inputClass = "w-full px-[14px] py-[10px] bg-white border-[1.5px] border-[#E8ECF0] rounded-xl text-[14px] text-[#1A2332] placeholder-[#9CA3AF] transition-all duration-150 ease-out focus:outline-none focus:border-[#3B82F6] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"

function ExtractionReviewForm({ data, onSave, onDiscard }) {
  const [title, setTitle] = useState(data?.title || '')
  const [description, setDescription] = useState(data?.description || '')
  const [objectives, setObjectives] = useState(data?.objectives || [''])
  const [features, setFeatures] = useState(data?.features || [''])
  const [technologies, setTechnologies] = useState(data?.technologies || [])
  const [techInput, setTechInput] = useState('')
  const [domain, setDomain] = useState(data?.domain || '')
  const [difficulty, setDifficulty] = useState(data?.difficulty || '')
  const [saving, setSaving] = useState(false)

  const addObjective = () => setObjectives([...objectives, ''])
  const removeObjective = (i) => setObjectives(objectives.filter((_, idx) => idx !== i))
  const updateObjective = (i, val) => {
    const next = [...objectives]
    next[i] = val
    setObjectives(next)
  }

  const addFeature = () => setFeatures([...features, ''])
  const removeFeature = (i) => setFeatures(features.filter((_, idx) => idx !== i))
  const updateFeature = (i, val) => {
    const next = [...features]
    next[i] = val
    setFeatures(next)
  }

  const addTech = (e) => {
    if (e.key === 'Enter' && techInput.trim()) {
      e.preventDefault()
      if (!technologies.includes(techInput.trim())) {
        setTechnologies([...technologies, techInput.trim()])
      }
      setTechInput('')
    }
  }
  const removeTech = (i) => setTechnologies(technologies.filter((_, idx) => idx !== i))

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Title is required'); return }
    if (!description.trim()) { toast.error('Description is required'); return }
    if (!domain) { toast.error('Domain is required'); return }
    if (!difficulty) { toast.error('Difficulty is required'); return }
    setSaving(true)
    await onSave({
      title,
      description,
      objectives: objectives.filter(Boolean),
      features: features.filter(Boolean),
      technologies,
      domain,
      difficulty,
    })
    setSaving(false)
  }

  const diffBadge = {
    Beginner: { bg: '#ECFDF5', text: '#10B981' },
    Intermediate: { bg: '#FFFBEB', text: '#F59E0B' },
    Advanced: { bg: '#FEF2F2', text: '#EF4444' },
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="space-y-5"
    >
      <div>
        <label className="block text-[13px] font-semibold text-[#1A2332] mb-[6px]">Project Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
          placeholder="Enter project title"
        />
      </div>

      <div>
        <label className="block text-[13px] font-semibold text-[#1A2332] mb-[6px]">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className={`${inputClass} resize-none`}
          placeholder="Enter project description"
        />
      </div>

      <div>
        <label className="block text-[13px] font-semibold text-[#1A2332] mb-[6px]">Objectives</label>
        <div className="space-y-2">
          {objectives.map((obj, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={obj}
                onChange={(e) => updateObjective(i, e.target.value)}
                className={`${inputClass} flex-1`}
                placeholder={`Objective ${i + 1}`}
              />
              {objectives.length > 1 && (
                <button onClick={() => removeObjective(i)} className="p-2 text-[#EF4444] hover:bg-[#FEF2F2] rounded-lg transition-colors duration-150">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button onClick={addObjective} className="flex items-center gap-1 text-[13px] text-[#3B82F6] font-medium mt-2 hover:text-[#1A2332] transition-colors duration-150">
          <Plus className="w-4 h-4" /> Add Objective
        </button>
      </div>

      <div>
        <label className="block text-[13px] font-semibold text-[#1A2332] mb-[6px]">Features</label>
        <div className="space-y-2">
          {features.map((feat, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={feat}
                onChange={(e) => updateFeature(i, e.target.value)}
                className={`${inputClass} flex-1`}
                placeholder={`Feature ${i + 1}`}
              />
              {features.length > 1 && (
                <button onClick={() => removeFeature(i)} className="p-2 text-[#EF4444] hover:bg-[#FEF2F2] rounded-lg transition-colors duration-150">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button onClick={addFeature} className="flex items-center gap-1 text-[13px] text-[#3B82F6] font-medium mt-2 hover:text-[#1A2332] transition-colors duration-150">
          <Plus className="w-4 h-4" /> Add Feature
        </button>
      </div>

      <div>
        <label className="block text-[13px] font-semibold text-[#1A2332] mb-[6px]">Technologies</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {technologies.map((tech, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#EFF6FF] text-[#3B82F6] text-[11px] font-medium rounded-full">
              {tech}
              <button onClick={() => removeTech(i)} className="hover:text-[#1A2332] transition-colors duration-150">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          value={techInput}
          onChange={(e) => setTechInput(e.target.value)}
          onKeyDown={addTech}
          className={inputClass}
          placeholder="Type and press Enter to add technology"
        />
      </div>

      <div>
        <label className="block text-[13px] font-semibold text-[#1A2332] mb-[6px]">Domain</label>
        <select
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className={`${inputClass} appearance-none cursor-pointer`}
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7A8D' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
        >
          <option value="">Select domain</option>
          {DOMAINS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-[13px] font-semibold text-[#1A2332] mb-3">Difficulty Level</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {DIFFICULTIES.map((diff) => (
            <button
              key={diff.value}
              onClick={() => setDifficulty(diff.value)}
              className={`p-4 rounded-xl border-[1.5px] text-left transition-all duration-150 ${
                difficulty === diff.value
                  ? 'border-[#3B82F6] bg-[#EFF6FF]'
                  : 'border-[#E8ECF0] bg-white hover:border-[#CBD5E1]'
              }`}
            >
              <p className={`text-[14px] font-bold ${difficulty === diff.value ? 'text-[#3B82F6]' : 'text-[#1A2332]'}`}>
                {diff.label}
              </p>
              <p className="text-[12px] text-[#6B7A8D] mt-1 leading-relaxed">{diff.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F4F6F9]">
        <Button variant="ghost" onClick={onDiscard}>
          <Trash2 className="w-4 h-4 mr-1" /> Discard
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
          Confirm and Save
        </Button>
      </div>
    </motion.div>
  )
}

export default function UploadPage() {
  const { user, profile } = useAuthStore()
  const [mode, setMode] = useState('select')
  const [extractedData, setExtractedData] = useState(null)
  const [pdfPath, setPdfPath] = useState(null)
  const [pdfSha, setPdfSha] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [queue, setQueue] = useState([])

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!acceptedFiles.length) return
    const file = acceptedFiles[0]
    await processFile(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
  })

  const onMultiDrop = useCallback(async (acceptedFiles) => {
    const items = acceptedFiles.map((f) => ({
      file: f,
      status: 'pending',
      path: null,
      sha: null,
    }))
    setQueue(items)

    for (let i = 0; i < items.length; i++) {
      setQueue((prev) => {
        const next = [...prev]
        next[i] = { ...next[i], status: 'uploading' }
        return next
      })

      try {
        const base64 = await githubStorageService.fileToBase64(items[i].file)
        const path = `pdfs/${user.uid}/${Date.now()}_${items[i].file.name}`
        const result = await githubStorageService.uploadFile(path, base64, 'Upload project PDF')

        setQueue((prev) => {
          const next = [...prev]
          next[i] = { ...next[i], status: 'analyzing', path, sha: result.sha }
          return next
        })

        const data = await aiService.extractProjectFromPdf(base64)

        setQueue((prev) => {
          const next = [...prev]
          next[i] = { ...next[i], status: 'done', data }
          return next
        })
      } catch (err) {
        setQueue((prev) => {
          const next = [...prev]
          next[i] = { ...next[i], status: 'error' }
          return next
        })
        toast.error(`Failed to process ${items[i].file.name}`)
      }
    }
  }, [user?.uid])

  const { getRootProps: getMultiRootProps, getInputProps: getMultiInputProps } = useDropzone({
    onDrop: onMultiDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
  })

  const processFile = async (file) => {
    setAnalyzing(true)
    try {
      const base64 = await githubStorageService.fileToBase64(file)
      const path = `pdfs/${user.uid}/${Date.now()}_${file.name}`
      const result = await githubStorageService.uploadFile(path, base64, 'Upload project PDF')
      setPdfPath(path)
      setPdfSha(result.sha)

      const data = await aiService.extractProjectFromPdf(base64)
      setExtractedData(data)
      setMode('review')
    } catch (err) {
      toast.error(err.message)
      if (pdfPath) {
        try { await githubStorageService.deleteFile(pdfPath, pdfSha, 'Remove failed upload') } catch {}
      }
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSave = async (formData) => {
    try {
      await addDoc(collection(db, 'projects'), {
        ...formData,
        supervisorId: user.uid,
        supervisorName: profile?.name || 'Unknown',
        isLocked: false,
        lockedByGroupId: null,
        pdfGithubPath: pdfPath,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      toast.success('Project saved successfully!')
      setMode('select')
      setExtractedData(null)
      setPdfPath(null)
      setPdfSha(null)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleDiscard = async () => {
    if (pdfPath && pdfSha) {
      try {
        await githubStorageService.deleteFile(pdfPath, pdfSha, 'Discard project PDF')
      } catch {}
    }
    setMode('select')
    setExtractedData(null)
    setPdfPath(null)
    setPdfSha(null)
  }

  const selectMode = (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
    >
      <Card
        hover
        onClick={() => setMode('upload')}
        className="p-6 cursor-pointer text-center space-y-3"
      >
        <div className="w-12 h-12 bg-[#EFF6FF] text-[#3B82F6] rounded-xl flex items-center justify-center mx-auto">
          <Upload className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-[#1A2332] text-[14px]">Upload PDF</h3>
        <p className="text-[12px] text-[#6B7A8D]">Upload a single project PDF for AI extraction</p>
      </Card>

      <Card
        hover
        onClick={() => setMode('multi-upload')}
        className="p-6 cursor-pointer text-center space-y-3"
      >
        <div className="w-12 h-12 bg-[#ECFDF5] text-[#10B981] rounded-xl flex items-center justify-center mx-auto">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-[#1A2332] text-[14px]">Upload Multiple PDFs</h3>
        <p className="text-[12px] text-[#6B7A8D]">Batch upload and process multiple project documents</p>
      </Card>

      {/* Manual Entry — always works */}
      <Card
        hover
        onClick={() => { setMode('manual'); setExtractedData({}) }}
        className="p-6 cursor-pointer text-center space-y-3 ring-2 ring-[#3B82F6] ring-offset-2"
      >
        <div className="w-12 h-12 bg-[#F5F3FF] text-[#8B5CF6] rounded-xl flex items-center justify-center mx-auto">
          <PenTool className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-[#1A2332] text-[14px]">Add Manually</h3>
        <p className="text-[12px] text-[#6B7A8D]">Enter project details manually without a PDF</p>
      </Card>
    </motion.div>
  )

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <div>
        <h2 className="text-[24px] font-bold text-[#1A2332] mb-1">Upload Project</h2>
        <p className="text-[13px] text-[#6B7A8D]">Add new projects for students</p>
      </div>

      {mode === 'select' && selectMode}

      {mode === 'upload' && (
        <div className="max-w-2xl">
          <button onClick={() => setMode('select')} className="text-[13px] text-[#3B82F6] font-medium mb-4 hover:text-[#1A2332] transition-colors duration-150">
            Back to options
          </button>
          <Card className="p-6">
            {!analyzing && !extractedData && (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors duration-150 ${
                  isDragActive ? 'border-[#3B82F6] bg-[#EFF6FF]' : 'border-[#E8ECF0] hover:border-[#3B82F6]'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-10 h-10 text-[#9CA3AF] mx-auto mb-3" />
                <p className="text-[14px] font-medium text-[#1A2332]">
                  {isDragActive ? 'Drop the PDF here' : 'Drag & drop a PDF here, or click to browse'}
                </p>
                <p className="text-[12px] text-[#9CA3AF] mt-1">Only PDF files are accepted</p>
              </div>
            )}
            {analyzing && (
              <div className="text-center py-10">
                <Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin mx-auto mb-3" />
                <p className="text-[14px] font-medium text-[#1A2332]">Analyzing document with AI...</p>
              </div>
            )}
          </Card>
          {extractedData && mode === 'upload' && (
            <Card className="p-6 mt-4">
              <h3 className="text-[16px] font-bold text-[#1A2332] mb-4">Review Extracted Information</h3>
              <ExtractionReviewForm data={extractedData} onSave={handleSave} onDiscard={handleDiscard} />
            </Card>
          )}
        </div>
      )}

      {mode === 'multi-upload' && (
        <div className="max-w-2xl">
          <button onClick={() => setMode('select')} className="text-[13px] text-[#3B82F6] font-medium mb-4 hover:text-[#1A2332] transition-colors duration-150">
            Back to options
          </button>
          <Card className="p-6">
            {queue.length === 0 && (
              <div
                {...getMultiRootProps()}
                className="border-2 border-dashed border-[#E8ECF0] rounded-xl p-10 text-center cursor-pointer hover:border-[#3B82F6] transition-colors duration-150"
              >
                <input {...getMultiInputProps()} />
                <Upload className="w-10 h-10 text-[#9CA3AF] mx-auto mb-3" />
                <p className="text-[14px] font-medium text-[#1A2332]">Drag & drop multiple PDFs here</p>
                <p className="text-[12px] text-[#9CA3AF] mt-1">Files will be processed sequentially</p>
              </div>
            )}
            {queue.length > 0 && (
              <div className="space-y-3">
                {queue.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-[#E8ECF0] bg-white">
                    <FileText className="w-5 h-5 text-[#9CA3AF]" />
                    <span className="flex-1 text-[13px] truncate text-[#1A2332]">{item.file.name}</span>
                    {item.status === 'pending' && <span className="text-[11px] text-[#9CA3AF]">Pending</span>}
                    {item.status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin text-[#3B82F6]" />}
                    {item.status === 'analyzing' && <span className="text-[11px] text-[#3B82F6]">Analyzing...</span>}
                    {item.status === 'done' && (
                      <button
                        onClick={() => { setExtractedData(item.data); setPdfPath(item.path); setPdfSha(item.sha); setMode('review') }}
                        className="text-[11px] text-[#3B82F6] font-medium hover:text-[#1A2332] transition-colors duration-150"
                      >
                        Review
                      </button>
                    )}
                    {item.status === 'error' && <span className="text-[11px] text-[#EF4444]">Failed</span>}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {mode === 'manual' && (
        <div className="max-w-2xl">
          <button onClick={() => setMode('select')} className="text-[13px] text-[#3B82F6] font-medium mb-4 hover:text-[#1A2332] transition-colors duration-150">
            Back to options
          </button>
          <Card className="p-6">
            <h3 className="text-[16px] font-bold text-[#1A2332] mb-4">Manual Entry</h3>
            <ExtractionReviewForm data={{}} onSave={handleSave} onDiscard={handleDiscard} />
          </Card>
        </div>
      )}

      {mode === 'review' && extractedData && (
        <div className="max-w-2xl">
          <button onClick={() => setMode('select')} className="text-[13px] text-[#3B82F6] font-medium mb-4 hover:text-[#1A2332] transition-colors duration-150">
            Back to options
          </button>
          <Card className="p-6">
            <h3 className="text-[16px] font-bold text-[#1A2332] mb-4">Review Extracted Information</h3>
            <ExtractionReviewForm data={extractedData} onSave={handleSave} onDiscard={handleDiscard} />
          </Card>
        </div>
      )}
    </motion.div>
  )
}
