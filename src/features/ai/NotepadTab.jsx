import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Trash2, 
  Save, 
  Lightbulb, 
  Loader2, 
  Sparkles, 
  NotebookPen,
  ChevronRight,
  FileText,
  Clock
} from 'lucide-react'
import { chatPersistenceService } from '../../services/chatPersistenceService'
import { aiService } from '../../services/aiService'
import { useAuthStore } from '../../stores/authStore'
import { toast } from 'react-hot-toast'

export default function NotepadTab() {
  const { user } = useAuthStore()
  const [notepads, setNotepads] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState(null)

  useEffect(() => {
    if (user?.uid) {
      loadNotepads()
    }
  }, [user?.uid])

  useEffect(() => {
    if (selectedId) {
      const selected = notepads.find(n => n.id === selectedId)
      if (selected) {
        setContent(selected.content || '')
        setTitle(selected.title || '')
      }
    } else {
      setContent('')
      setTitle('')
    }
  }, [selectedId, notepads])

  const loadNotepads = async () => {
    try {
      setIsLoading(true)
      const data = await chatPersistenceService.getUserNotepads(user.uid)
      setNotepads(data)
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id)
      }
    } catch (err) {
      toast.error('Failed to load notepads')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      const newNotepad = await chatPersistenceService.createNotepad(user.uid, 'New Idea')
      setNotepads([newNotepad, ...notepads])
      setSelectedId(newNotepad.id)
      toast.success('New notepad created')
    } catch (err) {
      toast.error('Failed to create notepad')
    }
  }

  const handleUpdate = async () => {
    if (!selectedId || isSaving) return
    setIsSaving(true)
    try {
      await chatPersistenceService.updateNotepad(selectedId, { content, title })
      setNotepads(notepads.map(n => n.id === selectedId ? { ...n, content, title } : n))
      toast.success('Saved successfully')
    } catch (err) {
      toast.error('Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!window.confirm('Delete this notepad?')) return
    try {
      await chatPersistenceService.deleteNotepad(id)
      setNotepads(notepads.filter(n => n.id !== id))
      if (selectedId === id) setSelectedId(null)
      toast.success('Notepad deleted')
    } catch (err) {
      toast.error('Failed to delete')
    }
  }

  const handleAnalyzeAll = async () => {
    if (notepads.length === 0) {
      toast.error('Create some notepads with ideas first!')
      return
    }

    const allNotes = notepads.map(n => `Title: ${n.title}\nContent: ${n.content}`).join('\n\n---\n\n')
    
    if (!allNotes.trim()) {
      toast.error('Your notepads are empty!')
      return
    }

    setIsAnalyzing(true)
    setAiSuggestion(null)
    try {
      const suggestion = await aiService.analyzeNotes(notepads.map(n => n.content))
      setAiSuggestion(suggestion)
      toast.success('Analysis Complete!')
    } catch (err) {
      console.error('Analysis error:', err)
      toast.error('Failed to analyze ideas')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row h-full w-full gap-6">
      
      {/* Sidebar: Notepad List */}
      <div className="w-full lg:w-72 flex flex-col gap-4">
        <button 
          onClick={handleCreate}
          className="w-full py-3.5 bg-accent text-white rounded-2xl font-bold text-[14px] flex items-center justify-center gap-2 shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
          Create New Idea
        </button>

        <div className="flex-1 overflow-y-auto bg-white border border-border rounded-2xl p-2 space-y-1 scrollbar-hide shadow-sm">
          <div className="px-3 py-2 text-[11px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
            <NotebookPen className="w-3 h-3" />
            My Notepads
          </div>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 text-accent animate-spin" />
            </div>
          ) : notepads.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-text-muted">
              No ideas saved yet.
            </div>
          ) : (
            notepads.map(n => (
              <div 
                key={n.id}
                onClick={() => setSelectedId(n.id)}
                className={`group flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all ${
                  selectedId === n.id 
                    ? 'bg-accent/10 border-2 border-accent text-accent' 
                    : 'border-2 border-transparent hover:bg-bg-secondary text-text-secondary hover:text-navy'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  selectedId === n.id ? 'bg-accent text-white' : 'bg-bg-secondary text-text-muted'
                }`}>
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold truncate">{n.title || 'Untitled Idea'}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-text-muted" />
                    <span className="text-[10px] text-text-muted font-bold">
                      {n.updatedAt?.toDate ? n.updatedAt.toDate().toLocaleDateString() : 'Just now'}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={(e) => handleDelete(e, n.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-danger/10 hover:text-danger rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <button 
          onClick={handleAnalyzeAll}
          disabled={isAnalyzing || notepads.length === 0}
          className="w-full py-4 bg-navy text-white rounded-2xl font-bold text-[14px] flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
        >
          {isAnalyzing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Lightbulb className="w-5 h-5 text-warning" />
          )}
          Suggest Best Project Idea
        </button>
      </div>

      {/* Main Content: Editor or Analysis Result */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        <div className="flex-1 bg-white border border-border rounded-[32px] overflow-hidden flex flex-col shadow-sm">
          {selectedId ? (
            <>
              <div className="px-8 py-6 border-b border-border flex items-center justify-between bg-bg-secondary/30">
                <input 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter Idea Title..."
                  className="bg-transparent text-[18px] font-bold text-navy outline-none placeholder:text-text-muted flex-1"
                />
                <button 
                  onClick={handleUpdate}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-accent text-white rounded-xl font-bold text-[13px] hover:shadow-lg hover:shadow-accent/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing your project idea, requirements, features, or any thoughts here..."
                className="flex-1 p-8 text-[15px] text-navy leading-relaxed outline-none resize-none placeholder:text-text-muted font-medium bg-transparent"
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-20 h-20 bg-bg-secondary rounded-[24px] flex items-center justify-center mb-6">
                <NotebookPen className="w-10 h-10 text-text-muted" />
              </div>
              <h3 className="text-[20px] font-bold text-navy mb-2">Select an idea to edit</h3>
              <p className="text-[14px] text-text-muted max-w-sm">
                Create a new notepad or select an existing one from the sidebar to start building your project concept.
              </p>
            </div>
          )}
        </div>

        {/* AI Suggestion Display */}
        <AnimatePresence>
          {aiSuggestion && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="bg-gradient-to-br from-navy to-navy-mid text-white rounded-[32px] p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Sparkles className="w-32 h-32" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-light">AI Recommended Concept</span>
                    <h4 className="text-[24px] font-black leading-tight mt-1">{aiSuggestion.bestProject}</h4>
                  </div>
                  <button 
                    onClick={() => setAiSuggestion(null)}
                    className="ml-auto p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Plus className="w-6 h-6 rotate-45" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[11px] font-bold text-accent-light uppercase tracking-widest mb-2">Rationale</p>
                      <p className="text-[14px] text-white/80 leading-relaxed italic border-l-4 border-accent pl-4">
                        "{aiSuggestion.rationale}"
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-accent-light uppercase tracking-widest mb-2">Project Vision</p>
                      <p className="text-[14px] text-white/90 leading-relaxed">
                        {aiSuggestion.description}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-[11px] font-bold text-accent-light uppercase tracking-widest mb-3">Key Features to Build</p>
                      <div className="flex flex-wrap gap-2">
                        {aiSuggestion.keyFeatures.map((f, i) => (
                          <span key={i} className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-[12px] font-bold transition-all">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-accent-light uppercase tracking-widest mb-3">Recommended Stack</p>
                      <div className="flex flex-wrap gap-2">
                        {aiSuggestion.techStack.map((t, i) => (
                          <span key={i} className="px-4 py-2 bg-accent/30 text-accent-light border border-accent/30 rounded-xl text-[12px] font-black uppercase tracking-wider">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
