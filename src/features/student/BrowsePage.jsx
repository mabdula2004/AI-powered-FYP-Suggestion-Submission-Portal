import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Lock, ArrowRight, User } from 'lucide-react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuthStore } from '../../stores/authStore'
import { projectService } from '../../services/projectService'
import { useDebounce } from '../../hooks/useDebounce'
import ThreeDEffectWrapper from '../../components/ui/3DEffectWrapper'

const DOMAINS = ['All', 'AI/ML', 'Mobile', 'Web', 'IoT', 'Cybersecurity']
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced']

const domainGradients = {
  'AI/ML': 'from-blue-500 to-indigo-600',
  Mobile: 'from-emerald-400 to-emerald-600',
  Web: 'from-purple-500 to-pink-600',
  IoT: 'from-orange-400 to-amber-500',
  Cybersecurity: 'from-red-500 to-rose-600',
}

export default function BrowsePage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [studentProfile, setStudentProfile] = useState(null)
  const [group, setGroup] = useState(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeDomain, setActiveDomain] = useState('All')
  const [activeDifficulty, setActiveDifficulty] = useState(null)

  const debouncedSearch = useDebounce(searchQuery, 300)

  useEffect(() => {
    if (!user?.uid) return
    const unsub = onSnapshot(doc(db, 'studentProfiles', user.uid), (snap) => {
      if (snap.exists()) setStudentProfile(snap.data())
    })
    return unsub
  }, [user?.uid])

  useEffect(() => {
    if (!studentProfile?.groupId) return
    const unsub = onSnapshot(doc(db, 'groups', studentProfile.groupId), (snap) => {
      if (snap.exists()) setGroup({ id: snap.id, ...snap.data() })
    })
    return unsub
  }, [studentProfile?.groupId])

  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true)
      const allProjects = await projectService.fetchProjects()
      setProjects(allProjects)
      setLoading(false)
    }
    loadProjects()
  }, [])

  const filteredProjects = useMemo(() => {
    let result = [...projects]
    if (debouncedSearch) {
      result = projectService.searchProjects(debouncedSearch, result)
    }
    if (activeDomain !== 'All') {
      result = result.filter((p) => p.domain === activeDomain)
    }
    if (activeDifficulty) {
      result = result.filter((p) => p.difficultyLevel === activeDifficulty)
    }
    return result
  }, [projects, debouncedSearch, activeDomain, activeDifficulty])

  const availableProjects = filteredProjects.filter((p) => !p.isLocked)
  const lockedProjects = filteredProjects.filter((p) => p.isLocked)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[24px] font-bold text-navy">Browse Projects</h2>
        <p className="text-[13px] text-text-muted mt-1">
          Explore available FYP projects and find the perfect match
        </p>
      </div>

      {group?.lockStatus === 'pending' && (
        <div className="bg-warning-light border border-warning/20 rounded-xl p-4 flex items-center gap-3">
          <div className="w-2 h-2 bg-warning rounded-full animate-pulse" />
          <p className="text-[13px] text-warning font-semibold">
            Your group has a pending lock request. Please wait for supervisor approval.
          </p>
        </div>
      )}

      {group?.lockStatus === 'approved' && (
        <div className="bg-success-light border border-success/20 rounded-xl p-4 flex items-center gap-3">
          <div className="w-2 h-2 bg-success rounded-full" />
          <p className="text-[13px] text-success font-semibold">
            Project locked! View your milestones{' '}
            <button onClick={() => navigate('/student/milestones')} className="underline">
              here
            </button>.
          </p>
        </div>
      )}

      {/* Search & Filters Card */}
      <div className="bg-surface rounded-2xl shadow-sm border border-border p-5 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects by title or technology..."
            className="w-full pl-11 pr-4 h-[48px] bg-bg-secondary border border-transparent rounded-xl text-[15px] text-text-primary placeholder-text-muted focus:bg-white focus:border-accent focus:shadow-[0_0_0_4px_rgba(79,110,247,0.12)] outline-none transition-all duration-200"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {DOMAINS.map((domain) => (
            <button
              key={domain}
              onClick={() => setActiveDomain(domain)}
              className={`px-4 py-1.5 rounded-full text-[12px] font-bold transition-all duration-200 ${
                activeDomain === domain
                  ? 'bg-navy text-white shadow-md'
                  : 'bg-white border border-border text-text-secondary hover:border-navy hover:text-navy'
              }`}
            >
              {domain}
            </button>
          ))}
          {DIFFICULTIES.map((diff) => (
            <button
              key={diff}
              onClick={() => setActiveDifficulty(activeDifficulty === diff ? null : diff)}
              className={`px-4 py-1.5 rounded-full text-[12px] font-bold transition-all duration-200 ${
                activeDifficulty === diff
                  ? 'bg-navy text-white shadow-md'
                  : 'bg-white border border-border text-text-secondary hover:border-navy hover:text-navy'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-[380px] bg-surface rounded-xl border border-border animate-pulse" />)}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-12 flex flex-col items-center justify-center text-center">
           <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center mb-4">
             <Search className="w-8 h-8 text-text-muted" />
           </div>
           <h3 className="text-[18px] font-bold text-navy mb-1">No projects found</h3>
           <p className="text-[14px] text-text-muted">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          {availableProjects.length > 0 && (
            <div>
              <h3 className="text-[14px] font-bold text-text-muted mb-4 uppercase tracking-wider">
                Available Projects ({availableProjects.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableProjects.map((project, i) => (
                  <ThreeDEffectWrapper key={project.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <ProjectCard project={project} onClick={() => navigate(`/student/project/${project.id}`)} />
                    </motion.div>
                  </ThreeDEffectWrapper>
                ))}
              </div>
            </div>
          )}

          {lockedProjects.length > 0 && (
            <div className="mt-8">
              <h3 className="text-[14px] font-bold text-text-muted mb-4 uppercase tracking-wider">
                Locked Projects ({lockedProjects.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lockedProjects.map((project, i) => (
                  <ThreeDEffectWrapper key={project.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <LockedProjectCard project={project} />
                    </motion.div>
                  </ThreeDEffectWrapper>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ProjectCard({ project, onClick }) {
  const techChips = project.technologies?.slice(0, 3) || []
  const extraCount = (project.technologies?.length || 0) - 3
  const gradient = domainGradients[project.domain] || 'from-slate-500 to-slate-600'

  return (
    <div 
      onClick={onClick}
      className="bg-surface rounded-xl shadow-sm hover:shadow-lg border border-border overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] flex flex-col h-full"
    >
      {/* 200px Height Header Area */}
      <div className={`h-[200px] bg-gradient-to-br ${gradient} p-5 relative overflow-hidden flex flex-col justify-between`}>
        {/* Decorative circle */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-xl translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black opacity-10 rounded-full blur-lg -translate-x-1/2 translate-y-1/2" />
        
        <div className="relative z-10 flex justify-between items-start">
          <span className="text-white text-[11px] font-bold uppercase tracking-wider bg-black/20 px-2.5 py-1 rounded-md">
            {project.domain}
          </span>
          <span className="text-white text-[11px] font-bold bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/20">
            {project.difficultyLevel}
          </span>
        </div>
        
        <h4 className="relative z-10 text-[18px] font-bold text-white line-clamp-2 leading-snug">
          {project.title}
        </h4>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        {/* Supervisor Info */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-bg-secondary flex items-center justify-center border border-border shrink-0">
             <User className="w-3 h-3 text-text-secondary" />
          </div>
          <span className="text-[13px] font-semibold text-navy truncate">
             {project.supervisorName}
          </span>
        </div>

        {/* Tech Chips */}
        <div className="flex flex-wrap gap-1.5 mb-6 mt-auto">
          {techChips.map((tech) => (
            <span key={tech} className="text-[11px] px-2.5 py-1 bg-bg-secondary text-text-secondary rounded-full font-semibold border border-border/50">
              {tech}
            </span>
          ))}
          {extraCount > 0 && (
            <span className="text-[11px] px-2.5 py-1 bg-bg-secondary text-text-secondary rounded-full font-semibold border border-border/50">
              +{extraCount}
            </span>
          )}
        </div>

        <button className="w-full h-[44px] text-[13px] font-bold text-white bg-gradient-to-r from-accent to-accent-dark rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2">
          View Details
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function LockedProjectCard({ project }) {
  const gradient = domainGradients[project.domain] || 'from-slate-500 to-slate-600'

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden h-full">
      {/* 200px Height Header Area with Frosted Blur */}
      <div className={`h-[200px] bg-gradient-to-br ${gradient} p-5 relative overflow-hidden flex flex-col items-center justify-center`}>
        {/* Blur overlay */}
        <div className="absolute inset-0 bg-white/10 backdrop-blur-md" />
        
        <div className="relative z-10 flex flex-col items-center">
           <motion.div
             animate={{ rotateY: 360 }}
             transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
           >
             <Lock className="w-10 h-10 text-white mb-3" />
           </motion.div>
           <h4 className="text-[16px] font-bold text-white text-center">This project is locked</h4>
        </div>
      </div>

      <div className="p-5 opacity-50 select-none">
        <h4 className="font-bold text-[16px] text-navy line-clamp-1 mb-1">{project.title}</h4>
        <p className="text-[13px] text-text-muted">{project.domain}</p>
      </div>
    </div>
  )
}
