import React, { useState, useMemo, useEffect } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Presentation,
  ClipboardCheck,
  Grid,
  GraduationCap,
  FolderOpen,
  Users,
  MessageSquare,
  Calendar as CalendarIcon,
  BarChart3,
  Settings as SettingsIcon,
  Bell,
  HelpCircle,
  Search,
  Crown,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  Clock,
  Activity,
  CheckCircle2,
  Trash2,
  User,
  Plus,
  AlertTriangle,
  TrendingUp,
  ThumbsUp,
  Download,
  Copy,
  ChevronLeft,
  Send,
  RefreshCw,
  Sliders,
  X,
  Lock,
  Mail,
  Check,
  LogOut
} from 'lucide-react';

const getApiBaseUrl = () => {
  const savedUrl = localStorage.getItem('API_BASE_URL');
  if (savedUrl) {
    return savedUrl;
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const { hostname, protocol } = window.location;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    // If it's a local network hostname or IP (e.g. 192.168.x.x, 10.x.x.x), keep the :8000 port
    const isLocalNetwork = 
      hostname.startsWith('192.168.') || 
      hostname.startsWith('10.') || 
      hostname.startsWith('172.') || 
      hostname.endsWith('.local');
      
    if (isLocalNetwork) {
      return `${protocol}//${hostname}:8000`;
    }
    // For production/cloud deployments (e.g. Render, Vercel), do not append port 8000
    return `${protocol}//${hostname}`;
  }
  return 'http://localhost:8000';
};

const API_BASE_URL = getApiBaseUrl();

const getFriendlyErrorMessage = (errorMsg) => {
  if (errorMsg && (errorMsg.toLowerCase().includes('failed to fetch') || errorMsg.toLowerCase().includes('networkerror') || errorMsg.toLowerCase().includes('load failed') || errorMsg.toLowerCase().includes('failed to connect'))) {
    return 'Failed to connect to backend server. Make sure the backend FastAPI service is running (e.g., uvicorn main:app --reload) and that the API Server URL in your settings is correct.';
  }
  return errorMsg;
};

const safeParseJson = async (response) => {
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/html')) {
    throw new Error('The server returned an HTML page (likely the frontend site) instead of API data. Please ensure the API URL points to the running backend service, not the frontend website.');
  }
  try {
    return await response.json();
  } catch (e) {
    throw new Error('The server returned an invalid response format. Please verify that the API URL points to the backend service.');
  }
};

const renderMarkdown = (text) => {
  if (!text) return null;
  // Replace literal \n string escapes if they somehow still exist
  let cleanText = text.replace(/\\n/g, '\n');
  // Strip outer quotes if they exist (caused by raw JSON string output)
  if (cleanText.startsWith('"') && cleanText.endsWith('"')) {
    cleanText = cleanText.substring(1, cleanText.length - 1);
  }

  const lines = cleanText.split('\n');
  const elements = [];
  let listItems = [];

  const flushList = (key) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${key}`} className="list-disc pl-5 my-2.5 space-y-1 text-slate-700">
          {listItems.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {parseInlineMarkdown(item)}
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  // Helper for inline markdown like **bold** and `code`
  const parseInlineMarkdown = (str) => {
    let parts = [str];
    
    // Bold parsing: **text**
    const boldRegex = /\*\*(.*?)\*\*/g;
    let newParts = [];
    
    for (let part of parts) {
      if (typeof part !== 'string') {
        newParts.push(part);
        continue;
      }
      
      let lastIndex = 0;
      let match;
      boldRegex.lastIndex = 0;
      
      while ((match = boldRegex.exec(part)) !== null) {
        if (match.index > lastIndex) {
          newParts.push(part.substring(lastIndex, match.index));
        }
        newParts.push(<strong key={`bold-${match.index}`} className="font-extrabold text-slate-900">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      
      if (lastIndex < part.length) {
        newParts.push(part.substring(lastIndex));
      }
    }
    
    parts = newParts;
    newParts = [];
    
    // Inline code parsing: `code`
    const codeRegex = /`(.*?)`/g;
    
    for (let part of parts) {
      if (typeof part !== 'string') {
        newParts.push(part);
        continue;
      }
      
      let lastIndex = 0;
      let match;
      codeRegex.lastIndex = 0;
      
      while ((match = codeRegex.exec(part)) !== null) {
        if (match.index > lastIndex) {
          newParts.push(part.substring(lastIndex, match.index));
        }
        newParts.push(<code key={`code-${match.index}`} className="bg-slate-200 px-1 py-0.5 rounded text-red-655 font-mono text-[11px]">{match[1]}</code>);
        lastIndex = codeRegex.lastIndex;
      }
      
      if (lastIndex < part.length) {
        newParts.push(part.substring(lastIndex));
      }
    }
    
    return newParts.length > 0 ? newParts : parts;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle horizontal rule
    if (line.trim() === '---') {
      flushList(i);
      elements.push(<hr key={`hr-${i}`} className="my-4 border-slate-200" />);
      continue;
    }

    // Handle Headings
    if (line.startsWith('# ')) {
      flushList(i);
      elements.push(
        <h3 key={`h1-${i}`} className="text-base font-extrabold text-slate-900 mt-4 mb-2 tracking-tight">
          {parseInlineMarkdown(line.substring(2))}
        </h3>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      flushList(i);
      elements.push(
        <h4 key={`h2-${i}`} className="text-sm font-bold text-slate-800 mt-3.5 mb-1.5 tracking-tight border-b border-slate-100 pb-1">
          {parseInlineMarkdown(line.substring(3))}
        </h4>
      );
      continue;
    }
    if (line.startsWith('### ')) {
      flushList(i);
      elements.push(
        <h5 key={`h3-${i}`} className="text-xs font-semibold text-[#6C5CE7] mt-3 mb-1 tracking-tight">
          {parseInlineMarkdown(line.substring(4))}
        </h5>
      );
      continue;
    }

    // Handle Lists
    if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
      // Strip the bullet marker
      const itemText = line.trim().substring(2);
      listItems.push(itemText);
      continue;
    }

    // If it's an empty line
    if (line.trim() === '') {
      flushList(i);
      continue;
    }

    // Otherwise it's a normal paragraph
    flushList(i);
    elements.push(
      <p key={`p-${i}`} className="my-1.5 leading-relaxed text-slate-700">
        {parseInlineMarkdown(line)}
      </p>
    );
  }

  // Flush any remaining lists
  flushList(lines.length);

  return elements;
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('currentUser');
      return saved ? JSON.parse(saved) : {
        id: 1,
        name: 'Kanimozhi A',
        email: 'kanimozhi.a@university.edu',
        department: 'AIML'
      };
    } catch (e) {
      return {
        id: 1,
        name: 'Kanimozhi A',
        email: 'kanimozhi.a@university.edu',
        department: 'AIML'
      };
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'

  // Form States for Authentication
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authDept, setAuthDept] = useState('AIML');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [tempApiUrl, setTempApiUrl] = useState(API_BASE_URL);

  const handleSaveApiUrl = (e) => {
    if (e) e.preventDefault();
    if (tempApiUrl.trim()) {
      localStorage.setItem('API_BASE_URL', tempApiUrl.trim());
      showToast('API URL updated! Reloading...', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const handleResetApiUrl = (e) => {
    if (e) e.preventDefault();
    localStorage.removeItem('API_BASE_URL');
    showToast('API URL reset to default! Reloading...', 'success');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const getUserInitials = (name) => {
    if (!name) return '??';
    const clean = name.replace(/^(Dr\.|Mr\.|Ms\.|Prof\.)\s+/i, '');
    const parts = clean.trim().split(/\s+/);
    return parts.map(part => part[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError('Please fill in all fields');
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail,
          password: authPassword
        })
      });
      const data = await safeParseJson(res);
      if (!res.ok) {
        throw new Error(data.detail || 'Login failed');
      }
      setCurrentUser(data.user);
      setToken(data.token);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      showToast(`Welcome back, ${data.user.name}!`);
      setAuthPassword('');
      setAuthError(null);
    } catch (err) {
      setAuthError(err.message);
      showToast(err.message, 'error');
      if (err.message.toLowerCase().includes('failed to fetch') || err.message.toLowerCase().includes('html page')) {
        setShowServerConfig(true);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e) => {
    if (e) e.preventDefault();
    if (!authName.trim() || !authEmail.trim() || !authPassword.trim()) {
      setAuthError('Please fill in all required fields');
      return;
    }
    if (authPassword.length < 6) {
      setAuthError('Password must be at least 6 characters');
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: authName,
          email: authEmail,
          password: authPassword,
          department: authDept
        })
      });
      const data = await safeParseJson(res);
      if (!res.ok) {
        throw new Error(data.detail || 'Registration failed');
      }
      showToast('Account created successfully! Please log in.');
      setAuthView('login');
      setAuthPassword('');
      setAuthName('');
      setAuthError(null);
    } catch (err) {
      setAuthError(err.message);
      showToast(err.message, 'error');
      if (err.message.toLowerCase().includes('failed to fetch') || err.message.toLowerCase().includes('html page')) {
        setShowServerConfig(true);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToken('');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    showToast('Logged out successfully.');
  };

  // Navigation State
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Dynamic Greeting based on time of day
  const greetingWord = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Global Interactive States
  const [searchQuery, setSearchQuery] = useState('');
  const [currentDate, setCurrentDate] = useState('2026-08-11');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Lesson Plan for "Graph Algorithms" is ready', time: '2 hours ago', read: false },
    { id: 2, text: 'Student John Smith submitted Midterm Project', time: '4 hours ago', read: false },
    { id: 3, text: 'Weekly productivity digest is available', time: '1 day ago', read: true }
  ]);
  const [toasts, setToasts] = useState([]);

  // Add a Toast Notification Helper
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Mark notifications as read
  const unreadCount = notifications.filter(n => !n.read).length;
  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    showToast('All notifications marked as read', 'info');
  };

  // Redirection handler from Quick Access / AI Assistant suggestion pills
  const handleQuickAccessRedirect = (tabName, prefillData = null) => {
    setActiveTab(tabName);
    if (prefillData) {
      // Pass prefill values into appropriate forms
      if (tabName === 'Lesson Planner') {
        setLessonTopic(prefillData.topic || '');
      } else if (tabName === 'Lecture Notes') {
        setLectureTopic(prefillData.topic || '');
      } else if (tabName === 'Rubric Generator') {
        setRubricTitle(prefillData.topic || '');
      } else if (tabName === 'Assessment Creator') {
        setAssessmentTopic(prefillData.topic || '');
      }
    }
    showToast(`Navigated to ${tabName}`);
  };

  // --- Sub-State for Lesson Planner Workspace ---
  const [lessonTopic, setLessonTopic] = useState('');
  const [lessonCourse, setLessonCourse] = useState('CS301');
  const [lessonDuration, setLessonDuration] = useState('50 Mins');
  const [lessonFocus, setLessonFocus] = useState('Practical/Coding');
  const [lessonGenerating, setLessonGenerating] = useState(false);
  const [generatedLesson, setGeneratedLesson] = useState(null);

  // --- API Error States ---
  const [lessonError, setLessonError] = useState(null);
  const [lectureError, setLectureError] = useState(null);
  const [presError, setPresError] = useState(null);
  const [assessmentError, setAssessmentError] = useState(null);
  const [rubricError, setRubricError] = useState(null);
  const [evalError, setEvalError] = useState(null);
  const [chatError, setChatError] = useState(null);

  // --- Evaluation Assistant Cache ---
  const [evaluatedResults, setEvaluatedResults] = useState({});

  const generateLessonPlan = async (e) => {
    if (e) e.preventDefault();
    if (!lessonTopic.trim()) {
      showToast('Please enter a lesson topic', 'error');
      return;
    }
    setLessonGenerating(true);
    setGeneratedLesson(null);
    setLessonError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/lesson-planner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course: lessonCourse,
          topic: lessonTopic,
          duration: lessonDuration,
          level: lessonFocus
        })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server error');
      }
      let data = await response.text();
      try {
        data = JSON.parse(data);
      } catch (e) {}
      setGeneratedLesson({
        topic: lessonTopic,
        course: lessonCourse === 'CS301' ? 'CS301 Data Structures' : lessonCourse === 'CS402' ? 'CS402 Artificial Intelligence' : 'CS101 Intro to Programming',
        duration: lessonDuration,
        focus: lessonFocus,
        isMarkdown: true,
        content: data
      });
      showToast('Lesson plan generated successfully!');
    } catch (err) {
      const friendlyMsg = getFriendlyErrorMessage(err.message);
      setLessonError(friendlyMsg);
      showToast(`Generation failed: ${friendlyMsg}`, 'error');
      if (err.message && (err.message.toLowerCase().includes('failed to fetch') || err.message.toLowerCase().includes('networkerror'))) {
        setShowServerConfig(true);
      }
    } finally {
      setLessonGenerating(false);
    }
  };

  // --- Sub-State for Lecture Notes Workspace ---
  const [lectureTopic, setLectureTopic] = useState('');
  const [lectureLevel, setLectureLevel] = useState('Intermediate');
  const [lectureFormat, setLectureFormat] = useState('Python Code Walkthrough');
  const [lectureGenerating, setLectureGenerating] = useState(false);
  const [generatedNotes, setGeneratedNotes] = useState(null);

  const generateLectureNotes = async (e) => {
    if (e) e.preventDefault();
    if (!lectureTopic.trim()) {
      showToast('Please enter a topic for lecture notes', 'error');
      return;
    }
    setLectureGenerating(true);
    setGeneratedNotes(null);
    setLectureError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/lecture-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course: lectureLevel.includes('101') ? 'CS101 Intro to Programming' : lectureLevel.includes('301') ? 'CS301 Data Structures' : 'CS402 Artificial Intelligence',
          topic: lectureTopic,
          depth: 'detailed',
          level: lectureLevel,
          format: lectureFormat
        })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server error');
      }
      let data = await response.text();
      try {
        data = JSON.parse(data);
      } catch (e) {}
      setGeneratedNotes({
        topic: lectureTopic,
        level: lectureLevel,
        format: lectureFormat,
        isMarkdown: true,
        content: data
      });
      showToast('Lecture notes compiled successfully!');
    } catch (err) {
      const friendlyMsg = getFriendlyErrorMessage(err.message);
      setLectureError(friendlyMsg);
      showToast(`Lecture notes failed: ${friendlyMsg}`, 'error');
      if (err.message && (err.message.toLowerCase().includes('failed to fetch') || err.message.toLowerCase().includes('networkerror'))) {
        setShowServerConfig(true);
      }
    } finally {
      setLectureGenerating(false);
    }
  };

  // --- Sub-State for Presentation Builder ---
  const [presTopic, setPresTopic] = useState('');
  const [presSlideCount, setPresSlideCount] = useState(5);
  const [presStyle, setPresStyle] = useState('Minimalist Professional');
  const [presGenerating, setPresGenerating] = useState(false);
  const [generatedSlides, setGeneratedSlides] = useState(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const generateSlides = async (e) => {
    if (e) e.preventDefault();
    if (!presTopic.trim()) {
      showToast('Please enter a presentation topic', 'error');
      return;
    }
    setPresGenerating(true);
    setGeneratedSlides(null);
    setCurrentSlideIndex(0);
    setPresError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/presentation-builder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: presTopic,
          num_slides: presSlideCount,
          audience: presStyle,
          style: presStyle
        })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server error');
      }
      const data = await response.json();
      
      const formatted = data.slides.map(slide => ({
        title: slide.title,
        subtitle: `Slide ${slide.slide_no}`,
        points: slide.bullet_points,
        notes: slide.speaker_notes
      }));

      setGeneratedSlides(formatted);
      showToast('Slides layout drafted!');
    } catch (err) {
      const friendlyMsg = getFriendlyErrorMessage(err.message);
      setPresError(friendlyMsg);
      showToast(`Slides build failed: ${friendlyMsg}`, 'error');
      if (err.message && (err.message.toLowerCase().includes('failed to fetch') || err.message.toLowerCase().includes('networkerror'))) {
        setShowServerConfig(true);
      }
    } finally {
      setPresGenerating(false);
    }
  };

  // --- Sub-State for Assessment Creator ---
  const [assessmentTopic, setAssessmentTopic] = useState('');
  const [assessmentFormat, setAssessmentFormat] = useState('Multiple Choice (MCQs)');
  const [assessmentDifficulty, setAssessmentDifficulty] = useState('Medium');
  const [assessmentCount, setAssessmentCount] = useState(3);
  const [assessmentGenerating, setAssessmentGenerating] = useState(false);
  const [generatedAssessment, setGeneratedAssessment] = useState(null);
  const [revealedAnswers, setRevealedAnswers] = useState({});

  const generateAssessment = async (e) => {
    if (e) e.preventDefault();
    if (!assessmentTopic.trim()) {
      showToast('Please enter a test topic', 'error');
      return;
    }
    setAssessmentGenerating(true);
    setGeneratedAssessment(null);
    setRevealedAnswers({});
    setAssessmentError(null);
    try {
      let qType = "MCQ";
      if (assessmentFormat === "Short Answer Problems") {
        qType = "short_answer";
      } else if (assessmentFormat === "Code Debugging Exercises") {
        qType = "mixed";
      }

      const response = await fetch(`${API_BASE_URL}/assessment-creator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit: assessmentTopic,
          total_marks: assessmentCount * 5,
          bloom_levels: assessmentDifficulty === "Easy" ? "Remember, Understand" : assessmentDifficulty === "Medium" ? "Apply, Analyze" : "Evaluate, Create",
          question_type: qType,
          question_count: assessmentCount
        })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server error');
      }
      const data = await response.json();
      
      const formatted = data.questions.map(q => ({
        id: q.q_no,
        q: q.question,
        options: q.options || [],
        answer: q.correct_answer || "Submit solution for review.",
        explanation: q.explanation || "No explanation provided."
      }));

      setGeneratedAssessment(formatted);
      showToast('Assessment generated successfully!');
    } catch (err) {
      const friendlyMsg = getFriendlyErrorMessage(err.message);
      setAssessmentError(friendlyMsg);
      showToast(`Assessment creation failed: ${friendlyMsg}`, 'error');
      if (err.message && (err.message.toLowerCase().includes('failed to fetch') || err.message.toLowerCase().includes('networkerror'))) {
        setShowServerConfig(true);
      }
    } finally {
      setAssessmentGenerating(false);
    }
  };

  // --- Sub-State for Rubric Generator ---
  const [rubricTitle, setRubricTitle] = useState('');
  const [rubricScale, setRubricScale] = useState('4-Level (Exemplary to Poor)');
  const [rubricCriteria, setRubricCriteria] = useState(['Functionality', 'Clean Code', 'Documentation']);
  const [rubricGenerating, setRubricGenerating] = useState(false);
  const [generatedRubric, setGeneratedRubric] = useState(null);

  const toggleCriterion = (c) => {
    if (rubricCriteria.includes(c)) {
      setRubricCriteria(rubricCriteria.filter(item => item !== c));
    } else {
      setRubricCriteria([...rubricCriteria, c]);
    }
  };

  const generateRubric = async (e) => {
    if (e) e.preventDefault();
    if (!rubricTitle.trim()) {
      showToast('Please enter an assignment title', 'error');
      return;
    }
    if (rubricCriteria.length === 0) {
      showToast('Select at least one assessment criterion', 'error');
      return;
    }
    setRubricGenerating(true);
    setGeneratedRubric(null);
    setRubricError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/rubric-generator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_title: rubricTitle,
          total_marks: 100,
          criteria_count: rubricCriteria.length,
          criteria_list: rubricCriteria
        })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server error');
      }
      const data = await response.json();
      
      const scaleColumns = rubricScale.includes('4')
        ? ['Exemplary (4pts)', 'Proficient (3pts)', 'Developing (2pts)', 'Needs Improvement (1pt)']
        : ['Excellent (3pts)', 'Passable (2pts)', 'Unsatisfactory (1pt)'];

      const rows = data.criteria.map(item => {
        const desc = {};
        if (rubricScale.includes('4')) {
          desc['Exemplary (4pts)'] = item.excellent;
          desc['Proficient (3pts)'] = item.good;
          desc['Developing (2pts)'] = item.fair;
          desc['Needs Improvement (1pt)'] = item.poor;
        } else {
          desc['Excellent (3pts)'] = item.excellent;
          desc['Passable (2pts)'] = item.good;
          desc['Unsatisfactory (1pt)'] = item.fair;
        }
        return { criterion: item.criterion, desc };
      });

      setGeneratedRubric({
        title: rubricTitle,
        scale: scaleColumns,
        rows
      });
      showToast('Grading rubric table compiled successfully!');
    } catch (err) {
      const friendlyMsg = getFriendlyErrorMessage(err.message);
      setRubricError(friendlyMsg);
      showToast(`Rubric generation failed: ${friendlyMsg}`, 'error');
      if (err.message && (err.message.toLowerCase().includes('failed to fetch') || err.message.toLowerCase().includes('networkerror'))) {
        setShowServerConfig(true);
      }
    } finally {
      setRubricGenerating(false);
    }
  };

  // --- Sub-State for Evaluation Assistant ---
  const studentsList = [
    { id: 'S001', name: 'Jane Doe', score: 'N/A', status: 'Submitted', date: '2 hours ago', code: 'def bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n-i-1):\n            if arr[j] > arr[j+1]:\n                arr[j], arr[j+1] = arr[j+1], arr[j]\n    return arr\n\n# Code runs correctly. Time Complexity: O(N^2).' },
    { id: 'S002', name: 'John Smith', score: 'N/A', status: 'Submitted', date: 'Yesterday', code: 'def quick_sort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quick_sort(left) + middle + quick_sort(right)\n\n# Dynamic partitioning code. Performance is good.' },
    { id: 'S003', name: 'Emily Davis', score: '15/20', status: 'Graded', date: '2 days ago', code: 'def search(arr, target):\n    # linear search implementation\n    for i in range(len(arr)):\n        if arr[i] == target:\n            return i\n    return -1' },
    { id: 'S004', name: 'Marcus Aurelius', score: 'N/A', status: 'Pending', date: 'No submission', code: '# Student has not submitted yet.' }
  ];
  const [selectedStudent, setSelectedStudent] = useState(studentsList[0]);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationFeedback, setEvaluationFeedback] = useState(null);
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [draftingEmail, setDraftingEmail] = useState(false);

  const startEvaluation = async () => {
    if (selectedStudent.status === 'Pending') {
      showToast('No submission to evaluate!', 'error');
      return;
    }
    setEvaluating(true);
    setEvaluationFeedback(null);
    setFeedbackEmail('');
    setEvalError(null);
    try {
      const activeSubmissions = studentsList
        .filter(st => st.status !== 'Pending' && st.code)
        .map(st => ({ student_id: st.id, answer_text: st.code }));

      const response = await fetch(`${API_BASE_URL}/evaluation-assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rubric: generatedRubric ? JSON.stringify(generatedRubric) : "General programming assignment rubric focusing on logic execution, time complexity efficiency, clean structure, comments and styling.",
          submissions: activeSubmissions
        })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server error');
      }
      const data = await response.json();
      
      const resultsMap = {};
      data.results.forEach(res => {
        resultsMap[res.student_id] = {
          score: res.ai_score,
          total: 20,
          strengths: res.strengths || [],
          improvements: res.improvements || [],
          comments: res.comments || res.feedback,
          confidence: res.confidence,
          flag: res.flag
        };
      });

      setEvaluatedResults(resultsMap);
      
      const currentFeedback = resultsMap[selectedStudent.id];
      if (currentFeedback) {
        setEvaluationFeedback(currentFeedback);
      }
      showToast(`Evaluated ${data.results.length} submissions concurrently!`);
    } catch (err) {
      const friendlyMsg = getFriendlyErrorMessage(err.message);
      setEvalError(friendlyMsg);
      showToast(`Evaluation failed: ${friendlyMsg}`, 'error');
      if (err.message && (err.message.toLowerCase().includes('failed to fetch') || err.message.toLowerCase().includes('networkerror'))) {
        setShowServerConfig(true);
      }
    } finally {
      setEvaluating(false);
    }
  };

  const draftEmailToStudent = () => {
    if (!evaluationFeedback) return;
    setDraftingEmail(true);
    setTimeout(() => {
      setFeedbackEmail(
        `Subject: Feedback on your Algorithm Submission - ${currentUser?.name || ''}\n\n` +
        `Hi ${selectedStudent.name},\n\n` +
        `I have evaluated your recent sorting algorithm submission. You scored ${evaluationFeedback.score}/${evaluationFeedback.total}.\n\n` +
        `Here are some highlights of your work:\n` +
        `${evaluationFeedback.strengths.map(s => `- ${s}`).join('\n')}\n\n` +
        `For improvements, consider:\n` +
        `${evaluationFeedback.improvements.map(i => `- ${i}`).join('\n')}\n\n` +
        `Overall: ${evaluationFeedback.comments}\n\n` +
        `Best regards,\n` +
        `${currentUser?.name || ''}\n` +
        `${currentUser?.department || ''} Department`
      );
      setDraftingEmail(false);
      showToast('Feedback email drafted!');
    }, 600);
  };

  // --- Sub-State for AI Chat Assistant ---
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: "Hello! I am your AI academic advisor. I can draft lesson plans, design exams, construct rubrics, or help you outline your research papers. What would you like to build today?" }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  const sendChatMessage = async (e, textOverride = '') => {
    if (e) e.preventDefault();
    const query = (textOverride || chatInput).trim();
    if (!query) return;

    setChatError(null);
    const updatedMessages = [...chatMessages, { role: 'user', text: query }];
    setChatMessages(updatedMessages);
    setChatInput('');
    setChatLoading(true);

    const history = chatMessages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : msg.role,
      content: msg.text
    }));

    try {
      const response = await fetch(`${API_BASE_URL}/chat-assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          conversation_history: history
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server error');
      }

      setChatLoading(false);
      
      // Add empty message for assistant that will be populated by SSE
      setChatMessages(prev => [...prev, { role: 'assistant', text: '' }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let assistantMessage = '';
      let buffer = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        buffer += decoder.decode(value || new Uint8Array(), { stream: !done });

        let boundary = buffer.indexOf('\n');
        while (boundary !== -1) {
          const line = buffer.slice(0, boundary).trim();
          buffer = buffer.slice(boundary + 1);

          if (line.startsWith('data: ')) {
            const rawPayload = line.substring(6);
            try {
              const parsed = JSON.parse(rawPayload);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.token) {
                assistantMessage += parsed.token;
                setChatMessages(prev => {
                  const copy = [...prev];
                  const last = copy[copy.length - 1];
                  if (last && last.role === 'assistant') {
                    last.text = assistantMessage;
                  }
                  return copy;
                });
              }
            } catch (err) {
              if (rawPayload && !rawPayload.startsWith('{')) {
                assistantMessage += rawPayload;
                setChatMessages(prev => {
                  const copy = [...prev];
                  const last = copy[copy.length - 1];
                  if (last && last.role === 'assistant') {
                    last.text = assistantMessage;
                  }
                  return copy;
                });
              } else if (err.message && err.message !== "Unexpected end of JSON input") {
                throw err;
              }
            }
          }
          boundary = buffer.indexOf('\n');
        }
      }
    } catch (err) {
      setChatLoading(false);
      const friendlyMsg = getFriendlyErrorMessage(err.message);
      setChatError(friendlyMsg);
      showToast(`Chat failed: ${friendlyMsg}`, 'error');
      if (err.message && (err.message.toLowerCase().includes('failed to fetch') || err.message.toLowerCase().includes('networkerror'))) {
        setShowServerConfig(true);
      }
      
      // Cleanup empty bubble if message generation aborted early
      setChatMessages(prev => {
        const last = prev[prev.length - 1];
        if (last && last.role === 'assistant' && !last.text) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    }
  };

  // --- Filtered Tools for Search ---
  const toolsList = [
    { name: 'Lesson Planner', color: 'bg-purple-50 text-[#6C5CE7]', badgeColor: 'purple', icon: BookOpen, desc: 'Draft academic lesson plans tailored to syllabus criteria and duration.' },
    { name: 'Lecture Notes', color: 'bg-blue-50 text-[#3B82F6]', badgeColor: 'blue', icon: FileText, desc: 'Compile detailed outlines, references, and coding examples for lectures.' },
    { name: 'Presentation Builder', color: 'bg-indigo-50 text-indigo-600', badgeColor: 'indigo', icon: Presentation, desc: 'Generate structured slide decks and speaker guidelines in minutes.' },
    { name: 'Assessment Creator', color: 'bg-emerald-50 text-[#2ECC71]', badgeColor: 'green', icon: ClipboardCheck, desc: 'Design quizzes, exams, coding problems, and multiple choice questions.' },
    { name: 'Rubric Generator', color: 'bg-amber-50 text-[#F5A623]', badgeColor: 'amber', icon: Grid, desc: 'Create tables representing grading scales, metrics, and definitions.' },
    { name: 'Evaluation Assistant', color: 'bg-rose-50 text-rose-600', badgeColor: 'rose', icon: GraduationCap, desc: 'Provide structural coding reviews and draft encouraging email feedback.' }
  ];

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return toolsList;
    return toolsList.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.desc.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);



  return (
    <div className="min-h-screen bg-brand-bg text-slate-800 flex font-sans antialiased selection:bg-[#6C5CE7]/20 relative">

      {/* Toast notifications portal */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 p-4 rounded-xl border shadow-lg animate-in slide-in-from-bottom duration-300 bg-white ${t.type === 'error' ? 'border-red-100 text-red-700' :
                t.type === 'info' ? 'border-blue-100 text-blue-700' :
                  'border-emerald-100 text-emerald-700'
              }`}
          >
            <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${t.type === 'error' ? 'text-red-500' : t.type === 'info' ? 'text-blue-500' : 'text-[#2ECC71]'}`} />
            <span className="text-sm font-medium">{t.message}</span>
          </div>
        ))}
      </div>

      {/* 1. LEFT SIDEBAR (Desktop) */}
      <aside className="hidden lg:flex flex-col w-[260px] bg-white border-r border-brand-border h-screen sticky top-0 flex-shrink-0 z-20">
        {/* Top: Logo */}
        <div className="p-6 border-b border-brand-border flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6C5CE7] to-[#8c7ff2] flex items-center justify-center shadow-md shadow-[#6C5CE7]/20 text-white font-bold">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">Faculty AI</h1>
          </div>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 mt-2 block">
            Academic Workflow Suite
          </span>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 scrollbar-thin">
          {[
            { name: 'Dashboard', icon: LayoutDashboard },
            { name: 'Lesson Planner', icon: BookOpen },
            { name: 'Lecture Notes', icon: FileText },
            { name: 'Presentation Builder', icon: Presentation },
            { name: 'Assessment Creator', icon: ClipboardCheck },
            { name: 'Rubric Generator', icon: Grid },
            { name: 'Evaluation Assistant', icon: GraduationCap },
            { name: 'Documentation', icon: FolderOpen },
            { name: 'Student Records', icon: Users },
            { name: 'AI Chat Assistant', icon: MessageSquare },
            { name: 'Calendar', icon: CalendarIcon },
            { name: 'Analytics', icon: BarChart3 },
            { name: 'Settings', icon: SettingsIcon }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                onClick={() => {
                  setActiveTab(item.name);
                  showToast(`Opened ${item.name}`, 'info');
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50 ${isActive
                    ? 'bg-[#6C5CE7] text-white shadow-md shadow-[#6C5CE7]/20'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <Icon className="w-4.5 h-4.5" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* API URL Config inline in sidebar */}
        {showServerConfig && (
          <div className="mx-4 mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-500 block">
                API Server URL
              </label>
              <button 
                type="button" 
                onClick={() => setShowServerConfig(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={tempApiUrl}
                onChange={(e) => setTempApiUrl(e.target.value)}
                placeholder="https://your-api.onrender.com"
                className="flex-1 min-w-0 px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:border-[#6C5CE7]"
              />
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={handleSaveApiUrl}
                  className="px-2 py-1 bg-[#6C5CE7] hover:bg-[#5b4ed6] text-white text-[10px] font-bold rounded-lg transition-colors whitespace-nowrap"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleResetApiUrl}
                  className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[9px] font-semibold rounded-lg transition-colors whitespace-nowrap"
                >
                  Reset
                </button>
              </div>
            </div>
            <p className="text-[8px] text-slate-400 leading-normal break-all font-mono">
              API: {API_BASE_URL}
            </p>
          </div>
        )}

        {/* User Profile */}
        <div className="p-4 border-t border-brand-border flex items-center justify-between mt-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
              <span className="font-bold text-[#6C5CE7] text-sm">{getUserInitials(currentUser?.name)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-800 leading-tight">{currentUser?.name}</span>
              <span className="text-[10px] text-slate-400">{currentUser?.department} Dept</span>
            </div>
          </div>
          <button 
            onClick={() => setShowServerConfig(!showServerConfig)}
            className="p-1.5 text-slate-400 hover:text-[#6C5CE7] rounded-lg transition-colors focus:outline-none"
            title="Configure Server URL"
          >
            <SettingsIcon className="w-4.5 h-4.5" />
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Slide-out Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
          <aside className="fixed top-0 left-0 bottom-0 w-[270px] bg-white flex flex-col shadow-2xl h-full animate-in slide-in-from-left duration-300">
            <div className="p-6 border-b border-brand-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6C5CE7] to-[#8c7ff2] flex items-center justify-center text-white font-bold">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">Faculty AI</h1>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scrollbar-thin">
              {[
                { name: 'Dashboard', icon: LayoutDashboard },
                { name: 'Lesson Planner', icon: BookOpen },
                { name: 'Lecture Notes', icon: FileText },
                { name: 'Presentation Builder', icon: Presentation },
                { name: 'Assessment Creator', icon: ClipboardCheck },
                { name: 'Rubric Generator', icon: Grid },
                { name: 'Evaluation Assistant', icon: GraduationCap },
                { name: 'Documentation', icon: FolderOpen },
                { name: 'Student Records', icon: Users },
                { name: 'AI Chat Assistant', icon: MessageSquare },
                { name: 'Calendar', icon: CalendarIcon },
                { name: 'Analytics', icon: BarChart3 },
                { name: 'Settings', icon: SettingsIcon }
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.name;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      setActiveTab(item.name);
                      setSidebarOpen(false);
                      showToast(`Opened ${item.name}`, 'info');
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                        ? 'bg-[#6C5CE7] text-white'
                        : 'text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </nav>
            {/* API URL Config inline in sidebar (Mobile) */}
            {showServerConfig && (
              <div className="mx-4 mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500 block">
                    API Server URL
                  </label>
                  <button 
                    type="button" 
                    onClick={() => setShowServerConfig(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={tempApiUrl}
                    onChange={(e) => setTempApiUrl(e.target.value)}
                    placeholder="https://your-api.onrender.com"
                    className="flex-1 min-w-0 px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:border-[#6C5CE7]"
                  />
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={handleSaveApiUrl}
                      className="px-2 py-1 bg-[#6C5CE7] hover:bg-[#5b4ed6] text-white text-[10px] font-bold rounded-lg transition-colors whitespace-nowrap"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={handleResetApiUrl}
                      className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[9px] font-semibold rounded-lg transition-colors whitespace-nowrap"
                    >
                      Reset
                    </button>
                  </div>
                </div>
                <p className="text-[8px] text-slate-400 leading-normal break-all font-mono">
                  API: {API_BASE_URL}
                </p>
              </div>
            )}

            <div className="p-4 border-t border-brand-border flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-[#6C5CE7]">
                {getUserInitials(currentUser?.name)}
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-xs font-bold text-slate-800">{currentUser?.name}</span>
                <span className="text-[10px] text-slate-400">{currentUser?.department} Dept</span>
              </div>
              <button 
                onClick={() => setShowServerConfig(!showServerConfig)}
                className="p-1.5 text-slate-400 hover:text-[#6C5CE7] rounded-lg transition-colors focus:outline-none"
                title="Configure Server URL"
              >
                <SettingsIcon className="w-4.5 h-4.5" />
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex flex-col min-w-0 max-w-full overflow-hidden p-6 lg:p-8 space-y-6">

        {/* 2. TOP BAR */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Hamburger (Mobile) */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 lg:hidden bg-white border border-brand-border rounded-xl text-slate-600 hover:bg-slate-50 transition-all focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50"
          >
            <Sparkles className="w-5 h-5 text-[#6C5CE7]" />
          </button>

          {/* Search container */}
          <div className="flex-1 max-w-md relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search anything... (e.g. Lesson, Quiz, John)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-brand-border bg-white text-sm placeholder-slate-400 focus:outline-none focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/10 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3 relative">
            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 bg-white border border-brand-border rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-brand-border rounded-2xl shadow-xl z-30 p-4 space-y-3 animate-in fade-in slide-in-from-top-3 duration-250">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-800">Notifications ({unreadCount} unread)</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-[10px] font-bold text-[#6C5CE7] hover:underline">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className={`p-2.5 rounded-xl text-xs space-y-1 ${n.read ? 'bg-slate-50/50' : 'bg-indigo-50/30 border border-indigo-100'}`}>
                        <p className={`text-slate-700 ${!n.read && 'font-semibold'}`}>{n.text}</p>
                        <span className="text-[10px] text-slate-400 block">{n.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Help circle */}
            <button
              onClick={() => showToast('Help guide loaded! Please check the sidebar parameters.')}
              className="p-2.5 bg-white border border-brand-border rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3. GREETING ROW */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
              {greetingWord}, {currentUser?.name}! 👋
            </h2>
            <p className="text-slate-500 text-sm">
              Here's your academic productivity overview for today.
            </p>
          </div>

          {/* Date Picker Pill */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-brand-border rounded-full text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50"
            >
              <CalendarIcon className="w-4 h-4 text-[#3B82F6]" />
              <span>{currentDate}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showDatePicker && (
              <div className="absolute right-0 mt-2 bg-white border border-brand-border rounded-xl shadow-xl p-3 z-30 space-y-2 w-48 text-xs">
                <span className="font-bold text-slate-600 block">Select Date</span>
                <input
                  type="date"
                  value={currentDate}
                  onChange={(e) => {
                    setCurrentDate(e.target.value);
                    setShowDatePicker(false);
                    showToast(`Selected date: ${e.target.value}`, 'info');
                  }}
                  className="w-full border border-brand-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50"
                />
              </div>
            )}
          </div>
        </div>

        {/* MAIN BODY CONTENTS SWITCHER */}
        {activeTab === 'Dashboard' ? (
          <>
            {/* 4. STAT CARDS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {[
                { label: 'Lessons Planned', num: '12', pct: '+20%', labelColor: 'purple', sub: 'This Week', icon: BookOpen, color: 'text-[#6C5CE7] bg-indigo-50 border-indigo-100' },
                { label: 'Assessments Created', num: '8', pct: '+15%', labelColor: 'green', sub: 'This Month', icon: ClipboardCheck, color: 'text-[#2ECC71] bg-emerald-50 border-emerald-100' },
                { label: 'Students Evaluated', num: '45', pct: '+10%', labelColor: 'amber', sub: 'This Month', icon: GraduationCap, color: 'text-[#F5A623] bg-amber-50 border-amber-100' },
                { label: 'Hours Saved', num: '18', pct: '+25%', labelColor: 'blue', sub: 'This Month', icon: Clock, color: 'text-[#3B82F6] bg-blue-50 border-blue-100' }
              ].map((stat, idx) => {
                const StatIcon = stat.icon;
                return (
                  <div key={idx} className="bg-white border border-brand-border p-5 rounded-2xl flex items-center justify-between shadow-[0_4px_16px_-4px_rgba(108,92,231,0.02)] hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${stat.color}`}>
                        <StatIcon className="w-6 h-6" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">{stat.label}</span>
                        <span className="text-2xl font-bold text-slate-800 leading-none">{stat.num}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{stat.sub}</span>
                      </div>
                    </div>
                    <span className="self-start text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-emerald-100">
                      <TrendingUp className="w-3 h-3" />
                      {stat.pct}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 5. THREE-COLUMN SECTION BELOW STATS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Column A (40%): Quick Access */}
              <div className="lg:col-span-5 bg-white border border-brand-border rounded-2xl p-6 flex flex-col justify-between shadow-[0_4px_16px_-4px_rgba(108,92,231,0.02)]">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800 text-sm tracking-tight">Quick Access</h3>
                    <button
                      onClick={() => handleQuickAccessRedirect('Documentation')}
                      className="text-[11px] font-bold text-[#6C5CE7] hover:underline flex items-center gap-0.5"
                    >
                      View All Tools <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* 2x3 Grid of tool tiles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {filteredTools.map((t, idx) => {
                      const ToolIcon = t.icon;
                      return (
                        <div
                          key={idx}
                          onClick={() => handleQuickAccessRedirect(t.name)}
                          className="p-4 bg-slate-50 border border-brand-border rounded-xl flex items-start justify-between cursor-pointer hover:bg-white hover:border-[#6C5CE7]/40 hover:shadow-sm focus-within:ring-2 focus-within:ring-[#6C5CE7]/50 transition-all group"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && handleQuickAccessRedirect(t.name)}
                        >
                          <div className="space-y-2.5 pr-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.color}`}>
                              <ToolIcon className="w-4.5 h-4.5" />
                            </div>
                            <div className="space-y-0.5">
                              <h4 className="text-xs font-bold text-slate-800 leading-tight group-hover:text-[#6C5CE7] transition-all">{t.name}</h4>
                              <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">{t.desc}</p>
                            </div>
                          </div>
                          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#6C5CE7] transition-all flex-shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 mt-4 text-center">
                  <button
                    onClick={() => handleQuickAccessRedirect('AI Chat Assistant')}
                    className="text-xs font-bold text-[#6C5CE7] hover:underline"
                  >
                    View All Tools →
                  </button>
                </div>
              </div>

              {/* Column B (35%): Today's Schedule */}
              <div className="lg:col-span-4 bg-white border border-brand-border rounded-2xl p-6 flex flex-col justify-between shadow-[0_4px_16px_-4px_rgba(108,92,231,0.02)]">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800 text-sm tracking-tight">Today's Schedule</h3>
                    <button
                      onClick={() => handleQuickAccessRedirect('Calendar')}
                      className="text-[11px] font-bold text-[#6C5CE7] hover:underline"
                    >
                      View Calendar
                    </button>
                  </div>

                  {/* Timeline list */}
                  <div className="space-y-5 relative pl-4 before:absolute before:left-1.5 before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-slate-100">
                    {[
                      { time: '09:00 AM', title: 'Data Structures Lecture', sub: 'CS301, Room 401', dot: 'bg-[#6C5CE7]' },
                      { time: '11:00 AM', title: 'Student Mentoring', sub: 'Office Hours - CS Dept', dot: 'bg-[#3B82F6]' },
                      { time: '01:30 PM', title: 'Assessment Review', sub: 'Mid-term Exam Evaluation', dot: 'bg-[#2ECC71]' },
                      { time: '03:30 PM', title: 'Research Time', sub: 'AI in Education Paper Draft', dot: 'bg-[#F5A623]' }
                    ].map((item, idx) => (
                      <div key={idx} className="relative space-y-0.5">
                        <span className={`absolute -left-[19px] top-1.5 w-2 h-2 rounded-full border border-white ring-4 ring-white ${item.dot}`}></span>
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{item.time}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-700 leading-tight">{item.title}</h4>
                        <p className="text-[10px] text-slate-400">{item.sub}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleQuickAccessRedirect('Calendar')}
                  className="w-full mt-5 py-2.5 bg-indigo-50/50 border border-indigo-100 hover:bg-indigo-50 text-[#6C5CE7] text-xs font-bold rounded-xl transition-all"
                >
                  View Full Schedule
                </button>
              </div>

              {/* Column C (25%): AI Assistant (Sparkle suggestion box) */}
              <div className="lg:col-span-3 bg-gradient-to-br from-indigo-500 to-[#6C5CE7] rounded-2xl p-6 text-white flex flex-col justify-between shadow-lg shadow-[#6C5CE7]/15 relative overflow-hidden">
                {/* Decorative Sparkle Icons */}
                <Sparkles className="absolute right-4 top-4 w-12 h-12 text-white/10" />
                <Sparkles className="absolute -left-2 -bottom-2 w-16 h-16 text-white/5" />

                <div className="space-y-4 relative z-10">
                  {/* Avatar robot */}
                  <div className="flex flex-col items-center text-center space-y-2 mt-2">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-inner">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-sm">Hi! I'm your AI Assistant.</h4>
                      <p className="text-white/80 text-[10px]">How can I help you today?</p>
                    </div>
                  </div>

                  {/* Stacked suggestions */}
                  <div className="space-y-2">
                    {[
                      { text: 'Generate lecture notes on Arrays', target: 'Lecture Notes', prefill: 'Arrays' },
                      { text: 'Create MCQs on Machine Learning', target: 'Assessment Creator', prefill: 'Machine Learning' },
                      { text: 'Make a rubric for Lab Report', target: 'Rubric Generator', prefill: 'Lab Report' },
                      { text: 'Summarize this research paper', target: 'AI Chat Assistant', prefill: 'Summarize research paper' }
                    ].map((pill, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickAccessRedirect(pill.target, { topic: pill.prefill })}
                        className="w-full text-left bg-white text-slate-800 hover:bg-slate-50 px-3.5 py-2 rounded-xl text-[10px] font-semibold flex items-center justify-between border border-white shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all group"
                      >
                        <span className="line-clamp-1">{pill.text}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleQuickAccessRedirect('AI Chat Assistant')}
                  className="w-full mt-4 py-2.5 bg-white text-[#6C5CE7] hover:bg-slate-50 text-xs font-bold rounded-xl transition-all shadow-md active:scale-95"
                >
                  Chat with AI Assistant
                </button>
              </div>

            </div>

            {/* 6. BOTTOM ROW (3 columns) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Column A: Recent Activities */}
              <div className="bg-white border border-brand-border rounded-2xl p-6 flex flex-col justify-between shadow-[0_4px_16px_-4px_rgba(108,92,231,0.02)]">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm tracking-tight mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#6C5CE7]" />
                    Recent Activities
                  </h3>
                  <div className="space-y-4">
                    {[
                      { title: 'Generated lecture notes for "Graph Algorithms"', time: '2 hours ago', icon: FileText, color: 'text-[#3B82F6] bg-blue-50' },
                      { title: 'Created assessment "DSA Quiz 1"', time: '5 hours ago', icon: ClipboardCheck, color: 'text-[#2ECC71] bg-emerald-50' },
                      { title: 'Evaluated 25 student submissions', time: 'Yesterday', icon: GraduationCap, color: 'text-[#F5A623] bg-amber-50' },
                      { title: 'Generated rubric for "Project Report"', time: '2 days ago', icon: Grid, color: 'text-rose-600 bg-rose-50' }
                    ].map((act, idx) => {
                      const ActIcon = act.icon;
                      return (
                        <div key={idx} className="flex items-start justify-between gap-3 text-xs">
                          <div className="flex gap-3">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${act.color}`}>
                              <ActIcon className="w-4 h-4" />
                            </div>
                            <span className="font-semibold text-slate-700 leading-normal">{act.title}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium text-right flex-shrink-0 pt-0.5">{act.time}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <button
                  onClick={() => handleQuickAccessRedirect('Documentation')}
                  className="w-full mt-4 text-center text-xs font-bold text-[#6C5CE7] hover:underline"
                >
                  View All Activities
                </button>
              </div>

              {/* Column B: AI Recommendations */}
              <div className="bg-white border border-brand-border rounded-2xl p-6 flex flex-col justify-between shadow-[0_4px_16px_-4px_rgba(108,92,231,0.02)]">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm tracking-tight mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#F5A623]" />
                    AI Recommendations
                  </h3>
                  <div className="space-y-3.5">
                    {[
                      { text: 'You can save 2 hours by using AI to grade assignments', action: 'Try Evaluation Assistant', target: 'Evaluation Assistant' },
                      { text: 'Students find these topics difficult: Pointers, Linked Lists, Recursion', action: 'Generate practice questions', target: 'Assessment Creator' },
                      { text: 'Your next class is in 2 hours', action: 'Need help preparing?', target: 'Lesson Planner' }
                    ].map((rec, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleQuickAccessRedirect(rec.target)}
                        className="p-3 bg-slate-50 border border-brand-border rounded-xl cursor-pointer hover:bg-slate-50/20 hover:border-[#6C5CE7]/30 transition-all flex items-center justify-between group"
                      >
                        <div className="space-y-0.5 pr-2">
                          <p className="text-xs font-semibold text-slate-700 leading-snug">{rec.text}</p>
                          <span className="text-[10px] font-bold text-[#6C5CE7] flex items-center gap-0.5 group-hover:underline">
                            {rec.action}
                          </span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#6C5CE7] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Column C: Productivity Overview (SVG Donut Chart) */}
              <div className="bg-white border border-brand-border rounded-2xl p-6 flex flex-col justify-between shadow-[0_4px_16px_-4px_rgba(108,92,231,0.02)]">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-800 text-sm tracking-tight">Productivity Overview</h3>
                    <div className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">This Month</div>
                  </div>

                  {/* SVG Donut Chart and Legend side by side */}
                  <div className="flex items-center justify-between gap-2 py-2">

                    {/* Ring Chart Graphic */}
                    <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        {/* Underlay ring */}
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#EFEFF5" strokeWidth="3" />

                        {/* Planning: 30% -> dasharray="30 70" offset="0" (purple) */}
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#6C5CE7" strokeWidth="3" strokeDasharray="30 70" strokeDashoffset="0" />

                        {/* Assessment: 25% -> dasharray="25 75" offset="30" (green) */}
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#2ECC71" strokeWidth="3" strokeDasharray="25 75" strokeDashoffset="-30" />

                        {/* Evaluation: 20% -> dasharray="20 80" offset="55" (amber) */}
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F5A623" strokeWidth="3" strokeDasharray="20 80" strokeDashoffset="-55" />

                        {/* Documentation: 15% -> dasharray="15 85" offset="75" (blue) */}
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3B82F6" strokeWidth="3" strokeDasharray="15 85" strokeDashoffset="-75" />

                        {/* Others: 10% -> dasharray="10 90" offset="90" (gray) */}
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#94A3B8" strokeWidth="3" strokeDasharray="10 90" strokeDashoffset="-90" />
                      </svg>
                      {/* Center label */}
                      <div className="absolute flex flex-col items-center justify-center text-center">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-none">Total</span>
                        <span className="text-sm font-extrabold text-slate-800">83</span>
                        <span className="text-[7px] text-slate-400 font-semibold uppercase leading-none">Activities</span>
                      </div>
                    </div>

                    {/* Legend list */}
                    <div className="flex-1 space-y-1.5 pl-2">
                      {[
                        { name: 'Planning', pct: '30%', dot: 'bg-[#6C5CE7]' },
                        { name: 'Assessment', pct: '25%', dot: 'bg-[#2ECC71]' },
                        { name: 'Evaluation', pct: '20%', dot: 'bg-[#F5A623]' },
                        { name: 'Documentation', pct: '15%', dot: 'bg-[#3B82F6]' },
                        { name: 'Others', pct: '10%', dot: 'bg-slate-400' }
                      ].map((lg, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${lg.dot}`}></span>
                            <span className="font-semibold text-slate-600">{lg.name}</span>
                          </div>
                          <span className="font-bold text-slate-800">{lg.pct}</span>
                        </div>
                      ))}
                    </div>

                  </div>
                </div>

                <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 text-center flex items-center justify-center gap-1 mt-2">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>18% more activities compared to last month</span>
                </div>
              </div>

            </div>
          </>
        ) : (
          /* OTHERWISE RENDER SPECIALIZED WORKSPACE TAB VIEW */
          <div className="bg-white border border-brand-border rounded-2xl p-6 lg:p-8 shadow-sm space-y-6">

            {/* Header section with back to dashboard button */}
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab('Dashboard')}
                  className="p-2 border border-brand-border rounded-xl text-slate-500 hover:bg-slate-50 transition-all focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50"
                  title="Back to Dashboard"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">AI Assistant Suite</span>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    {activeTab}
                  </h3>
                </div>
              </div>

              <div className="text-xs font-semibold text-[#6C5CE7] bg-[#6C5CE7]/5 px-3.5 py-1.5 rounded-full border border-[#6C5CE7]/20 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simulated Sandbox</span>
              </div>
            </div>

            {/* SCREEN RENDERING ENGINE */}

            {/* SCREEN A: Lesson Planner */}
            {activeTab === 'Lesson Planner' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Form column */}
                <form onSubmit={generateLessonPlan} className="lg:col-span-4 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Topic / Key Subject Concept</label>
                    <input
                      type="text"
                      placeholder="e.g. Intro to Binary Search Trees"
                      value={lessonTopic}
                      onChange={(e) => setLessonTopic(e.target.value)}
                      className="w-full px-3 py-2 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Course Allocation</label>
                    <select
                      value={lessonCourse}
                      onChange={(e) => setLessonCourse(e.target.value)}
                      className="w-full px-3 py-2 border border-brand-border bg-white rounded-xl text-sm focus:outline-none focus:border-[#6C5CE7]"
                    >
                      <option value="CS301">CS301 Data Structures</option>
                      <option value="CS402">CS402 Artificial Intelligence</option>
                      <option value="CS101">CS101 Intro to Programming</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Lesson Duration</label>
                      <select
                        value={lessonDuration}
                        onChange={(e) => setLessonDuration(e.target.value)}
                        className="w-full px-3 py-2 border border-brand-border bg-white rounded-xl text-sm focus:outline-none focus:border-[#6C5CE7]"
                      >
                        <option>50 Mins</option>
                        <option>75 Mins</option>
                        <option>120 Mins</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Pedagogical Focus</label>
                      <select
                        value={lessonFocus}
                        onChange={(e) => setLessonFocus(e.target.value)}
                        className="w-full px-3 py-2 border border-brand-border bg-white rounded-xl text-sm focus:outline-none focus:border-[#6C5CE7]"
                      >
                        <option>Theoretical / Math</option>
                        <option>Practical / Coding</option>
                        <option>Interactive Activities</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={lessonGenerating}
                    className="w-full py-3 bg-[#6C5CE7] hover:bg-[#5b4ed6] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {lessonGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generating Plan...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate AI Lesson Plan
                      </>
                    )}
                  </button>
                </form>

                {/* Display Output column */}
                <div className="lg:col-span-8 bg-slate-50 border border-brand-border rounded-2xl p-6 min-h-[300px] flex flex-col justify-between">
                  {lessonError && (
                    <div className="p-4 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-xs">
                      <AlertTriangle className="w-4.5 h-4.5 text-red-500 flex-shrink-0" />
                      <span>{lessonError}</span>
                    </div>
                  )}
                  {generatedLesson ? (
                    <div className="space-y-5">
                      <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-slate-800 text-base">{generatedLesson.topic}</h4>
                          <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                            <span className="bg-indigo-50 text-[#6C5CE7] px-2 py-0.5 rounded-full">{generatedLesson.course}</span>
                            <span className="bg-blue-50 text-[#3B82F6] px-2 py-0.5 rounded-full">{generatedLesson.duration}</span>
                            <span className="bg-emerald-50 text-[#2ECC71] px-2 py-0.5 rounded-full">Focus: {generatedLesson.focus}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { 
                            const copyText = generatedLesson.isMarkdown ? generatedLesson.content : JSON.stringify(generatedLesson);
                            navigator.clipboard.writeText(copyText);
                            showToast('Copied to clipboard!'); 
                          }} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 shadow-sm" title="Copy">
                            <Copy className="w-4 h-4 text-slate-500" />
                          </button>
                        </div>
                      </div>

                      {generatedLesson.isMarkdown ? (
                        <div className="text-xs text-slate-600 leading-relaxed max-h-[500px] overflow-y-auto pr-2">
                          {renderMarkdown(generatedLesson.content)}
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2.5">
                            <h5 className="text-xs font-bold text-[#6C5CE7]">Learning Objectives</h5>
                            <ul className="list-disc pl-4 space-y-1 text-xs text-slate-600">
                              {generatedLesson.objectives.map((obj, i) => <li key={i}>{obj}</li>)}
                            </ul>
                          </div>

                          <div className="space-y-3">
                            <h5 className="text-xs font-bold text-[#6C5CE7]">Session Agenda Timeline</h5>
                            <div className="space-y-2">
                              {generatedLesson.agenda.map((ag, i) => (
                                <div key={i} className="flex gap-3 bg-white border border-slate-150 p-2.5 rounded-lg text-xs">
                                  <span className="font-bold text-[#3B82F6] w-18 flex-shrink-0">{ag.time}</span>
                                  <div className="space-y-0.5">
                                    <span className="font-bold text-slate-700 block">{ag.activity}</span>
                                    <span className="text-slate-500 text-[11px] leading-relaxed">{ag.detail}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl text-xs space-y-1.5">
                            <span className="font-bold text-[#6C5CE7] block">Exit Ticket Check-in Question</span>
                            <p className="text-indigo-950 font-normal italic leading-relaxed">"{generatedLesson.assessment}"</p>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-2 py-10">
                      <BookOpen className="w-12 h-12 text-slate-300" />
                      <h4 className="font-bold text-slate-700 text-sm">No Lesson Plan Generated Yet</h4>
                      <p className="text-slate-400 text-xs max-w-sm">Enter a topic on the left and click generate to create a pedagogically detailed structured lesson draft.</p>
                    </div>
                  )}

                  {generatedLesson && (
                    <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 mt-6">
                      <button onClick={() => { setGeneratedLesson(null); showToast('Draft cleared'); }} className="px-4 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs hover:bg-slate-100 transition-all font-semibold">
                        Clear Draft
                      </button>
                      <button onClick={() => { showToast('Saved to Documents library'); }} className="px-4 py-2 bg-[#6C5CE7] text-white rounded-lg text-xs hover:bg-[#5b4ed6] transition-all font-semibold">
                        Save to Library
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SCREEN B: Lecture Notes */}
            {activeTab === 'Lecture Notes' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Form column */}
                <form onSubmit={generateLectureNotes} className="lg:col-span-4 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Lecture Topic / Core Term</label>
                    <input
                      type="text"
                      placeholder="e.g. Big-O Complexity and Array Algorithms"
                      value={lectureTopic}
                      onChange={(e) => setLectureTopic(e.target.value)}
                      className="w-full px-3 py-2 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-[#6C5CE7]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Difficulty Grade</label>
                    <select
                      value={lectureLevel}
                      onChange={(e) => setLectureLevel(e.target.value)}
                      className="w-full px-3 py-2 border border-brand-border bg-white rounded-xl text-sm focus:outline-none focus:border-[#6C5CE7]"
                    >
                      <option>Beginner (CS101)</option>
                      <option>Intermediate (CS301)</option>
                      <option>Advanced (CS400+)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Lecture Note Format</label>
                    <select
                      value={lectureFormat}
                      onChange={(e) => setLectureFormat(e.target.value)}
                      className="w-full px-3 py-2 border border-brand-border bg-white rounded-xl text-sm focus:outline-none focus:border-[#6C5CE7]"
                    >
                      <option>Python Code Walkthrough</option>
                      <option>Theoretical Definitions Outline</option>
                      <option>Step-by-step Math Derivations</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={lectureGenerating}
                    className="w-full py-3 bg-[#6C5CE7] hover:bg-[#5b4ed6] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {lectureGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Analyzing and Structuring...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Lecture Notes
                      </>
                    )}
                  </button>
                </form>

                {/* Display Output column */}
                <div className="lg:col-span-8 bg-slate-50 border border-brand-border rounded-2xl p-6 min-h-[300px] flex flex-col justify-between">
                  {lectureError && (
                    <div className="p-4 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-xs">
                      <AlertTriangle className="w-4.5 h-4.5 text-red-500 flex-shrink-0" />
                      <span>{lectureError}</span>
                    </div>
                  )}
                  {generatedNotes ? (
                    <div className="space-y-5">
                      <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-slate-800 text-base">{generatedNotes.topic} Notes</h4>
                          <span className="text-[10px] font-bold bg-[#3B82F6]/10 text-[#3B82F6] px-2 py-0.5 rounded-full">
                            {generatedNotes.level} · {generatedNotes.format}
                          </span>
                        </div>
                        <button onClick={() => { 
                          const copyText = generatedNotes.isMarkdown ? generatedNotes.content : JSON.stringify(generatedNotes);
                          navigator.clipboard.writeText(copyText);
                          showToast('Copied to clipboard!'); 
                        }} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100" title="Copy">
                          <Copy className="w-4 h-4 text-slate-500" />
                        </button>
                      </div>

                      {generatedNotes.isMarkdown ? (
                        <div className="text-xs text-slate-600 leading-relaxed max-h-[500px] overflow-y-auto pr-2">
                          {renderMarkdown(generatedNotes.content)}
                        </div>
                      ) : (
                        <>
                          <p className="text-xs text-slate-600 leading-relaxed italic border-l-4 border-blue-500 pl-3">
                            {generatedNotes.summary}
                          </p>

                          <div className="space-y-4">
                            {generatedNotes.sections.map((section, idx) => (
                              <div key={idx} className="space-y-2">
                                <h5 className="text-xs font-bold text-slate-800">{section.title}</h5>
                                <p className="text-xs text-slate-600 leading-relaxed">{section.content}</p>
                                {section.code && (
                                  <pre className="bg-slate-900 text-slate-100 p-3.5 rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed shadow-inner">
                                    <code>{section.code}</code>
                                  </pre>
                                )}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-2 py-10">
                      <FileText className="w-12 h-12 text-slate-300" />
                      <h4 className="font-bold text-slate-700 text-sm">No Lecture Notes Compiled Yet</h4>
                      <p className="text-slate-400 text-xs max-w-sm">Provide details and trigger generation to output formatted references, sample code templates and content outlines.</p>
                    </div>
                  )}

                  {generatedNotes && (
                    <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 mt-6">
                      <button onClick={() => setGeneratedNotes(null)} className="px-4 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs hover:bg-slate-100 transition-all font-semibold">
                        Discard
                      </button>
                      <button onClick={() => { showToast('Saved to library'); }} className="px-4 py-2 bg-[#6C5CE7] text-white rounded-lg text-xs hover:bg-[#5b4ed6] transition-all font-semibold">
                        Save Lecture Note
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SCREEN C: Presentation Builder */}
            {activeTab === 'Presentation Builder' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Form Column */}
                <form onSubmit={generateSlides} className="lg:col-span-4 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Presentation Topic</label>
                    <input
                      type="text"
                      placeholder="e.g. Introduction to Artificial Neural Networks"
                      value={presTopic}
                      onChange={(e) => setPresTopic(e.target.value)}
                      className="w-full px-3 py-2 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-[#6C5CE7]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Number of Slides</label>
                    <input
                      type="number"
                      min={3}
                      max={15}
                      value={presSlideCount}
                      onChange={(e) => setPresSlideCount(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-[#6C5CE7]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Presentation Theme Style</label>
                    <select
                      value={presStyle}
                      onChange={(e) => setPresStyle(e.target.value)}
                      className="w-full px-3 py-2 border border-brand-border bg-white rounded-xl text-sm focus:outline-none focus:border-[#6C5CE7]"
                    >
                      <option>Minimalist Professional</option>
                      <option>Academic Technical</option>
                      <option>Creative Visual</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={presGenerating}
                    className="w-full py-3 bg-[#6C5CE7] hover:bg-[#5b4ed6] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {presGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Structuring slides and outlines...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Draft Slides Structure
                      </>
                    )}
                  </button>
                </form>

                {/* Display Output column */}
                <div className="lg:col-span-8 bg-slate-50 border border-brand-border rounded-2xl p-6 min-h-[300px] flex flex-col justify-between">
                  {presError && (
                    <div className="p-4 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-xs">
                      <AlertTriangle className="w-4.5 h-4.5 text-red-500 flex-shrink-0" />
                      <span>{presError}</span>
                    </div>
                  )}
                  {generatedSlides ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                        <div className="space-y-0.5">
                          <h4 className="font-extrabold text-slate-800 text-sm">Slides Draft Draft: {presTopic}</h4>
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Theme: {presStyle}</span>
                        </div>
                        <span className="text-xs font-bold bg-indigo-100 text-[#6C5CE7] px-2.5 py-1 rounded-full">
                          Slide {currentSlideIndex + 1} of {generatedSlides.length}
                        </span>
                      </div>

                      {/* Presentation Slide Mockup */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-h-[180px] flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-tr from-[#6C5CE7]/10 to-indigo-600/10 rounded-bl-full"></div>

                        <div className="space-y-3 relative z-10">
                          <h5 className="font-bold text-slate-800 text-sm">{generatedSlides[currentSlideIndex].title}</h5>
                          {generatedSlides[currentSlideIndex].subtitle && (
                            <p className="text-[#6C5CE7] text-xs font-medium">{generatedSlides[currentSlideIndex].subtitle}</p>
                          )}
                          <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-600">
                            {generatedSlides[currentSlideIndex].points.map((p, i) => <li key={i}>{p}</li>)}
                          </ul>
                        </div>

                        <div className="text-[10px] text-slate-400 mt-4 border-t border-slate-100 pt-2 flex items-center justify-between">
                          <span>Faculty AI Academic Deck</span>
                          <span className="font-bold">{currentUser?.department} Dept - {currentUser?.name}</span>
                        </div>
                      </div>

                      {/* Speaker Notes */}
                      <div className="p-3.5 bg-slate-100/80 border border-slate-200 rounded-xl text-xs space-y-1">
                        <span className="font-bold text-[#3B82F6] block uppercase tracking-wider text-[10px]">Speaker Presentation Notes:</span>
                        <p className="text-slate-600 leading-relaxed italic">"{generatedSlides[currentSlideIndex].notes}"</p>
                      </div>

                      {/* Navigation Carousel controls */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                        <button
                          onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                          disabled={currentSlideIndex === 0}
                          className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-100 disabled:opacity-40"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentSlideIndex(prev => Math.min(generatedSlides.length - 1, prev + 1))}
                          disabled={currentSlideIndex === generatedSlides.length - 1}
                          className="px-3.5 py-1.5 bg-[#6C5CE7] text-white rounded-lg text-xs font-bold hover:bg-[#5b4ed6] disabled:opacity-40"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-2 py-10">
                      <Presentation className="w-12 h-12 text-slate-300" />
                      <h4 className="font-bold text-slate-700 text-sm">No Slides Drafted Yet</h4>
                      <p className="text-slate-400 text-xs max-w-sm">Provide a topic and hit generate to draft a complete outlines page list with customized speaker guidance.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SCREEN D: Assessment Creator */}
            {activeTab === 'Assessment Creator' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Form Column */}
                <form onSubmit={generateAssessment} className="lg:col-span-4 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Topic / Focus Chapter</label>
                    <input
                      type="text"
                      placeholder="e.g. Relational Databases and SQL Joins"
                      value={assessmentTopic}
                      onChange={(e) => setAssessmentTopic(e.target.value)}
                      className="w-full px-3 py-2 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-[#6C5CE7]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Assessment Format</label>
                    <select
                      value={assessmentFormat}
                      onChange={(e) => setAssessmentFormat(e.target.value)}
                      className="w-full px-3 py-2 border border-brand-border bg-white rounded-xl text-sm focus:outline-none focus:border-[#6C5CE7]"
                    >
                      <option>Multiple Choice (MCQs)</option>
                      <option>Code Debugging Exercises</option>
                      <option>Short Answer Problems</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Difficulty Grade</label>
                      <select
                        value={assessmentDifficulty}
                        onChange={(e) => setAssessmentDifficulty(e.target.value)}
                        className="w-full px-3 py-2 border border-brand-border bg-white rounded-xl text-sm focus:outline-none focus:border-[#6C5CE7]"
                      >
                        <option>Easy</option>
                        <option>Medium</option>
                        <option>Hard</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Question Count</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={assessmentCount}
                        onChange={(e) => setAssessmentCount(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-[#6C5CE7]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={assessmentGenerating}
                    className="w-full py-3 bg-[#6C5CE7] hover:bg-[#5b4ed6] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {assessmentGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generating Questions...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Create Assessment
                      </>
                    )}
                  </button>
                </form>

                {/* Display Output Column */}
                <div className="lg:col-span-8 bg-slate-50 border border-brand-border rounded-2xl p-6 min-h-[300px] flex flex-col justify-between">
                  {assessmentError && (
                    <div className="p-4 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-xs">
                      <AlertTriangle className="w-4.5 h-4.5 text-red-500 flex-shrink-0" />
                      <span>{assessmentError}</span>
                    </div>
                  )}
                  {generatedAssessment ? (
                    <div className="space-y-5">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                        <div className="space-y-0.5">
                          <h4 className="font-extrabold text-slate-800 text-base">{assessmentTopic} Quiz</h4>
                          <span className="text-[10px] font-bold bg-emerald-50 text-[#2ECC71] px-2 py-0.5 rounded-full">
                            Difficulty: {assessmentDifficulty} · {assessmentFormat}
                          </span>
                        </div>
                        <button onClick={() => { showToast('Quiz copied to clipboard!'); }} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100" title="Copy">
                          <Copy className="w-4 h-4 text-slate-500" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        {generatedAssessment.map((q) => (
                          <div key={q.id} className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 shadow-sm">
                            <span className="text-xs font-bold text-slate-800 block">{q.q}</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {q.options.map((opt, i) => (
                                <div key={i} className="p-2.5 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-100 font-medium">
                                  {opt}
                                </div>
                              ))}
                            </div>

                            {/* Answer key drawer */}
                            <div className="border-t border-slate-100 pt-2.5">
                              <button
                                onClick={() => setRevealedAnswers(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                                className="text-[10px] font-bold text-[#6C5CE7] hover:underline"
                              >
                                {revealedAnswers[q.id] ? 'Hide Answer & Explanation' : 'View Correct Answer & Explanation'}
                              </button>

                              {revealedAnswers[q.id] && (
                                <div className="mt-2 text-xs space-y-1.5 p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg">
                                  <span className="font-bold text-[#2ECC71] block">Correct Answer: {q.answer}</span>
                                  <p className="text-slate-600 leading-relaxed text-[11px]">{q.explanation}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-2 py-10">
                      <ClipboardCheck className="w-12 h-12 text-slate-300" />
                      <h4 className="font-bold text-slate-700 text-sm">No Exam Drafted Yet</h4>
                      <p className="text-slate-400 text-xs max-w-sm">Define assessment topic and preferences on the left, then click create to generate academic test formats.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SCREEN E: Rubric Generator */}
            {activeTab === 'Rubric Generator' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Form Column */}
                <div className="lg:col-span-4 space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Assignment Title</label>
                    <input
                      type="text"
                      placeholder="e.g. CS301 Final Project Draft"
                      value={rubricTitle}
                      onChange={(e) => setRubricTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-[#6C5CE7]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Grading Levels Scale</label>
                    <select
                      value={rubricScale}
                      onChange={(e) => setRubricScale(e.target.value)}
                      className="w-full px-3 py-2 border border-brand-border bg-white rounded-xl text-sm focus:outline-none focus:border-[#6C5CE7]"
                    >
                      <option>4-Level (Exemplary to Poor)</option>
                      <option>3-Level (Excellent to Unsatisfactory)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">Assessment Criteria Fields</label>
                    <div className="space-y-2">
                      {['Functionality', 'Clean Code', 'Documentation', 'UX & UI Design'].map((crit) => (
                        <label key={crit} className="flex items-center gap-2.5 text-xs text-slate-700 font-medium cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rubricCriteria.includes(crit)}
                            onChange={() => toggleCriterion(crit)}
                            className="rounded text-[#6C5CE7] focus:ring-[#6C5CE7] w-4.5 h-4.5"
                          />
                          <span>{crit}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={generateRubric}
                    disabled={rubricGenerating}
                    className="w-full py-3 bg-[#6C5CE7] hover:bg-[#5b4ed6] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {rubricGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Compiling Matrix Table...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Grading Rubric
                      </>
                    )}
                  </button>
                </div>

                {/* Display Output Column */}
                <div className="lg:col-span-8 bg-slate-50 border border-brand-border rounded-2xl p-6 min-h-[300px] flex flex-col justify-between overflow-x-auto">
                  {rubricError && (
                    <div className="p-4 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-xs">
                      <AlertTriangle className="w-4.5 h-4.5 text-red-500 flex-shrink-0" />
                      <span>{rubricError}</span>
                    </div>
                  )}
                  {generatedRubric ? (
                    <div className="space-y-5">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                        <h4 className="font-extrabold text-slate-800 text-sm">Rubric: {generatedRubric.title}</h4>
                        <button onClick={() => { showToast('Rubric copied!'); }} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100" title="Copy">
                          <Copy className="w-4 h-4 text-slate-500" />
                        </button>
                      </div>

                      {/* Rubric Matrix HTML Table */}
                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                              <th className="p-3 border-r border-slate-200">Criteria</th>
                              {generatedRubric.scale.map((col, i) => (
                                <th key={i} className="p-3 border-r border-slate-200 last:border-r-0">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {generatedRubric.rows.map((row, idx) => (
                              <tr key={idx} className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50/50">
                                <td className="p-3 font-bold text-slate-800 border-r border-slate-200 bg-slate-50/30 w-28">{row.criterion}</td>
                                {generatedRubric.scale.map((col, i) => (
                                  <td key={i} className="p-3 text-[11px] text-slate-500 leading-normal border-r border-slate-200 last:border-r-0">
                                    {row.desc[col] || 'Performance alignment description.'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-2 py-10">
                      <Grid className="w-12 h-12 text-slate-300" />
                      <h4 className="font-bold text-slate-700 text-sm">No Rubric Matrix Compiled</h4>
                      <p className="text-slate-400 text-xs max-w-sm">Determine assessment objectives, criteria rows and points levels scale to layout evaluation grids.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SCREEN F: Evaluation Assistant */}
            {activeTab === 'Evaluation Assistant' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left panel: student lists select */}
                <div className="lg:col-span-4 space-y-4">
                  <span className="text-xs font-bold text-slate-500 block">Class Submissions (Mid-term project)</span>
                  <div className="space-y-2">
                    {studentsList.map((st) => (
                      <div
                        key={st.id}
                        onClick={() => {
                          setSelectedStudent(st);
                          setFeedbackEmail('');
                          if (evaluatedResults[st.id]) {
                            setEvaluationFeedback(evaluatedResults[st.id]);
                          } else {
                            setEvaluationFeedback(null);
                          }
                        }}
                        className={`p-3 border rounded-xl cursor-pointer transition-all flex items-center justify-between ${selectedStudent.id === st.id
                            ? 'border-[#6C5CE7] bg-indigo-50/30'
                            : 'border-brand-border hover:bg-slate-50'
                          }`}
                      >
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-slate-800 block">{st.name}</span>
                          <span className="text-[10px] text-slate-400">{st.id} · {st.date}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.status === 'Graded' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            st.status === 'Submitted' ? 'bg-blue-50 text-[#3B82F6] border border-blue-100' :
                              'bg-slate-100 text-slate-400'
                          }`}>
                          {st.status === 'Graded' ? st.score : st.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right panel: file evaluation analyzer */}
                <div className="lg:col-span-8 space-y-6">
                  {evalError && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-xs">
                      <AlertTriangle className="w-4.5 h-4.5 text-red-500 flex-shrink-0" />
                      <span>{evalError}</span>
                    </div>
                  )}
                  {/* File submission preview */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Submitted Work Preview: {selectedStudent.name}</span>
                      <span className="text-slate-400">File: main.py</span>
                    </div>
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-2xl text-[11px] font-mono overflow-x-auto shadow-inner leading-relaxed min-h-[140px]">
                      <code>{selectedStudent.code}</code>
                    </pre>
                  </div>

                  {selectedStudent.status !== 'Pending' ? (
                    <div className="space-y-4">
                      {/* Assess button */}
                      {!evaluationFeedback && (
                        <button
                          onClick={startEvaluation}
                          disabled={evaluating}
                          className="w-full py-3 bg-[#6C5CE7] hover:bg-[#5b4ed6] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                        >
                          {evaluating ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Running Code Review Algorithms...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              Evaluate Student Submission
                            </>
                          )}
                        </button>
                      )}

                      {/* Display grading matrix details */}
                      {evaluationFeedback && (
                        <div className="space-y-5 bg-slate-50 border border-brand-border p-6 rounded-2xl animate-in fade-in duration-200">
                          {evaluationFeedback.flag && (
                            <div className="p-3.5 bg-amber-50 border border-amber-250 text-amber-800 text-xs rounded-xl flex items-start gap-2">
                              <AlertTriangle className="w-4.5 h-4.5 text-amber-500 mt-0.5 flex-shrink-0" />
                              <div className="space-y-0.5">
                                <span className="font-bold">Evaluation Warning ({evaluationFeedback.confidence} Confidence)</span>
                                <p className="text-[10px] leading-relaxed">{evaluationFeedback.flag}</p>
                              </div>
                            </div>
                          )}
                          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                            <div className="space-y-0.5">
                              <h4 className="font-bold text-slate-800 text-sm">Grading Performance Breakdown</h4>
                              <p className="text-[10px] text-slate-400">Evaluated on algorithmic guidelines</p>
                            </div>
                            <span className="text-xl font-extrabold text-[#6C5CE7] bg-indigo-50 border border-indigo-100 px-3.5 py-1 rounded-xl">
                              {evaluationFeedback.score} / {evaluationFeedback.total} Points
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div className="space-y-1.5">
                              <span className="font-bold text-emerald-600 flex items-center gap-1">
                                <ThumbsUp className="w-3.5 h-3.5" /> Strengths
                              </span>
                              <ul className="list-disc pl-4 space-y-1 text-slate-600">
                                {evaluationFeedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
                              </ul>
                            </div>
                            <div className="space-y-1.5">
                              <span className="font-bold text-[#F5A623] flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" /> Opportunities for Improvement
                              </span>
                              <ul className="list-disc pl-4 space-y-1 text-slate-600">
                                {evaluationFeedback.improvements.map((im, i) => <li key={i}>{im}</li>)}
                              </ul>
                            </div>
                          </div>

                          <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
                            <span className="font-bold text-slate-700 block">General Feedback Comments:</span>
                            <p className="text-slate-500 italic">"{evaluationFeedback.comments}"</p>
                          </div>

                          {/* Email generator */}
                          <div className="border-t border-slate-200 pt-4 space-y-3">
                            {!feedbackEmail ? (
                              <button
                                onClick={draftEmailToStudent}
                                disabled={draftingEmail}
                                className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-[#6C5CE7] border border-indigo-100 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all"
                              >
                                {draftingEmail ? 'Writing Draft...' : 'Draft Encouraging Feedback Email'}
                              </button>
                            ) : (
                              <div className="space-y-2 animate-in fade-in duration-200">
                                <span className="text-xs font-bold text-slate-700 block">Encouraging Feedback Draft</span>
                                <textarea
                                  value={feedbackEmail}
                                  onChange={(e) => setFeedbackEmail(e.target.value)}
                                  rows={8}
                                  className="w-full p-3 border border-slate-200 bg-white rounded-xl text-xs font-mono leading-relaxed focus:outline-none focus:border-[#6C5CE7]"
                                />
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => setFeedbackEmail('')} className="px-3 py-1.5 border border-slate-200 text-slate-500 rounded-lg text-[11px] font-semibold hover:bg-slate-100">
                                    Discard
                                  </button>
                                  <button onClick={() => { showToast('Simulated: Email dispatched successfully'); setFeedbackEmail(''); }} className="px-4 py-1.5 bg-[#6C5CE7] text-white rounded-lg text-[11px] font-semibold hover:bg-[#5b4ed6] flex items-center gap-1">
                                    <Send className="w-3.5 h-3.5" /> Send to Student
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 bg-slate-100 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
                      This student has not yet loaded a project submission. Grading is unavailable.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SCREEN G: Documentation */}
            {activeTab === 'Documentation' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <span className="text-xs font-bold text-slate-500">Draft Library Storage</span>
                  <div className="text-xs text-slate-400">Total artifacts saved: 5</div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                        <th className="p-3">Draft Name</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Date Modified</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: 'Lecture_Notes_Graph_Algorithms.md', type: 'Lecture Notes', date: '2 hours ago' },
                        { name: 'Quiz_1_SQL_Joins.pdf', type: 'Assessment', date: '5 hours ago' },
                        { name: `${currentUser?.name ? currentUser.name.replace(/\s+/g, '') : 'User'}_Activity_Report.xlsx`, type: 'Analytics', date: 'Yesterday' },
                        { name: 'Lesson_Plan_Recursion_Optimizations.pdf', type: 'Lesson Plan', date: '2 days ago' },
                        { name: 'Final_Project_Evaluation_Matrix.csv', type: 'Rubric', date: '3 days ago' }
                      ].map((doc, idx) => (
                        <tr key={idx} className="border-b border-slate-150 last:border-none hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-slate-700">{doc.name}</td>
                          <td className="p-3 text-slate-500">{doc.type}</td>
                          <td className="p-3 text-slate-400">{doc.date}</td>
                          <td className="p-3 text-right flex justify-end gap-1.5">
                            <button onClick={() => { showToast('Content preview copied'); }} className="p-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-500" title="Copy text">
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => { showToast('Downloading file layout...'); }} className="p-1.5 bg-indigo-50 text-[#6C5CE7] hover:bg-indigo-100 rounded-lg" title="Download">
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SCREEN H: Student Records */}
            {activeTab === 'Student Records' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <span className="text-xs font-bold text-slate-500">CS301 Class Roster (Mock)</span>
                  <button onClick={() => showToast('Student registration placeholder')} className="px-3.5 py-1.5 bg-[#6C5CE7] text-white text-xs font-bold rounded-xl flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Add Student
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                        <th className="p-3">Student Name</th>
                        <th className="p-3">ID</th>
                        <th className="p-3">Current Grade</th>
                        <th className="p-3">Attendance</th>
                        <th className="p-3">Engagement Level</th>
                        <th className="p-3 text-right">Intervention</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: 'Jane Doe', id: 'S001', grade: '92% (A)', attend: '96%', engage: 'High', color: 'text-emerald-600 bg-emerald-50' },
                        { name: 'John Smith', id: 'S002', grade: '88% (B+)', attend: '92%', engage: 'Medium', color: 'text-[#3B82F6] bg-blue-50' },
                        { name: 'Emily Davis', id: 'S003', grade: '74% (C)', attend: '85%', engage: 'Medium', color: 'text-[#3B82F6] bg-blue-50' },
                        { name: 'Marcus Aurelius', id: 'S004', grade: '48% (F)', attend: '58%', engage: 'Critical', color: 'text-red-600 bg-red-50' }
                      ].map((student, idx) => (
                        <tr key={idx} className="border-b border-slate-150 last:border-none hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-slate-700">{student.name}</td>
                          <td className="p-3 text-slate-400 font-mono">{student.id}</td>
                          <td className="p-3 font-bold text-slate-800">{student.grade}</td>
                          <td className="p-3 text-slate-500">{student.attend}</td>
                          <td className="p-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${student.color}`}>
                              {student.engage}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                showToast(`Intervention mail prepared for ${student.name}`);
                                handleQuickAccessRedirect('AI Chat Assistant', { topic: `Write an academic warning/support email to student ${student.name} with ID ${student.id} who has ${student.grade} grade and ${student.attend} attendance` });
                              }}
                              className="px-2.5 py-1 border border-[#6C5CE7]/30 text-[#6C5CE7] rounded-lg hover:bg-indigo-50 font-bold text-[10px]"
                            >
                              Draft Intervention
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SCREEN I: AI Chat Assistant */}
            {activeTab === 'AI Chat Assistant' && (
              <div className="flex flex-col h-[520px] max-h-[520px] justify-between bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-inner">
                {/* Chat header */}
                <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#6C5CE7]/10 flex items-center justify-center text-[#6C5CE7]">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 leading-none">Pedagogical Chat Assistant</h4>
                      <span className="text-[9px] text-[#2ECC71] font-semibold mt-1 inline-block">Online</span>
                    </div>
                  </div>
                  <button onClick={() => setChatMessages([{ role: 'assistant', text: `Chat history cleared. How can I help you, ${currentUser?.name || ''}?` }])} className="text-[10px] font-bold text-slate-400 hover:text-red-500 flex items-center gap-0.5">
                    <Trash2 className="w-3.5 h-3.5" /> Clear History
                  </button>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                  {chatError && (
                    <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                      <AlertTriangle className="w-4.5 h-4.5 text-red-500 flex-shrink-0" />
                      <span>{chatError}</span>
                    </div>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs ${msg.role === 'user'
                          ? 'bg-[#6C5CE7] text-white rounded-tr-none'
                          : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none shadow-sm'
                        }`}>
                        <span className="font-bold text-[9px] opacity-75 uppercase tracking-wider block mb-1">
                          {msg.role === 'user' ? 'You' : 'AI Assistant'}
                        </span>
                        <div className="leading-relaxed space-y-1.5">{renderMarkdown(msg.text)}</div>
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white text-slate-400 border border-slate-250 rounded-2xl rounded-tl-none px-4 py-2.5 text-xs shadow-sm flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#6C5CE7]" />
                        <span>Formulating response...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Suggestion pre-fills */}
                <div className="p-3 bg-white/70 border-t border-slate-100 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
                  {[
                    'Design quiz on Arrays',
                    'Outline a Lecture on Recursion',
                    'Draft a coding rubric',
                    'Explain grading matrix'
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => sendChatMessage(e, p)}
                      className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-full text-[10px] font-semibold inline-block focus:outline-none focus:ring-1 focus:ring-[#6C5CE7]/50"
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* Input block */}
                <form onSubmit={sendChatMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask anything about teaching, grading, or lesson planning..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#6C5CE7] focus:bg-white"
                  />
                  <button type="submit" className="p-2 bg-[#6C5CE7] hover:bg-[#5b4ed6] text-white rounded-xl transition-all shadow-sm">
                    <Send className="w-4.5 h-4.5" />
                  </button>
                </form>
              </div>
            )}

            {/* SCREEN J: Calendar */}
            {activeTab === 'Calendar' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Month Grid */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-slate-800 text-sm">August 2026</h4>
                    <span className="text-xs text-slate-400 font-bold">Monthly View</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1 border border-slate-200 rounded-xl overflow-hidden bg-slate-100">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                      <div key={d} className="p-2 text-center text-[10px] font-bold text-slate-500 bg-slate-50">{d}</div>
                    ))}
                    {/* Fill days */}
                    {Array.from({ length: 31 }).map((_, idx) => {
                      const dayNum = idx + 1;
                      const hasEvent = [11, 12, 18, 25].includes(dayNum);
                      const isToday = dayNum === 11;
                      return (
                        <div key={idx} className={`bg-white min-h-[64px] p-1.5 flex flex-col justify-between border border-slate-100 relative ${isToday && 'ring-2 ring-[#6C5CE7] z-10'}`}>
                          <span className={`text-[10px] font-bold ${isToday ? 'text-[#6C5CE7]' : 'text-slate-600'}`}>{dayNum}</span>
                          {hasEvent && (
                            <span className="w-full h-1 bg-[#6C5CE7] rounded-full block mt-auto"></span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sidebar details */}
                <div className="lg:col-span-4 space-y-4">
                  <span className="text-xs font-bold text-slate-500 block">Timeline: Aug 11 (Today)</span>
                  <div className="space-y-3.5">
                    {[
                      { time: '09:00 AM', name: 'CS301 Lecture', color: 'border-l-4 border-[#6C5CE7] bg-indigo-50/20' },
                      { time: '11:00 AM', name: 'Advising Slots', color: 'border-l-4 border-[#3B82F6] bg-blue-50/20' },
                      { time: '01:30 PM', name: 'Grading Review', color: 'border-l-4 border-[#2ECC71] bg-emerald-50/20' }
                    ].map((item, i) => (
                      <div key={i} className={`p-3 rounded-xl border border-slate-150 flex items-center justify-between ${item.color}`}>
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-slate-800 block">{item.name}</span>
                          <span className="text-[10px] text-slate-400">{item.time}</span>
                        </div>
                        <Check className="w-4 h-4 text-emerald-500" />
                      </div>
                    ))}
                  </div>
                  <button onClick={() => showToast('Calendar booking simulator')} className="w-full py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-[#6C5CE7] transition-all">
                    + Add Calendar Reminder
                  </button>
                </div>
              </div>
            )}

            {/* SCREEN K: Analytics */}
            {activeTab === 'Analytics' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Weekly Workload Reduction</span>
                    <span className="text-xl font-black text-slate-850">8.5 Hours Saved</span>
                    <p className="text-[9px] text-emerald-600 font-bold mt-1">↑ 12% boost this week</p>
                  </div>
                  <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Total Materials Generated</span>
                    <span className="text-xl font-black text-slate-850">28 Assets</span>
                    <p className="text-[9px] text-slate-400 font-bold mt-1">No duplicates logged</p>
                  </div>
                  <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Average Student Grading Score</span>
                    <span className="text-xl font-black text-slate-850">84.2%</span>
                    <p className="text-[9px] text-slate-400 font-bold mt-1">CS301 midterm evaluation</p>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Simulated Asset Generation Trends</h4>
                  {/* Mock Bar Chart using CSS grid and divs */}
                  <div className="h-48 flex items-end gap-5 pl-4 border-l border-b border-slate-200 pb-2">
                    {[
                      { week: 'Week 1', height: 'h-1/4', val: '4' },
                      { week: 'Week 2', height: 'h-2/5', val: '8' },
                      { week: 'Week 3', height: 'h-3/4', val: '12' },
                      { week: 'Week 4', height: 'h-5/6', val: '18' }
                    ].map((bar, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <span className="text-[9px] font-bold text-slate-400">{bar.val}</span>
                        <div className={`w-full bg-[#6C5CE7] rounded-t-lg transition-all hover:bg-[#5b4ed6] ${bar.height} shadow-sm`}></div>
                        <span className="text-[9px] font-bold text-slate-500 block uppercase">{bar.week}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN L: Settings */}
            {activeTab === 'Settings' && (
              <div className="max-w-xl space-y-5">
                <h4 className="font-extrabold text-slate-800 text-sm">System Parameter Tuning</h4>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">AI Language Core Engine</label>
                    <select className="w-full p-2.5 border border-brand-border bg-white rounded-xl text-xs focus:outline-none focus:border-[#6C5CE7]">
                      <option>Gemini 1.5 Flash (Default Speed)</option>
                      <option>Gemini 1.5 Pro (In-depth analysis)</option>
                      <option>Claude 3.5 Sonnet (Advanced Pedagogy)</option>
                      <option>GPT-4o Academic (Detailed Outline)</option>
                    </select>
                    <span className="text-[10px] text-slate-400 block mt-1">This defines the core prompt reasoning context used during asset compiling.</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Export Default Structure</label>
                    <div className="flex gap-4 text-xs font-medium text-slate-600">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name="exportFmt" defaultChecked className="text-[#6C5CE7] focus:ring-[#6C5CE7]" />
                        <span>Markdown / HTML</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name="exportFmt" className="text-[#6C5CE7] focus:ring-[#6C5CE7]" />
                        <span>Formatted PDF File</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">API Integration Status</label>
                    <div className="p-3 bg-amber-50 border border-amber-100 text-amber-700 text-xs rounded-xl flex items-start gap-2">
                      <Lock className="w-4.5 h-4.5 flex-shrink-0 text-amber-500 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-bold block">Developer Mode Simulator</span>
                        <p className="text-[11px] leading-relaxed">No custom keys entered. The tool is currently running on localized academic templates. To wire production routes, connect a server backend.</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-4 flex justify-end">
                    <button onClick={() => { showToast('Settings applied!'); setActiveTab('Dashboard'); }} className="px-5 py-2.5 bg-[#6C5CE7] text-white text-xs font-bold rounded-xl hover:bg-[#5b4ed6] transition-all">
                      Save & Apply Preferences
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </main>

    </div>
  );
}
