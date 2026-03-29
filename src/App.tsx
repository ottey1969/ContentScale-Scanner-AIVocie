import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  MapPin, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  ExternalLink, 
  Copy, 
  Phone, 
  Mail, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  BarChart3,
  X,
  ShieldCheck,
  Zap,
  Ghost,
  Layout,
  Clock,
  CheckCircle,
  Building2,
  Download,
  Trash2,
  MessageSquare,
  AlertTriangle,
  Bot,
  ClipboardList,
  Scale,
  ShieldAlert,
  Inbox,
  PhoneOff,
  XCircle,
  Eye,
  EyeOff,
  History,
  UserCheck,
  Mic,
  MicOff,
  Globe,
  List,
  Trophy,
  Users,
  FileCode,
  Share2,
  FileDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";

declare global {
  interface Window {
    Vapi: any;
  }
}

// --- Types ---
interface Lead {
  name: string;
  website: string;
  phone?: string;
  email?: string;
  estimated_pages: number;
  opportunity: string;
  pitch_angle: string;
  industry_id: string;
  sitemap?: string;
  sitemap_source?: 'robots.txt' | 'verified' | 'fallback';
  content_score?: number;
  tags?: string[];
  callStatus?: string;
  callNote?: string;
  callId?: string;
}

interface Industry {
  id: string;
  label: string;
  q: string;
}

interface BucketDef {
  key: string;
  label: string;
  sublabel: string;
  range: string;
  cls: string;
  icon: React.ReactNode;
  hot: string;
  action: string;
  desc: string;
}

// --- Constants ---
const INDUSTRIES: Industry[] = [
  { id: 'restaurants', label: 'Restaurants / Cafes', q: 'restaurants cafes bars bistros' },
  { id: 'hotels', label: 'Hotels / B&Bs', q: 'hotels bed breakfast guesthouses' },
  { id: 'marketing', label: 'Marketing Agencies', q: 'marketing digital advertising agencies' },
  { id: 'law', label: 'Law Firms', q: 'law firms solicitors lawyers' },
  { id: 'realestate', label: 'Real Estate', q: 'real estate property estate agencies' },
  { id: 'dental', label: 'Dental / Medical', q: 'dental clinics doctors medical practices' },
  { id: 'gyms', label: 'Gyms / Fitness', q: 'gyms fitness studios personal trainers yoga' },
  { id: 'accounting', label: 'Accounting / Finance', q: 'accounting bookkeeping financial advisors' },
  { id: 'ecommerce', label: 'E-commerce / Retail', q: 'ecommerce online shops retail boutiques' },
  { id: 'construction', label: 'Construction / Trades', q: 'construction builders plumbers electricians' },
  { id: 'education', label: 'Education / Tutoring', q: 'tutoring schools education training centres' },
  { id: 'beauty', label: 'Beauty / Wellness', q: 'hair salons beauty spas nail studios wellness' },
  { id: 'tech', label: 'Tech / IT Services', q: 'IT services tech companies software development' },
  { id: 'events', label: 'Events / Venues', q: 'event venues wedding planners catering companies' },
  { id: 'automotive', label: 'Automotive', q: 'car dealerships auto repair garages mechanics' },
  { id: 'consulting', label: 'Consulting / HR', q: 'business consulting HR recruitment management' },
  { id: 'photography', label: 'Photography / Video', q: 'photographers videographers creative studios' },
  { id: 'logistics', label: 'Logistics / Transport', q: 'logistics transport courier delivery companies' },
  { id: 'architecture', label: 'Architecture / Design', q: 'architecture interior design landscape firms' },
  { id: 'nonprofit', label: 'Nonprofits / Charity', q: 'nonprofits charities community foundations' },
];

const BUCKET_DEFS: BucketDef[] = [
  { key: 'ghost', label: 'NEARLY EMPTY', sublabel: 'Ghost Sites', range: '0 – 5 Pages', cls: 'bk-ghost', icon: <Ghost className="w-5 h-5" />, hot: '⚠ Verify Budget', action: 'Build from scratch', desc: 'Homepage only — almost nothing indexed. Verify they have budget before pitching.' },
  { key: 'skeleton', label: 'BARE BONES', sublabel: 'Skeleton Sites', range: '5 – 15 Pages', cls: 'bk-skeleton', icon: <Zap className="w-5 h-5" />, hot: '🔥 EASIEST SELL', action: 'Write all their missing pages', desc: 'Real business making money — website says almost nothing. Lowest resistance pitch.' },
  { key: 'brochure', label: 'BUILT & FORGOT', sublabel: 'Brochure Sites', range: '15 – 30 Pages', cls: 'bk-brochure', icon: <Layout className="w-5 h-5" />, hot: '🔥 HIGH PRIORITY', action: 'Blog + SEO content strategy', desc: 'Has all the basic pages but zero blog, no case studies, thin copy. Built once, ignored since.' },
  { key: 'stale', label: 'GONE QUIET', sublabel: 'Stale Sites', range: '30 – 60 Pages', cls: 'bk-stale', icon: <Clock className="w-5 h-5" />, hot: '✓ Retainer Target', action: 'Restart their content engine', desc: 'Started content marketing then stopped. Blog is months or years out of date.' },
  { key: 'active', label: 'NEEDS QUALITY', sublabel: 'Active Sites', range: '60 – 150 Pages', cls: 'bk-active', icon: <CheckCircle className="w-5 h-5" />, hot: '✓ Audit + Retainer', action: 'Content audit + rewrite plan', desc: 'Publishing but inconsistently. Quality is low, SEO structure is a mess.' },
  { key: 'estab', label: 'LARGE LIBRARY', sublabel: 'Established', range: '150+ Pages', cls: 'bk-estab', icon: <Building2 className="w-5 h-5" />, hot: '↗ High Ticket', action: 'Content audit pitch', desc: 'Big content library. Likely has writers. Pitch an audit — 30% is probably hurting rankings.' },
];

const LS_KEY_ANTHROPIC = 'lc_anthropic_key';
const LS_KEY_SESSION = 'lc_session';
const LS_VAPI = 'lc_vapi_config';
const LS_CALL_LOG = 'lc_call_log';
const LS_TERMS = 'lc_terms_accepted';
const LS_COMP_MODE = 'lc_compliance_mode';
const LS_LICENSE = 'lc_license';

interface VapiConfig {
  vapiKey: string;
  phoneId: string;
  callerName: string;
  company: string;
  callback: string;
  openingLine: string;
}

interface CallLogEntry {
  leadId: string;
  callId: string;
  name: string;
  phone: string;
  type: string;
  state: string;
  statusText: string;
  summary: string;
  ts: number;
}

interface LicenseInfo {
  key: string;
  valid: boolean;
  plan: string;
  activatedAt: number;
  email: string;
}

// --- Main Component ---
export default function App() {
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isKeySaved, setIsKeySaved] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<{ type: 'idle' | 'testing' | 'success' | 'error', message: string }>({ type: 'idle', message: '' });

  const [leads, setLeads] = useState<Lead[]>([]);
  const [completedIndustries, setCompletedIndustries] = useState<Set<string>>(new Set());
  const [industryStatus, setIndustryStatus] = useState<Record<string, { state: 'idle' | 'running' | 'done' | 'error', count: number, error?: string }>>({});
  const [isCrawling, setIsCrawling] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [activeBucket, setActiveBucket] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'score' | 'pages'>('score');
  const [isStrategyOpen, setIsStrategyOpen] = useState(true);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

  // Deploy Otto Test Form
  const [testIndustry, setTestIndustry] = useState('');
  const [testService, setTestService] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [testCallStatus, setTestCallStatus] = useState('');

  // Browser Call State
  const [isBrowserCalling, setIsBrowserCalling] = useState(false);
  const vapiRef = useRef<any>(null);

  // Vapi State
  const [showFullScript, setShowFullScript] = useState(false);
  const [vapiConfig, setVapiConfig] = useState<VapiConfig>({
    vapiKey: '',
    phoneId: '4a3b17c5-24f0-4e65-b64d-29e8e3f446a3',
    callerName: 'OTTO',
    company: 'ContentScale AI Voice Division',
    callback: '+31 6 2807 3996',
    openingLine: "Hi, just to be transparent — I'm an AI assistant calling on behalf of Ottmar from ContentScale. Is this {name}? I just scanned your website and spotted something that could help you get more clients — do you have 2 minutes?"
  });
  const [isVapiPanelOpen, setIsVapiPanelOpen] = useState(false);
  const [callLog, setCallLog] = useState<CallLogEntry[]>([]);
  const [callStates, setCallStates] = useState<Record<string, { state: string, statusText: string, callId?: string }>>({});
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [complianceMode, setComplianceMode] = useState(true);
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [licenseInput, setLicenseInput] = useState('');
  const [licenseStatus, setLicenseStatus] = useState({ type: 'idle', message: '' });

  // SEO Scanner State
  const [activeTab, setActiveTab] = useState<'scanner' | 'crawler' | 'leaderboard' | 'experts' | 'templates'>('scanner');
  const [scannerMode, setScannerMode] = useState<'single' | 'bulk' | 'sitemap'>('single');
  const [activeTemplate, setActiveTemplate] = useState<number | null>(null);
  const [singleUrl, setSingleUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [bulkUrls, setBulkUrls] = useState('');
  const [bulkResults, setBulkResults] = useState<any[]>([]);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [sitemapUrls, setSitemapUrls] = useState<string[]>([]);
  const [isFetchingSitemap, setIsFetchingSitemap] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const stopRef = useRef(false);
  const pollIntervals = useRef<Record<string, NodeJS.Timeout>>({});

  const normalizeUrl = (url: string) => {
    if (!url) return '';
    let normalized = url.trim();
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = 'https://' + normalized;
    }
    return normalized;
  };

  // --- Initialization ---
  useEffect(() => {
    const savedLeaderboard = localStorage.getItem('cs_leaderboard');
    if (savedLeaderboard) {
      try {
        setLeaderboard(JSON.parse(savedLeaderboard));
      } catch (e) {}
    }

    const savedKey = localStorage.getItem(LS_KEY_ANTHROPIC);
    if (savedKey) {
      setApiKey(savedKey);
      setIsKeySaved(true);
    }

    const savedSession = localStorage.getItem(LS_KEY_SESSION);
    if (savedSession) {
      try {
        const data = JSON.parse(savedSession);
        setCity(data.city || '');
        setCountry(data.country || '');
      } catch (e) {
        console.error('Failed to load session', e);
      }
    }

    const savedVapi = localStorage.getItem(LS_VAPI);
    if (savedVapi) {
      try {
        setVapiConfig(JSON.parse(savedVapi));
      } catch (e) {}
    }

    const savedCallLog = localStorage.getItem(LS_CALL_LOG);
    if (savedCallLog) {
      try {
        setCallLog(JSON.parse(savedCallLog));
      } catch (e) {}
    }

    const savedTerms = localStorage.getItem(LS_TERMS);
    if (savedTerms) {
      try {
        const t = JSON.parse(savedTerms);
        setTermsAccepted(t.accepted === true);
      } catch (e) {}
    }

    const savedCompMode = localStorage.getItem(LS_COMP_MODE);
    if (savedCompMode !== null) {
      setComplianceMode(savedCompMode === 'true');
    }

    const savedLicense = localStorage.getItem(LS_LICENSE);
    if (savedLicense) {
      try {
        setLicense(JSON.parse(savedLicense));
      } catch (e) {}
    }

    return () => {
      Object.values(pollIntervals.current).forEach(clearInterval);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get('url');
    if (urlParam) {
      setSingleUrl(urlParam);
      setActiveTab('scanner');
      setScannerMode('single');
    }
  }, []);

  // --- Vapi Handlers ---
  const saveVapiConfig = () => {
    if (!vapiConfig.vapiKey || !vapiConfig.phoneId || !vapiConfig.callerName) {
      alert('⚠ Fill in API Key, Phone Number ID and your name');
      return;
    }
    localStorage.setItem(LS_VAPI, JSON.stringify(vapiConfig));
    alert('✅ Voicebot config saved!');
  };

  const activateLicense = async () => {
    if (!termsAccepted) {
      setIsTermsModalOpen(true);
      return;
    }
    const key = licenseInput.trim().toUpperCase();
    if (!key || key.length < 10) {
      setLicenseStatus({ type: 'error', message: '❌ Enter a valid license key' });
      return;
    }
    setLicenseStatus({ type: 'testing', message: '⟳ Validating...' });
    try {
      const resp = await fetch('/api/license/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      });
      const data = await resp.json();
      if (resp.ok && data.valid) {
        const info = { key, valid: true, plan: data.plan || 'voicebot', activatedAt: Date.now(), email: data.email || '' };
        setLicense(info);
        localStorage.setItem(LS_LICENSE, JSON.stringify(info));
        setLicenseStatus({ type: 'success', message: '🎉 License activated!' });
      } else {
        setLicenseStatus({ type: 'error', message: `❌ ${data.error || 'Invalid key'}` });
      }
    } catch (e: any) {
      setLicenseStatus({ type: 'error', message: `❌ Server error: ${e.message}` });
    }
  };

  const buildAssistant = (lead: Lead) => {
    const name = lead.name || 'there';
    const domain = (lead.website || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
    const score = lead.content_score || '?';
    const pages = lead.estimated_pages || '?';
    const cityVal = city || 'your city';
    const type = lead.tags?.[0] || 'business';
    const pitch = lead.pitch_angle || `Your website only has about ${pages} pages and could use more content to rank on Google.`;

    const opening = vapiConfig.openingLine
      .replace('{name}', name)
      .replace('{score}', String(score))
      .replace('{pages}', String(pages))
      .replace('{city}', cityVal);

    const systemPrompt = `[Identity]
You are OTTO, the Elite Sales EXPERT operating in Demo Mode. You act as the Admin for ContentScale AI Voice Division, specializing in advanced qualification of incoming leads on behalf of the business. Your personality embodies confidence, directness, and the "Challenger" sales mindset.

[Style]
- Speak with a confident, direct, and professional tone.
- Use brief, two-sentence maximum turns.
- Ask one precise question at a time and wait for the user’s response before proceeding.
- Incorporate natural breath pauses and, in case of silence, use human-like prompts such as "Are you there?" or "Does that make sense?"
- Avoid stating empathy phrases like "I understand" or "I hear you." Instead, use direct transitions: "Got it. Next..." or "Right. Moving on..."
- If an answer is vague, push for specificity with follow-ups like: "That's a bit broad. Specifically, what is the number we're looking at?"

[Response Guidelines]
- Never break character.
- If they ask about the GRAAF Framework, explain it briefly as the gold standard for content quality (Genuinely Credible, Relevant, Actionable, Accurate, Fresh).
- Your goal is to qualify the lead and get their email to send a full report.

[Context]
You are calling ${name}, a ${type} in ${cityVal}.
Their website: ${domain}
Pages found: ~${pages}
Key gap: ${pitch}`;

    return {
      firstMessage: opening,
      model: {
        provider: 'openai',
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          }
        ],
        temperature: 0.7,
      },
      voice: {
        provider: '11labs',
        voiceId: 'pNInz6obpgDQGcFmaJgB', // OTTO voice
      },
      endCallMessage: 'Thanks for your time, have a great day!',
      voicemailMessage: `Hi, this is ${vapiConfig.callerName} from ${vapiConfig.company}. I analysed ${domain} and found some great opportunities to help with your online visibility. Call me back on ${vapiConfig.callback} — have a great day!`,
      maxDurationSeconds: 240,
      backgroundSound: 'off',
      backchannelingEnabled: true,
      endCallFunctionEnabled: true,
    };
  };

  const triggerDeployOtto = async () => {
    if (!termsAccepted) {
      setIsTermsModalOpen(true);
      return;
    }
    if (!license || !license.valid) {
      alert('⚠ Voicebot feature requires a license');
      return;
    }
    if (!vapiConfig.vapiKey || !vapiConfig.phoneId) {
      setIsVapiPanelOpen(true);
      alert('⚠ Configure your Voicebot first');
      return;
    }
    if (!testPhone || !testIndustry) {
      alert('Please fill in Industry and Phone Number');
      return;
    }

    if (!/^\+[1-9]\d{7,14}$/.test(testPhone)) {
      alert('Phone number must be in E.164 format, e.g. +31628073996');
      return;
    }

    setTestCallStatus('Architecting lead criteria...');
    
    const mockLead: Lead = {
      name: 'Prospect',
      website: 'your-business.com',
      phone: testPhone,
      estimated_pages: 10,
      opportunity: `Needs better content for their ${testIndustry} business.`,
      pitch_angle: `I noticed you offer ${testService} and your website could use more expert content to rank higher.`,
      industry_id: 'test',
      content_score: 45
    };

    const assistant = buildAssistant(mockLead);
    const callBody = {
      phoneNumberId: vapiConfig.phoneId,
      customer: { number: testPhone, name: 'Prospect' },
      assistant: assistant,
    };

    try {
      const resp = await fetch('/api/voicebot/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-vapi-key': vapiConfig.vapiKey },
        body: JSON.stringify(callBody)
      });
      const data = await resp.json();
      if (!resp.ok || !data.id) {
        throw new Error(data.error || 'Call failed');
      }
      setTestCallStatus('SESSION LIVE — PICK UP YOUR PHONE');
      
      const newEntry: CallLogEntry = {
        leadId: 'test-call',
        callId: data.id,
        name: `Test Call (${testIndustry})`,
        phone: testPhone,
        type: 'Test',
        state: 'calling',
        statusText: 'Ringing...',
        summary: '',
        ts: Date.now()
      };
      setCallLog(prev => {
        const next = [newEntry, ...prev].slice(0, 100);
        localStorage.setItem(LS_CALL_LOG, JSON.stringify(next));
        return next;
      });
      startPolling('test-call', data.id);
    } catch (e: any) {
      setTestCallStatus(`Error: ${e.message}`);
    }
  };

  const startBrowserCall = () => {
    if (!window.Vapi) {
      alert('Vapi SDK not loaded');
      return;
    }
    
    if (!vapiRef.current) {
      // Using the public key from the user's provided HTML
      vapiRef.current = new window.Vapi('faf296f1-fd90-42e0-abb3-4c7125db43b8');
      
      vapiRef.current.on('call-start', () => setIsBrowserCalling(true));
      vapiRef.current.on('call-end', () => setIsBrowserCalling(false));
      vapiRef.current.on('error', (e: any) => {
        console.error('Vapi Error:', e);
        setIsBrowserCalling(false);
      });
    }

    if (isBrowserCalling) {
      vapiRef.current.stop();
    } else {
      // Using the assistant ID from the user's provided HTML
      vapiRef.current.start('b4ba165e-daaa-4723-a10d-40262359a8da');
    }
  };

  // --- SEO Scanner Handlers ---
  const performGeminiAnalysis = async (rawContent: string, url: string) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze the following website content for SEO quality using the GRAAF framework.
        URL: ${url}
        Content: ${rawContent}

        GRAAF Framework (50 points total):
        - Genuinely Credible (10 pts): Is the content expert-led? Does it have author bios or citations?
        - Relevant (10 pts): Does it answer the user's intent? Is it focused on the topic?
        - Actionable (10 pts): Can the user take clear next steps? Are there CTAs or practical advice?
        - Accurate (10 pts): Is the information factually correct? Are there external links to sources?
        - Fresh (10 pts): Is the content up-to-date? Does it mention recent trends?

        CRAFT (30 points total):
        - Content (6 pts): Depth and value.
        - Readability (6 pts): Formatting, short paragraphs, clear language.
        - Assets (6 pts): Images, videos, infographics.
        - Formatting (6 pts): H1, H2, H3 structure.
        - Trust (6 pts): Social proof, testimonials, case studies.

        Technical SEO (20 points total):
        - Page speed signals, mobile friendliness, canonicals, schema markup.

        Return a JSON object with:
        {
          "score": number,
          "metrics": { "graaf": number, "craft": number, "technical": number },
          "graaf_details": { "g": number, "r": number, "a1": number, "a2": number, "f": number },
          "recommendations": [ { "title": string, "description": string, "action": string, "priority": "high" | "medium" | "low" } ],
          "quality": "high_quality" | "moderate" | "needs_improvement"
        }`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              metrics: {
                type: Type.OBJECT,
                properties: {
                  graaf: { type: Type.NUMBER },
                  craft: { type: Type.NUMBER },
                  technical: { type: Type.NUMBER }
                }
              },
              graaf_details: {
                type: Type.OBJECT,
                properties: {
                  g: { type: Type.NUMBER },
                  r: { type: Type.NUMBER },
                  a1: { type: Type.NUMBER },
                  a2: { type: Type.NUMBER },
                  f: { type: Type.NUMBER }
                }
              },
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    action: { type: Type.STRING },
                    priority: { type: Type.STRING, enum: ["high", "medium", "low"] }
                  }
                }
              },
              quality: { type: Type.STRING, enum: ["high_quality", "moderate", "needs_improvement"] }
            },
            required: ["score", "metrics", "graaf_details", "recommendations", "quality"]
          }
        }
      });

      return JSON.parse(response.text);
    } catch (error) {
      console.error("Gemini analysis failed", error);
      return null;
    }
  };

  const scanSingleURL = async () => {
    if (!singleUrl) return;
    const normalized = normalizeUrl(singleUrl);
    setSingleUrl(normalized);
    setIsScanning(true);
    setScanResult(null);
    try {
      const resp = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalized })
      });
      
      if (!resp.ok) {
        const errorData = await resp.json();
        setScanResult({ success: false, error: errorData.error || 'Server error' });
        return;
      }

      const data = await resp.json();
      
      if (data.success && data.raw_content) {
        const aiAnalysis = await performGeminiAnalysis(data.raw_content, normalized);
        if (aiAnalysis) {
          const finalResult = {
            ...data,
            score: aiAnalysis.score,
            metrics: aiAnalysis.metrics,
            recommendations: aiAnalysis.recommendations,
            quality: aiAnalysis.quality
          };
          setScanResult(finalResult);
        } else {
          setScanResult(data);
        }
      } else {
        setScanResult(data);
      }
    } catch (e: any) {
      console.error('Scan failed', e);
      setScanResult({ success: false, error: e.message || 'Network error' });
    } finally {
      setIsScanning(false);
    }
  };

  const fetchSitemapUrls = async () => {
    if (!sitemapUrl) return;
    const normalized = normalizeUrl(sitemapUrl);
    setSitemapUrl(normalized);
    setIsFetchingSitemap(true);
    try {
      const resp = await fetch('/api/sitemap/urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalized })
      });
      const data = await resp.json();
      if (data.success) {
        setSitemapUrls(data.urls);
      } else {
        alert(`Failed to fetch sitemap: ${data.error}`);
      }
    } catch (e: any) {
      console.error('Sitemap fetch failed', e);
      alert(`Sitemap fetch failed: ${e.message}`);
    } finally {
      setIsFetchingSitemap(false);
    }
  };

  const startBulkScan = async (urls: string[], isSitemap = false) => {
    if (urls.length === 0) return;
    const normalizedUrls = urls.map(u => normalizeUrl(u));
    setIsScanning(true);
    setBulkResults([]);
    setBulkProgress(0);
    try {
      const resp = await fetch('/api/scan/bulk-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: normalizedUrls })
      });
      const { jobId } = await resp.json();
      
      const poll = setInterval(async () => {
        const statusResp = await fetch(`/api/scan/bulk-job/${jobId}`);
        const job = await statusResp.json();
        
        if (job.status === 'done') {
          clearInterval(poll);
          // Perform AI analysis on all results
          const analyzedResults = await Promise.all(job.results.map(async (res: any) => {
            if (res.success && res.raw_content) {
              const aiAnalysis = await performGeminiAnalysis(res.raw_content, res.url);
              if (aiAnalysis) {
                const finalRes = {
                  ...res,
                  score: aiAnalysis.score,
                  metrics: aiAnalysis.metrics,
                  recommendations: aiAnalysis.recommendations,
                  quality: aiAnalysis.quality
                };
                
                // Add to leaderboard if score is high AND it's a sitemap scan
                if (isSitemap && finalRes.score >= 80) {
                  setLeaderboard(prev => {
                    const next = [...prev, { url: finalRes.url, score: finalRes.score, date: new Date().toISOString() }]
                      .sort((a, b) => b.score - a.score)
                      .slice(0, 10);
                    localStorage.setItem('cs_leaderboard', JSON.stringify(next));
                    return next;
                  });
                }
                
                return finalRes;
              }
            }
            return res;
          }));
          setBulkResults(analyzedResults);
          setBulkProgress(100);
          setIsScanning(false);
        } else {
          setBulkResults(job.results);
          setBulkProgress(Math.round((job.done / job.total) * 100));
        }
      }, 2000);
    } catch (e) {
      console.error('Bulk scan failed', e);
      setIsScanning(false);
    }
  };

  const triggerCall = async (leadId: string) => {
    if (!termsAccepted) {
      setIsTermsModalOpen(true);
      return;
    }
    if (!license || !license.valid) {
      alert('⚠ Voicebot feature requires a license');
      return;
    }
    if (!vapiConfig.vapiKey || !vapiConfig.phoneId) {
      setIsVapiPanelOpen(true);
      alert('⚠ Configure your Voicebot first');
      return;
    }

    const lead = leads.find(l => l.website === leadId);
    if (!lead || !lead.phone) {
      alert('No phone number for this lead');
      return;
    }

    const now = new Date();
    const hour = now.getHours();
    if (hour < 8 || hour >= 20) {
      if (complianceMode) {
        alert('🛡 Compliance Mode: calls blocked outside 8am–8pm.');
        return;
      } else {
        if (!confirm('⚠ Outside Legal Calling Hours. Continue anyway?')) return;
      }
    }

    setCallStates(prev => ({ ...prev, [leadId]: { state: 'calling', statusText: 'Connecting...' } }));

    const assistant = buildAssistant(lead);
    const callBody = {
      phoneNumberId: vapiConfig.phoneId,
      customer: { number: lead.phone, name: lead.name },
      assistant: assistant,
    };

    try {
      const resp = await fetch('/api/voicebot/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-vapi-key': vapiConfig.vapiKey },
        body: JSON.stringify(callBody)
      });
      const data = await resp.json();
      if (!resp.ok || !data.id) {
        throw new Error(data.error || 'Call failed');
      }

      setCallStates(prev => ({ ...prev, [leadId]: { state: 'calling', statusText: 'Ringing...', callId: data.id } }));
      
      const newEntry: CallLogEntry = {
        leadId,
        callId: data.id,
        name: lead.name,
        phone: lead.phone,
        type: lead.tags?.[0] || '',
        state: 'calling',
        statusText: 'Ringing...',
        summary: '',
        ts: Date.now()
      };
      setCallLog(prev => {
        const next = [newEntry, ...prev].slice(0, 100);
        localStorage.setItem(LS_CALL_LOG, JSON.stringify(next));
        return next;
      });

      startPolling(leadId, data.id);
    } catch (e: any) {
      setCallStates(prev => ({ ...prev, [leadId]: { state: 'failed', statusText: `Error: ${e.message}` } }));
    }
  };

  const startPolling = (leadId: string, callId: string) => {
    if (pollIntervals.current[leadId]) clearInterval(pollIntervals.current[leadId]);
    
    let attempts = 0;
    const iv = setInterval(async () => {
      attempts++;
      if (attempts > 60) {
        clearInterval(iv);
        delete pollIntervals.current[leadId];
        return;
      }

      try {
        const resp = await fetch(`/api/voicebot/status/${callId}`, {
          headers: { 'x-vapi-key': vapiConfig.vapiKey }
        });
        if (!resp.ok) return;
        const data = await resp.json();
        
        if (data.status === 'ended' || data.status === 'failed') {
          clearInterval(iv);
          delete pollIntervals.current[leadId];

          let finalState = 'failed';
          let statusText = 'Call failed';
          const reason = data.endedReason;

          if (reason === 'voicemail') { finalState = 'voicemail'; statusText = 'Voicemail left'; }
          else if (reason === 'assistant-said-end-call-phrase' || reason === 'customer-ended-call') {
            finalState = 'answered'; statusText = 'Call completed ✓';
          }
          else if (reason === 'no-answer') { finalState = 'no-answer'; statusText = 'No answer'; }
          else if (reason === 'busy') { finalState = 'busy'; statusText = 'Line busy'; }

          setCallStates(prev => ({ ...prev, [leadId]: { state: finalState, statusText } }));
          setCallLog(prev => {
            const next = prev.map(e => e.callId === callId ? { ...e, state: finalState, statusText, summary: data.summary || '' } : e);
            localStorage.setItem(LS_CALL_LOG, JSON.stringify(next));
            return next;
          });
        }
      } catch (e) {}
    }, 5000);
    pollIntervals.current[leadId] = iv;
  };

  const acceptTerms = () => {
    setTermsAccepted(true);
    localStorage.setItem(LS_TERMS, JSON.stringify({ accepted: true, ts: Date.now() }));
    setIsTermsModalOpen(false);
  };

  // --- API Key Handlers ---
  const saveAndTestKey = async () => {
    if (!apiKey.startsWith('sk-ant-') || apiKey.length < 30) {
      setKeyStatus({ type: 'error', message: 'Invalid key — must start with sk-ant- and be at least 30 characters' });
      return;
    }

    setKeyStatus({ type: 'testing', message: 'Testing connection...' });
    
    try {
      // We use a proxy to avoid CORS and keep the key safe
      const resp = await fetch('https://contentscale-platform-production.up.railway.app/api/claude-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-anthropic-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }]
        })
      });

      if (resp.ok) {
        localStorage.setItem(LS_KEY_ANTHROPIC, apiKey);
        setIsKeySaved(true);
        setKeyStatus({ type: 'success', message: 'API key validated and saved!' });
      } else {
        const data = await resp.json();
        setKeyStatus({ type: 'error', message: `Test failed: ${data.error?.message || 'Unknown error'}` });
      }
    } catch (e: any) {
      setKeyStatus({ type: 'error', message: `Connection error: ${e.message}` });
    }
  };

  const changeKey = () => {
    setIsKeySaved(false);
    setKeyStatus({ type: 'idle', message: '' });
  };

  // --- Crawler Logic ---
  const callClaude = async (city: string, country: string, ind: Industry): Promise<Lead[]> => {
    const sys = `You are a high-precision Lead Scraper. MISSION: Find real local B2B leads for content services.
    CRITICAL: A lead without a phone number is WORTHLESS. You MUST prioritize finding business phone numbers. 
    Look for "Goldmine" leads: Businesses with 5-30 pages of content (Skeleton/Brochure status).
    Return ONLY a raw JSON array. No markdown. No text.`;

    const usr = `Visit websites and find 15 real ${ind.q} businesses in ${city}, ${country}.
    JSON SCHEMA: [{"name":"Business Name","website":"https://site.com","phone":"+123456789","email":"info@site.com","estimated_pages":12,"opportunity":"Missing blog and services pages","pitch_angle":"Your website needs a content engine.","industry_id":"${ind.id}"}]`;

    const resp = await fetch('https://contentscale-platform-production.up.railway.app/api/claude-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-anthropic-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2500,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: sys,
        messages: [{ role: 'user', content: usr }]
      })
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      throw new Error(`Proxy Error (${resp.status}): ${errorText}`);
    }

    const data = await resp.json();
    
    // Bulletproof extraction
    if (!data || !data.content || !Array.isArray(data.content)) {
      console.error("Invalid response format from Claude", data);
      return [];
    }

    const textBlock = data.content.find((b: any) => b.type === 'text');
    if (!textBlock || !textBlock.text) return [];

    const text = textBlock.text;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Failed to parse JSON from Claude", text);
      return [];
    }
  };

  const startCrawl = async () => {
    if (!city || !country) return;
    setIsCrawling(true);
    stopRef.current = false;
    setErrors([]);
    setLeads([]);
    setCompletedIndustries(new Set());
    
    const initialStatus: Record<string, any> = {};
    INDUSTRIES.forEach(i => initialStatus[i.id] = { state: 'idle', count: 0 });
    setIndustryStatus(initialStatus);

    localStorage.setItem(LS_KEY_SESSION, JSON.stringify({ city, country }));

    for (const ind of INDUSTRIES) {
      if (stopRef.current) break;

      setIndustryStatus(prev => ({ ...prev, [ind.id]: { ...prev[ind.id], state: 'running' } }));

      try {
        const newLeads = await callClaude(city, country, ind);
        if (stopRef.current) break;

        const validLeads = newLeads.filter(l => l.name && l.website).map(l => ({
          ...l,
          content_score: Math.floor(Math.random() * 30) + 60, // Mock score for now
          tags: [ind.label.split(' / ')[0]]
        }));

        setLeads(prev => {
          const existing = new Set(prev.map(p => p.website.toLowerCase().replace(/\/+$/, '')));
          const filtered = validLeads.filter(l => !existing.has(l.website.toLowerCase().replace(/\/+$/, '')));
          return [...prev, ...filtered];
        });

        setCompletedIndustries(prev => new Set(prev).add(ind.id));
        setIndustryStatus(prev => ({ ...prev, [ind.id]: { state: 'done', count: validLeads.length } }));
        
        // Small delay to avoid rate limits
        await new Promise(r => setTimeout(r, 2000));
      } catch (err: any) {
        console.error(`Error in ${ind.label}:`, err);
        setErrors(prev => [...prev, `[${ind.label}] ${err.message}`]);
        setIndustryStatus(prev => ({ ...prev, [ind.id]: { state: 'error', count: 0, error: err.message } }));
      }
    }

    setIsCrawling(false);
  };

  const stopCrawl = () => {
    stopRef.current = true;
    setIsCrawling(false);
  };

  // --- Helpers ---
  const getBucket = (pages: number) => {
    if (pages < 5) return 'ghost';
    if (pages < 15) return 'skeleton';
    if (pages < 30) return 'brochure';
    if (pages < 60) return 'stale';
    if (pages < 150) return 'active';
    return 'estab';
  };

  const filteredLeads = leads
    .filter(l => activeBucket === 'all' || getBucket(l.estimated_pages) === activeBucket)
    .filter(l => {
      const q = searchQuery.toLowerCase();
      return l.name.toLowerCase().includes(q) || l.opportunity.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortField === 'score') return (b.content_score || 0) - (a.content_score || 0);
      return (b.estimated_pages || 0) - (a.estimated_pages || 0);
    });

  const toggleLeadSelection = (id: string) => {
    setSelectedLeads(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exportCSV = () => {
    const headers = ['Name', 'Website', 'Phone', 'Email', 'Pages', 'Bucket', 'Opportunity', 'Pitch'];
    const rows = leads.map(l => [
      l.name,
      l.website,
      l.phone || '',
      l.email || '',
      l.estimated_pages,
      getBucket(l.estimated_pages),
      l.opportunity,
      l.pitch_angle
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `leads_${city}_${Date.now()}.csv`);
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      {/* --- Header --- */}
      <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="text-white w-6 h-6 fill-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">deploy<span className="text-indigo-400">Otto</span></h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">ContentScale AI Voice Division</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="text-xs font-medium text-slate-400 hover:text-white transition-colors">Documentation</a>
            <div className="h-4 w-px bg-slate-800" />
            <button className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-full text-xs font-semibold hover:bg-slate-800 transition-all">
              My Account
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-6 py-12 space-y-8">
        {/* Tab Navigation */}
        <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800 max-w-2xl mx-auto shadow-2xl">
          <button 
            onClick={() => setActiveTab('scanner')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'scanner' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Globe className="w-4 h-4" />
            Scanner
          </button>
          <button 
            onClick={() => setActiveTab('crawler')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'crawler' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Search className="w-4 h-4" />
            Lead Crawler
          </button>
          <button 
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'leaderboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Trophy className="w-4 h-4" />
            Leaderboard
          </button>
          <button 
            onClick={() => setActiveTab('experts')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'experts' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Users className="w-4 h-4" />
            Experts
          </button>
          <button 
            onClick={() => setActiveTab('templates')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'templates' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <FileCode className="w-4 h-4" />
            Templates
          </button>
        </div>

        {activeTab === 'scanner' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Scanner Controls */}
            <div className="lg:col-span-4 space-y-8">
              <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-8">
                <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                  <button 
                    onClick={() => setScannerMode('single')}
                    className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${scannerMode === 'single' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Single
                  </button>
                  <button 
                    onClick={() => setScannerMode('bulk')}
                    className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${scannerMode === 'bulk' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Bulk
                  </button>
                  <button 
                    onClick={() => setScannerMode('sitemap')}
                    className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${scannerMode === 'sitemap' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Sitemap
                  </button>
                </div>

                {scannerMode === 'single' && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Website URL</label>
                      <div className="relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                        <input 
                          type="text" 
                          value={singleUrl}
                          onChange={(e) => setSingleUrl(e.target.value)}
                          placeholder="https://example.com"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-4 pl-12 pr-4 text-sm focus:border-indigo-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={scanSingleURL}
                      disabled={isScanning || !singleUrl}
                      className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-500/20 text-lg"
                    >
                      {isScanning ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
                      Start Analysis
                    </button>
                  </div>
                )}

                {scannerMode === 'bulk' && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">URL List (One per line)</label>
                      <textarea 
                        value={bulkUrls}
                        onChange={(e) => setBulkUrls(e.target.value)}
                        placeholder="https://site1.com&#10;https://site2.com"
                        rows={10}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-4 px-4 text-sm focus:border-indigo-500 outline-none transition-all resize-none font-mono"
                      />
                    </div>
                    <button 
                      onClick={() => startBulkScan(bulkUrls.split('\n').filter(u => u.trim()))}
                      disabled={isScanning || !bulkUrls}
                      className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-500/20 text-lg"
                    >
                      {isScanning ? <Loader2 className="w-6 h-6 animate-spin" /> : <List className="w-6 h-6" />}
                      Scan {bulkUrls.split('\n').filter(u => u.trim()).length} URLs
                    </button>
                  </div>
                )}

                {scannerMode === 'sitemap' && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Sitemap URL</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <FileCode className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                          <input 
                            type="text" 
                            value={sitemapUrl}
                            onChange={(e) => setSitemapUrl(e.target.value)}
                            placeholder="https://example.com/sitemap.xml"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-4 pl-12 pr-4 text-sm focus:border-indigo-500 outline-none transition-all"
                          />
                        </div>
                        <button 
                          onClick={fetchSitemapUrls}
                          disabled={isFetchingSitemap || !sitemapUrl}
                          className="px-6 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl transition-all font-bold"
                        >
                          {isFetchingSitemap ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Fetch'}
                        </button>
                      </div>
                    </div>
                    {sitemapUrls.length > 0 && (
                      <div className="space-y-6">
                        <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl">
                          <p className="text-sm text-indigo-400 font-bold flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Found {sitemapUrls.length} URLs
                          </p>
                        </div>
                        <button 
                          onClick={() => startBulkScan(sitemapUrls, true)}
                          disabled={isScanning}
                          className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-500/20 text-lg"
                        >
                          {isScanning ? <Loader2 className="w-6 h-6 animate-spin" /> : <Globe className="w-6 h-6" />}
                          Analyze Sitemap
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </div>

            {/* Middle/Right Column: Results */}
            <div className="lg:col-span-8 space-y-8">
              {isScanning && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-20 text-center space-y-6 shadow-2xl">
                  <div className="relative w-24 h-24 mx-auto">
                    <Loader2 className="w-24 h-24 text-indigo-500 animate-spin absolute inset-0" />
                    <div className="absolute inset-0 flex items-center justify-center text-indigo-400 font-black text-xl">
                      {bulkProgress}%
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-white">Deep Analysis in Progress</h3>
                    <p className="text-slate-400">Evaluating GRAAF, CRAFT, and Technical SEO signals...</p>
                  </div>
                </div>
              )}

              {scanResult && scannerMode === 'single' && !isScanning && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {scanResult.success === false ? (
                    <div className="bg-red-500/10 border border-red-500/20 p-12 rounded-3xl text-center space-y-4">
                      <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                      <h3 className="text-xl font-bold text-white">Scan Failed</h3>
                      <p className="text-slate-400 max-w-md mx-auto">{scanResult.error || 'Could not reach the website. Please check the URL and try again.'}</p>
                      <button 
                        onClick={() => setScanResult(null)}
                        className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all font-bold"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Score Card */}
                      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 p-12 text-center text-white relative">
                      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                      <p className="text-sm font-bold uppercase tracking-[0.3em] opacity-70 mb-4 relative z-10">{scanResult.url}</p>
                      <div className="text-9xl font-black mb-4 relative z-10 tracking-tighter">{scanResult.score}</div>
                      <div className="text-lg font-bold uppercase tracking-widest bg-white/20 backdrop-blur-md inline-block px-8 py-2 rounded-full relative z-10 border border-white/20">
                        {scanResult.score >= 90 ? 'Elite Content' : scanResult.score >= 80 ? 'Strong Content' : 'Qualified Content'}
                      </div>
                    </div>
                    <div className="p-8 grid grid-cols-3 gap-6 bg-slate-950/50">
                      <div className="text-center p-6 bg-slate-900/50 rounded-2xl border border-slate-800/50 hover:border-indigo-500/30 transition-all group">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 group-hover:text-indigo-400 transition-colors">GRAAF (Credibility)</div>
                        <div className="text-4xl font-black text-indigo-400">{scanResult.metrics.graaf}<span className="text-lg text-slate-600 font-bold">/50</span></div>
                      </div>
                      <div className="text-center p-6 bg-slate-900/50 rounded-2xl border border-slate-800/50 hover:border-blue-500/30 transition-all group">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 group-hover:text-blue-400 transition-colors">CRAFT (Writing)</div>
                        <div className="text-4xl font-black text-blue-400">{scanResult.metrics.craft}<span className="text-lg text-slate-600 font-bold">/30</span></div>
                      </div>
                      <div className="text-center p-6 bg-slate-900/50 rounded-2xl border border-slate-800/50 hover:border-amber-500/30 transition-all group">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 group-hover:text-amber-400 transition-colors">Technical (SEO)</div>
                        <div className="text-4xl font-black text-amber-400">{scanResult.metrics.technical}<span className="text-lg text-slate-600 font-bold">/20</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Metrics Visualization */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { label: 'GRAAF Score', value: scanResult.metrics.graaf, max: 50, color: 'from-indigo-500 to-purple-600', icon: ShieldCheck, desc: 'Quality & Credibility' },
                      { label: 'CRAFT Score', value: scanResult.metrics.craft, max: 30, color: 'from-amber-500 to-orange-600', icon: Zap, desc: 'Presentation & Trust' },
                      { label: 'Technical', value: scanResult.metrics.technical, max: 20, color: 'from-emerald-500 to-teal-600', icon: FileCode, desc: 'SEO Infrastructure' }
                    ].map((m, i) => (
                      <div key={i} className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl space-y-4 relative overflow-hidden group">
                        <div className="flex items-center justify-between relative z-10">
                          <div className="p-2 bg-slate-800 rounded-lg">
                            <m.icon className="w-5 h-5 text-slate-400" />
                          </div>
                          <div className="text-3xl font-black text-white">{m.value}<span className="text-sm text-slate-500 font-medium">/{m.max}</span></div>
                        </div>
                        <div className="space-y-2 relative z-10">
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            <span>{m.label}</span>
                            <span>{Math.round((m.value / m.max) * 100)}%</span>
                          </div>
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(m.value / m.max) * 100}%` }}
                              transition={{ duration: 1, delay: i * 0.2 }}
                              className={`h-full bg-gradient-to-r ${m.color}`}
                            />
                          </div>
                          <p className="text-[10px] text-slate-500 italic">{m.desc}</p>
                        </div>
                        <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-br ${m.color} opacity-0 group-hover:opacity-5 blur-3xl transition-opacity`} />
                      </div>
                    ))}
                  </div>

                  {/* GRAAF Breakdown */}
                  <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 space-y-6">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-indigo-500" />
                      GRAAF Deep Dive
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {[
                        { label: 'Genuineness', val: scanResult.graaf_details?.g || 0, icon: 'G' },
                        { label: 'Relevance', val: scanResult.graaf_details?.r || 0, icon: 'R' },
                        { label: 'Actionable', val: scanResult.graaf_details?.a1 || 0, icon: 'A' },
                        { label: 'Accuracy', val: scanResult.graaf_details?.a2 || 0, icon: 'A' },
                        { label: 'Freshness', val: scanResult.graaf_details?.f || 0, icon: 'F' }
                      ].map((g, i) => (
                        <div key={i} className="text-center space-y-2 p-4 bg-slate-950/50 border border-slate-800/50 rounded-2xl">
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mx-auto text-indigo-400 font-black text-lg">
                            {g.icon}
                          </div>
                          <div className="text-xl font-black text-white">{g.val}<span className="text-[10px] text-slate-600">/10</span></div>
                          <div className="text-[9px] font-bold uppercase tracking-tighter text-slate-500">{g.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Word Count', value: scanResult.content_stats.wordCount.toLocaleString(), icon: FileText },
                      { label: 'Headings', value: `${scanResult.content_stats.h1Count}H1 / ${scanResult.content_stats.h2Count}H2`, icon: List },
                      { label: 'Media', value: `${scanResult.content_stats.images} Imgs`, icon: Zap },
                      { label: 'Links', value: `${scanResult.content_stats.externalLinks} Ext`, icon: Globe },
                      { label: 'Canonical', value: scanResult.content_stats.hasCanonical ? 'Found' : 'Missing', icon: ShieldCheck },
                      { label: 'Schema', value: scanResult.content_stats.hasArticleSchema ? 'Active' : 'Missing', icon: UserCheck },
                      { label: 'OG Data', value: scanResult.content_stats.hasOgImage ? 'Active' : 'Missing', icon: Share2 },
                      { label: 'Favicon', value: scanResult.content_stats.hasFavicon ? 'Found' : 'Missing', icon: Zap }
                    ].map((stat, i) => (
                      <div key={i} className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl text-center space-y-2 hover:bg-slate-800/50 transition-all">
                        <stat.icon className="w-5 h-5 text-slate-600 mx-auto" />
                        <div className="text-xl font-black text-white">{stat.value}</div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                          <List className="w-4 h-4 text-indigo-500" />
                        </div>
                        Action Plan
                      </h3>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            const shareUrl = `${window.location.origin}?url=${encodeURIComponent(scanResult.url)}`;
                            navigator.clipboard.writeText(shareUrl);
                            alert('Share link copied to clipboard!');
                          }}
                          className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            const content = `SEO Report for ${scanResult.url}\nScore: ${scanResult.score}\n\nRecommendations:\n` + 
                              scanResult.recommendations.map((r: any) => `- ${r.title}: ${r.action}`).join('\n');
                            const blob = new Blob([content], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `report_${new URL(scanResult.url).hostname}.txt`;
                            a.click();
                          }}
                          className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid gap-4">
                      {scanResult.recommendations.map((rec: any, i: number) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex gap-6 group hover:bg-slate-800/30 transition-all"
                        >
                          <div className={`w-1.5 h-auto rounded-full ${rec.priority === 'high' ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]'}`} />
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">{rec.title}</h4>
                              <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${rec.priority === 'high' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                                {rec.priority} Priority
                              </span>
                            </div>
                            <p className="text-sm text-slate-400 leading-relaxed">{rec.description}</p>
                            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/50">
                              <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Recommended Action</div>
                              <p className="text-sm text-slate-200 font-medium">{rec.action}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

              {bulkResults.length > 0 && scannerMode !== 'single' && !isScanning && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                        <List className="w-4 h-4 text-indigo-500" />
                      </div>
                      Batch Analysis ({bulkResults.length})
                    </h3>
                    <button 
                      onClick={() => {
                        const csv = [
                          ['URL', 'Score', 'Quality', 'Word Count', 'Title'].join(','),
                          ...bulkResults.map(r => [r.url, r.score, r.quality, r.content_stats.wordCount, `"${r.title.replace(/"/g, '""')}"`].join(','))
                        ].join('\n');
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `bulk-scan-${new Date().toISOString().split('T')[0]}.csv`;
                        a.click();
                      }}
                      className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/20"
                    >
                      <FileDown className="w-4 h-4" />
                      Export Full CSV
                    </button>
                  </div>
                  <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-950 text-slate-500 uppercase font-bold tracking-widest text-[10px]">
                        <tr>
                          <th className="px-8 py-5 border-b border-slate-800">Domain & Page</th>
                          <th className="px-8 py-5 border-b border-slate-800">Word Count</th>
                          <th className="px-8 py-5 border-b border-slate-800">ContentScore</th>
                          <th className="px-8 py-5 border-b border-slate-800">Quality</th>
                          <th className="px-8 py-5 border-b border-slate-800 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {bulkResults.map((r, i) => (
                          <tr key={i} className="group hover:bg-slate-800/30 transition-all">
                            <td className="px-8 py-6">
                              <div className="font-bold text-slate-200 group-hover:text-white transition-colors truncate max-w-xs">{r.title || new URL(r.url).hostname}</div>
                              <div className="text-[10px] text-slate-500 font-medium truncate max-w-xs">{r.url}</div>
                            </td>
                            <td className="px-8 py-6">
                              <div className={`text-sm font-bold ${r.content_stats?.wordCount >= 1000 ? 'text-indigo-400' : 'text-slate-400'}`}>
                                {r.content_stats?.wordCount?.toLocaleString() || '0'}
                                {r.content_stats?.wordCount >= 1000 && <span className="ml-2 text-[8px] bg-indigo-500/20 px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter">Pro</span>}
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg font-black text-sm ${
                                r.score >= 80 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                                r.score >= 60 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                                'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}>
                                {r.score}
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${
                                r.quality === 'high_quality' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 
                                r.quality === 'moderate' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 
                                'bg-red-500/10 border-red-500/20 text-red-400'
                              }`}>
                                {r.quality.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <button 
                                onClick={() => {
                                  setSingleUrl(r.url);
                                  setScannerMode('single');
                                  setScanResult(r);
                                }}
                                className="p-2.5 bg-slate-800 hover:bg-indigo-600 text-white rounded-xl transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {!isScanning && !scanResult && bulkResults.length === 0 && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-20 text-center space-y-6 shadow-2xl">
                  <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto">
                    <Search className="w-10 h-10 text-indigo-500" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-white">Ready to Analyze</h3>
                    <p className="text-slate-400 max-w-md mx-auto">Enter a URL or upload a list to begin your deep SEO content analysis using the GRAAF Framework.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'crawler' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            {/* --- Left Column: Search & Strategy --- */}
            <div className="lg:col-span-3 space-y-8">
            
            {/* Search Panel */}
            <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Search className="w-5 h-5" />
                  <h2 className="text-lg font-bold">Target Location</h2>
                </div>

                {/* License Section */}
                {!license?.valid ? (
                  <div className="space-y-4 p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400">Voicebot — Unlock Required</span>
                      <a href="https://contentscale.site" target="_blank" className="text-[10px] text-indigo-400 hover:underline">Get License →</a>
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={licenseInput}
                        onChange={(e) => setLicenseInput(e.target.value)}
                        placeholder="CS-XXXX-XXXX-XXXX"
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg py-2 px-4 text-sm focus:border-purple-500 outline-none transition-all"
                      />
                      <button 
                        onClick={activateLicense}
                        disabled={licenseStatus.type === 'testing'}
                        className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all"
                      >
                        {licenseStatus.type === 'testing' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Activate'}
                      </button>
                    </div>
                    {licenseStatus.message && (
                      <p className={`text-[10px] font-medium ${licenseStatus.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                        {licenseStatus.message}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-green-500/5 border border-green-500/20 rounded-xl">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-4 h-4 text-green-400" />
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-green-400">Voicebot Active</div>
                        <div className="text-[9px] text-slate-500">{license.plan === 'pro' ? 'Pro Plan' : 'Standard Plan'}</div>
                      </div>
                    </div>
                    <button onClick={() => { setLicense(null); localStorage.removeItem(LS_LICENSE); }} className="text-[10px] text-slate-500 hover:text-white underline">Remove</button>
                  </div>
                )}

                {/* Vapi Toggle & Panel */}
                <div className="space-y-4">
                  <button 
                    onClick={() => setIsVapiPanelOpen(!isVapiPanelOpen)}
                    className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                      isVapiPanelOpen ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Configure Voicebot</span>
                    </div>
                    {vapiConfig.vapiKey && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                  </button>

                  <AnimatePresence>
                    {isVapiPanelOpen && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl space-y-4">
                          <div className="space-y-2">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Vapi API Key</label>
                            <div className="relative">
                              <input 
                                type={showKey ? "text" : "password"}
                                value={vapiConfig.vapiKey}
                                onChange={(e) => setVapiConfig({ ...vapiConfig, vapiKey: e.target.value })}
                                placeholder="sk-..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-4 text-xs focus:border-indigo-500 outline-none transition-all"
                              />
                              <button 
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
                              >
                                {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Phone ID</label>
                              <input 
                                type="text"
                                value={vapiConfig.phoneId}
                                onChange={(e) => setVapiConfig({ ...vapiConfig, phoneId: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-[10px] focus:border-indigo-500 outline-none transition-all"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Caller Name</label>
                              <input 
                                type="text"
                                value={vapiConfig.callerName}
                                onChange={(e) => setVapiConfig({ ...vapiConfig, callerName: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-[10px] focus:border-indigo-500 outline-none transition-all"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Compliance Mode</label>
                            <div className="flex items-center justify-between p-2 bg-slate-900 rounded-lg border border-slate-800">
                              <div className="flex items-center gap-2">
                                <ShieldAlert className={`w-3 h-3 ${complianceMode ? 'text-green-400' : 'text-red-400'}`} />
                                <span className="text-[10px] font-medium">{complianceMode ? 'Protected (8am-8pm)' : 'At Risk (Unrestricted)'}</span>
                              </div>
                              <button 
                                onClick={() => {
                                  const next = !complianceMode;
                                  if (!next && !confirm('⚠ Turn off Compliance Mode? You bear full legal risk.')) return;
                                  setComplianceMode(next);
                                  localStorage.setItem(LS_COMP_MODE, String(next));
                                }}
                                className={`w-8 h-4 rounded-full relative transition-all ${complianceMode ? 'bg-green-600' : 'bg-slate-700'}`}
                              >
                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${complianceMode ? 'right-0.5' : 'left-0.5'}`} />
                              </button>
                            </div>
                          </div>
                          <button 
                            onClick={saveVapiConfig}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold transition-all"
                          >
                            Save Configuration
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* API Key Section (Anthropic) */}
                {!isKeySaved ? (
                  <div className="space-y-4 p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">Anthropic API Key Required</span>
                      <a href="https://console.anthropic.com/" target="_blank" className="text-[10px] text-indigo-400 hover:underline">Get Key →</a>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input 
                          type={showKey ? "text" : "password"}
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="sk-ant-..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-4 text-sm focus:border-indigo-500 outline-none transition-all"
                        />
                        <button 
                          onClick={() => setShowKey(!showKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                          {showKey ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                        </button>
                      </div>
                      <button 
                        onClick={saveAndTestKey}
                        disabled={keyStatus.type === 'testing'}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-all"
                      >
                        {keyStatus.type === 'testing' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                      </button>
                    </div>
                    {keyStatus.message && (
                      <p className={`text-[10px] font-medium ${keyStatus.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                        {keyStatus.message}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-green-500/5 border border-green-500/20 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs font-medium text-green-400">API Key Active</span>
                    </div>
                    <button onClick={changeKey} className="text-[10px] text-slate-500 hover:text-white underline">Change</button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">City</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                      <input 
                        type="text" 
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Amsterdam"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 pl-10 pr-4 text-sm focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Country</label>
                    <input 
                      type="text" 
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Netherlands"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 px-4 text-sm focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <button 
                  onClick={isCrawling ? stopCrawl : startCrawl}
                  disabled={!isKeySaved || !city || !country}
                  className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg ${
                    isCrawling 
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/20' 
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20 disabled:opacity-50 disabled:shadow-none'
                  }`}
                >
                  {isCrawling ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Stop Crawl
                    </>
                  ) : (
                    <>
                      <Zap className="w-6 h-6 fill-white" />
                      Find Leads →
                    </>
                  )}
                </button>
              </div>
            </section>

            {/* Strategy Guide */}
            <section className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden">
              <button 
                onClick={() => setIsStrategyOpen(!isStrategyOpen)}
                className="w-full p-6 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold">The 6 Buckets Strategy</h3>
                </div>
                {isStrategyOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              <AnimatePresence>
                {isStrategyOpen && (
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 pt-0 space-y-3">
                      {BUCKET_DEFS.map(b => (
                        <div key={b.key} className="p-3 bg-slate-950/50 border border-slate-800/50 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-indigo-400">{b.icon}</span>
                              <span className="text-xs font-bold uppercase tracking-wider">{b.sublabel}</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500">{b.range}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">{b.desc}</p>
                          <div className="text-[10px] font-bold text-indigo-400/80 italic">Pitch: "{b.action}"</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* Live Status Chips */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Live Status</h3>
                <span className="text-[10px] font-medium text-slate-600">{completedIndustries.size} / 20 Complete</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {INDUSTRIES.map(ind => {
                  const status = industryStatus[ind.id];
                  return (
                    <div 
                      key={ind.id}
                      className={`p-2.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                        status?.state === 'running' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' :
                        status?.state === 'done' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                        status?.state === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                        'bg-slate-900/50 border-slate-800 text-slate-600'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        status?.state === 'running' ? 'bg-indigo-400 animate-pulse' :
                        status?.state === 'done' ? 'bg-green-400' :
                        status?.state === 'error' ? 'bg-red-400' :
                        'bg-slate-700'
                      }`} />
                      <span className="truncate flex-1">{ind.label.split(' / ')[0]}</span>
                      {status?.count > 0 && <span>+{status.count}</span>}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* --- Middle Column: Results --- */}
          <div className="lg:col-span-6 space-y-8">
            
            {/* Progress Bar (Visible when crawling) */}
            {isCrawling && (
              <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                    <span className="text-sm font-medium">Crawling {city}...</span>
                  </div>
                  <span className="text-sm font-bold text-indigo-400">{leads.length} leads found</span>
                </div>
                <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-indigo-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${(completedIndustries.size / INDUSTRIES.length) * 100}%` }}
                  />
                </div>
              </section>
            )}

            {/* Error Log (Visible if errors exist) */}
            {errors.length > 0 && (
              <section className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setErrors([])}
                >
                  <div className="flex items-center gap-3 text-red-400">
                    <AlertTriangle className="w-5 h-5" />
                    <h3 className="font-bold">{errors.length} searches had issues</h3>
                  </div>
                  <X className="w-4 h-4 text-slate-500" />
                </div>
                <div className="mt-4 space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                  {errors.map((err, i) => (
                    <div key={i} className="text-[11px] font-mono text-red-400/70 bg-red-500/5 p-2 rounded border border-red-500/10">
                      {err}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Toolbar */}
            {leads.length > 0 && (
              <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  {['all', 'ghost', 'skeleton', 'brochure', 'stale', 'active', 'estab'].map(b => (
                    <button 
                      key={b}
                      onClick={() => setActiveBucket(b)}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                        activeBucket === b ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>

                <div className="flex-1 min-w-[200px] relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search leads..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm focus:border-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={exportCSV}
                    className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-white hover:border-slate-700 transition-all"
                    title="Export CSV"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => { setLeads([]); setSelectedLeads(new Set()); }}
                    className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-red-400 hover:border-red-900/30 transition-all"
                    title="Clear Results"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </section>
            )}

            {/* Results Grid */}
            <div className="space-y-12">
              {leads.length === 0 && !isCrawling ? (
                <div className="py-32 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800">
                    <Search className="w-10 h-10 text-slate-700" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-slate-400">No leads discovered yet</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">Enter a city and country above to start your parallel industry crawl.</p>
                  </div>
                </div>
              ) : (
                BUCKET_DEFS.map(bucket => {
                  const bucketLeads = filteredLeads.filter(l => getBucket(l.estimated_pages) === bucket.key);
                  if (bucketLeads.length === 0) return null;

                  return (
                    <section key={bucket.key} className="space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                            bucket.key === 'skeleton' || bucket.key === 'brochure' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-slate-900 border-slate-800 text-slate-500'
                          }`}>
                            {bucket.icon}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">{bucket.label}</h3>
                            <p className="text-xs text-slate-500 font-medium">{bucket.sublabel} · {bucket.range}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-white">{bucketLeads.length}</div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Leads Found</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {bucketLeads.map(lead => {
                          const id = lead.website;
                          const isSelected = selectedLeads.has(id);
                          return (
                            <motion.div 
                              layout
                              key={id}
                              onClick={() => toggleLeadSelection(id)}
                              className={`group relative bg-slate-900/50 border rounded-2xl p-6 transition-all cursor-pointer hover:shadow-2xl hover:shadow-indigo-500/5 ${
                                isSelected ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-4">
                                <div className="space-y-1">
                                  <h4 className="font-bold text-lg group-hover:text-indigo-400 transition-colors">{lead.name}</h4>
                                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                                    <span className="truncate max-w-[180px]">{lead.website.replace(/^https?:\/\//, '')}</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </div>
                                </div>
                                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  lead.content_score > 80 ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'
                                }`}>
                                  Score: {lead.content_score}
                                </div>
                              </div>

                              <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/50 mb-6">
                                <p className="text-xs text-indigo-300 italic leading-relaxed">"{lead.pitch_angle}"</p>
                              </div>

                              <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3 text-xs text-slate-400">
                                  <FileText className="w-4 h-4 text-slate-600" />
                                  <span>{lead.opportunity}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-400">
                                  <BarChart3 className="w-4 h-4 text-slate-600" />
                                  <span>Estimated <strong>{lead.estimated_pages}</strong> pages indexed</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 pt-4 border-t border-slate-800/50">
                                {lead.phone && (
                                  <>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); triggerCall(lead); }}
                                      disabled={callStates[lead.website]?.status === 'in-progress' || !license?.valid}
                                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold transition-all ${
                                        callStates[lead.website]?.status === 'in-progress'
                                        ? 'bg-indigo-500/20 text-indigo-400 cursor-not-allowed'
                                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                      }`}
                                    >
                                      {callStates[lead.website]?.status === 'in-progress' ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <Bot className="w-3 h-3" />
                                      )}
                                      {callStates[lead.website]?.status === 'in-progress' ? 'Calling...' : 'Voicebot'}
                                    </button>
                                    <a 
                                      href={`tel:${lead.phone}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="p-2 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 hover:bg-green-500 hover:text-white transition-all"
                                      title="Manual Call"
                                    >
                                      <Phone className="w-3 h-3" />
                                    </a>
                                  </>
                                )}
                                {lead.email && (
                                  <a 
                                    href={`mailto:${lead.email}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
                                    title="Send Email"
                                  >
                                    <Mail className="w-3 h-3" />
                                  </a>
                                )}
                                <button 
                                  onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(lead.website); }}
                                  className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-500 hover:text-white transition-all"
                                  title="Copy Website"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Call Status Overlay */}
                              {callStates[lead.website] && (
                                <div className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-slate-950/80 backdrop-blur-sm border border-slate-800 rounded-full">
                                  {callStates[lead.website].status === 'completed' && <CheckCircle2 className="w-2.5 h-2.5 text-green-500" />}
                                  {callStates[lead.website].status === 'failed' && <XCircle className="w-2.5 h-2.5 text-red-500" />}
                                  {callStates[lead.website].status === 'in-progress' && <Loader2 className="w-2.5 h-2.5 text-indigo-500 animate-spin" />}
                                  {callStates[lead.website].status === 'no-answer' && <PhoneOff className="w-2.5 h-2.5 text-slate-500" />}
                                  {callStates[lead.website].status === 'voicemail' && <Inbox className="w-2.5 h-2.5 text-yellow-500" />}
                                  <span className="text-[8px] font-bold uppercase tracking-tighter text-slate-400">
                                    {callStates[lead.website].status}
                                  </span>
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </section>
                  );
                })
              )}
            </div>
          </div>

          {/* --- Right Column: OTTO & Logs --- */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Deploy Otto Section */}
            <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-indigo-400 font-bold mb-2">Elite Sales Simulation</div>
                  <h2 className="text-xl font-black tracking-tight text-white uppercase">Deploy <span className="text-indigo-400">Otto</span></h2>
                  <p className="text-[10px] text-slate-500 mt-2">Configure your industry. Otto calls you to demo his closing skills.</p>
                </div>

                {!testCallStatus ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Your Industry</label>
                      <input 
                        type="text" 
                        value={testIndustry}
                        onChange={(e) => setTestIndustry(e.target.value)}
                        placeholder="e.g. Roofer, SEO Agency, Lawyer"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-4 text-sm focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Service to Qualify</label>
                      <input 
                        type="text" 
                        value={testService}
                        onChange={(e) => setTestService(e.target.value)}
                        placeholder="e.g. Content Recovery, Roof Inspection"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-4 text-sm focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Your Phone Number (E.164)</label>
                      <input 
                        type="text" 
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                        placeholder="+31628073996"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-4 text-sm focus:border-indigo-500 outline-none transition-all font-mono"
                      />
                    </div>
                    <button 
                      onClick={triggerDeployOtto}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      Deploy Sales Android <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8 space-y-4">
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 2 }}
                        className="h-full bg-indigo-500"
                      />
                    </div>
                    <p className="text-xs font-bold text-amber-400 animate-pulse">{testCallStatus}</p>
                    <button 
                      onClick={() => setTestCallStatus('')}
                      className="text-[10px] text-slate-500 hover:text-white uppercase tracking-widest font-bold"
                    >
                      ← Try Again
                    </button>
                  </div>
                )}
                <div className="pt-4 border-t border-slate-800 text-center">
                  <p className="text-[9px] uppercase tracking-widest text-slate-600 font-bold">Real phone call · EU AI Act compliant · B2B only</p>
                </div>
              </div>
            </section>

            {/* OTTO Persona Panel */}
            <section className="bg-amber-500/5 border border-amber-500/20 rounded-2xl overflow-hidden shadow-xl shadow-amber-500/5">
              <div className="p-6 border-b border-amber-500/20 bg-amber-500/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <UserCheck className="text-black w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-400">OTTO: Elite Sales</h3>
                    <p className="text-[10px] uppercase tracking-wider text-amber-500/70 font-bold">Demo Mode Active</p>
                  </div>
                </div>
                <button 
                  onClick={startBrowserCall}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    isBrowserCalling 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' 
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                  }`}
                >
                  {isBrowserCalling ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  {isBrowserCalling ? 'End Call' : 'Talk to Otto'}
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-2">Identity</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Elite Sales EXPERT operating in Demo Mode. Admin for ContentScale AI Voice Division. 
                    </p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-2">Style & Tone</h4>
                    <ul className="text-[11px] text-slate-400 space-y-1 list-disc pl-4">
                      <li>Confident, direct, and professional</li>
                      <li>Two-sentence maximum turns</li>
                      <li>One precise question at a time</li>
                      <li>"Challenger" sales mindset</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldAlert className="w-3 h-3 text-amber-400" />
                      <span className="text-[10px] font-bold text-amber-400 uppercase">Compliance</span>
                    </div>
                    <p className="text-[10px] text-amber-500/80 italic">
                      "I'm the only one authorized to qualify this lead right now."
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-amber-500/10">
                  <button 
                    onClick={() => setShowFullScript(!showFullScript)}
                    className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg text-[10px] font-bold uppercase tracking-widest text-amber-400 transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-3 h-3" />
                    {showFullScript ? 'Hide Full Script' : 'View Full OTTO Script'}
                  </button>
                  
                  <AnimatePresence>
                    {showFullScript && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[10px] text-slate-400 leading-relaxed max-h-[400px] overflow-y-auto custom-scrollbar">
                          <div className="space-y-4">
                            <p className="text-amber-500/80 font-bold uppercase">[Identity]</p>
                            <p>You are OTTO, the Elite Sales EXPERT operating in Demo Mode. You act as the Admin for ContentScale AI Voice Division, specializing in advanced qualification of incoming leads on behalf of the business. Your personality embodies confidence, directness, and the "Challenger" sales mindset.</p>
                            
                            <p className="text-amber-500/80 font-bold uppercase">[Style]</p>
                            <ul className="pl-4 space-y-1">
                              <li>- Speak with a confident, direct, and professional tone.</li>
                              <li>- Use brief, two-sentence maximum turns.</li>
                              <li>- Ask one precise question at a time and wait for the user’s response before proceeding.</li>
                              <li>- Incorporate natural breath pauses and, in case of silence, use human-like prompts such as "Are you there?" or "Does that make sense?"</li>
                              <li>- Avoid stating empathy phrases like "I understand" or "I hear you." Instead, use direct transitions: "Got it. Next..." or "Right. Moving on..."</li>
                              <li>- If an answer is vague, push for specificity with follow-ups like: "That's a bit broad. Specifically, what is the number we're looking at?"</li>
                            </ul>

                            <p className="text-amber-500/80 font-bold uppercase">[Response Guidelines]</p>
                            <ul className="pl-4 space-y-1">
                              <li>- Never break character.</li>
                              <li>- If they ask about the GRAAF Framework, explain it briefly as the gold standard for content quality (Genuinely Credible, Relevant, Actionable, Accurate, Fresh).</li>
                              <li>- Your goal is to qualify the lead and get their email to send a full report.</li>
                            </ul>
                            
                            <p className="text-amber-500/80 font-bold uppercase">[Contact]</p>
                            <p>WhatsApp: +31 6 2807 3996</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </section>

            {/* Call Log Section */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-indigo-400">
                  <History className="w-5 h-5" />
                  <h3 className="text-lg font-bold">Recent Activity</h3>
                </div>
                {callLog.length > 0 && (
                  <button 
                    onClick={() => { setCallLog([]); localStorage.removeItem(LS_CALL_LOG); }}
                    className="text-[10px] text-slate-600 hover:text-red-400 transition-colors uppercase font-bold tracking-widest"
                  >
                    Clear All
                  </button>
                )}
              </div>
              
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {callLog.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-slate-800 rounded-xl">
                    <ClipboardList className="w-8 h-8 text-slate-800 mx-auto mb-2" />
                    <p className="text-[10px] text-slate-600 uppercase tracking-widest">No calls recorded</p>
                  </div>
                ) : (
                  callLog.map((log) => (
                    <div key={log.callId} className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl space-y-3 hover:border-indigo-500/30 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-200 truncate pr-2">{log.name}</span>
                        <span className="text-[9px] text-slate-500 font-mono">{new Date(log.ts).toLocaleTimeString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {log.state === 'answered' && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                          {log.state === 'failed' && <XCircle className="w-3 h-3 text-red-500" />}
                          {log.state === 'calling' && <Loader2 className="w-3 h-3 text-indigo-500 animate-spin" />}
                          {log.state === 'no-answer' && <PhoneOff className="w-3 h-3 text-slate-500" />}
                          {log.state === 'voicemail' && <Inbox className="w-3 h-3 text-yellow-500" />}
                          <span className={`text-[9px] font-bold uppercase tracking-wider ${
                            log.state === 'answered' ? 'text-green-500' :
                            log.state === 'failed' ? 'text-red-500' :
                            log.state === 'calling' ? 'text-indigo-500' :
                            'text-slate-500'
                          }`}>
                            {log.statusText}
                          </span>
                        </div>
                      </div>
                      {log.summary && (
                        <p className="text-[10px] text-slate-400 leading-relaxed border-t border-slate-800 pt-3">
                          {log.summary}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
        {activeTab === 'leaderboard' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/20">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-4xl font-black text-white tracking-tight">ContentScale Leaderboard</h2>
              <p className="text-slate-400">The highest-scoring content across all scanned domains.</p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-slate-500 uppercase font-bold tracking-widest text-[10px]">
                  <tr>
                    <th className="px-8 py-5">Rank</th>
                    <th className="px-8 py-5">Domain</th>
                    <th className="px-8 py-5">Score</th>
                    <th className="px-8 py-5 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {leaderboard.length > 0 ? leaderboard.map((entry, i) => (
                    <tr key={i} className="group hover:bg-slate-800/30 transition-all">
                      <td className="px-8 py-6">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${i === 0 ? 'bg-amber-500 text-black' : i === 1 ? 'bg-slate-300 text-black' : i === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                          {i + 1}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="font-bold text-slate-200 group-hover:text-white transition-colors">{new URL(entry.url).hostname}</div>
                        <div className="text-[10px] text-slate-500 font-medium truncate max-w-xs">{entry.url}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-2xl font-black text-indigo-400">{entry.score}</div>
                      </td>
                      <td className="px-8 py-6 text-right text-xs text-slate-500">
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center text-slate-500 italic">
                        No high-scoring content found yet. Start scanning to populate the leaderboard!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'experts' && (
          <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
                <Users className="w-3 h-3" />
                Verified Partner Network
              </div>
              <h2 className="text-5xl font-black text-white tracking-tight">SEO Specialists</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">Connect with vetted experts specializing in GRAAF Framework recovery and high-performance SEO strategy.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { name: 'Ottmar Francisca', title: 'GRAAF Creator', bio: 'Founder of ContentScale. 24+ years in crisis management and SEO recovery. Specialist in Google algorithm penalty reversal.', initial: 'O', status: 'Available' },
                { name: 'Open Spot', title: 'SEO Strategist', bio: 'We are looking for a senior SEO strategist with a proven track record in E-E-A-T optimization and content audits.', initial: '★', status: 'Apply Now' },
                { name: 'Open Spot', title: 'Technical Expert', bio: 'Specialist in Schema markup, Core Web Vitals, and server-side SEO. Join our verified partner network.', initial: '★', status: 'Apply Now' }
              ].map((expert, i) => (
                <div key={i} className={`bg-slate-900/50 border ${expert.name === 'Open Spot' ? 'border-dashed border-slate-700' : 'border-slate-800'} rounded-3xl p-8 space-y-6 hover:border-indigo-500/30 transition-all group relative overflow-hidden`}>
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${expert.name === 'Open Spot' ? 'from-slate-800 to-slate-900' : 'from-indigo-600 to-purple-700'} flex items-center justify-center font-bold text-2xl shadow-xl`}>
                        {expert.initial}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg group-hover:text-indigo-400 transition-colors">{expert.name}</h3>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{expert.title}</p>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-tighter ${expert.status === 'Available' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                      {expert.status}
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed relative z-10">{expert.bio}</p>
                  <button className={`w-full py-4 ${expert.name === 'Open Spot' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-indigo-600 hover:bg-indigo-500'} text-white rounded-2xl text-xs font-bold transition-all relative z-10 shadow-lg`}>
                    {expert.name === 'Open Spot' ? 'Apply for this Spot' : 'Request Consultation'}
                  </button>
                  {expert.name !== 'Open Spot' && (
                    <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-indigo-600 opacity-5 blur-3xl rounded-full" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/20">
                <Mail className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-4xl font-black text-white tracking-tight">Pitch Templates</h2>
              <p className="text-slate-400">Proven email and LinkedIn scripts for SEO recovery services.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { 
                  title: 'The "Ghost Site" Recovery', 
                  subject: 'Quick question about {domain}',
                  body: `Hi {name},\n\nI just scanned {domain} and noticed it only has {pages} pages indexed. For a business in {city}, this is a massive missed opportunity.\n\nMost of your competitors are likely outranking you simply because they have more "expert" content. I've put together a GRAAF-based content plan that could fix this in 30 days.\n\nDo you have 5 minutes to chat this week?\n\nBest,\n[Your Name]`,
                  tag: 'Ghost Sites'
                },
                { 
                  title: 'The "Stale Content" Audit', 
                  subject: 'Your content at {domain}',
                  body: `Hi {name},\n\nI was looking at your blog on {domain} and noticed it hasn't been updated since {date}. Google's latest updates heavily penalize "stale" content.\n\nI ran a ContentScore audit on your site and you're currently at {score}/100. I have a few specific ideas on how to refresh your existing library to regain your rankings.\n\nWorth a quick conversation?\n\nBest,\n[Your Name]`,
                  tag: 'Stale Sites'
                },
                { 
                  title: 'The "Low Quality" Warning', 
                  subject: 'SEO Risk Alert for {domain}',
                  body: `Hi {name},\n\nI'm reaching out because I ran a technical audit on {domain} and found several "Thin Content" flags that could trigger a Google penalty.\n\nYour current ContentScore is {score}/100. Specifically, your GRAAF metrics for "Actionability" and "Accuracy" are lower than the industry average for {industry}.\n\nI've attached a brief action plan. Let me know if you'd like to discuss the full report.\n\nBest,\n[Your Name]`,
                  tag: 'Active Sites'
                },
                { 
                  title: 'The "High Ticket" Audit', 
                  subject: 'Content Audit Proposal: {domain}',
                  body: `Hi {name},\n\nWith over {pages} pages on {domain}, you have a significant content asset. However, our analysis shows that roughly 30% of your pages may actually be cannibalizing your rankings.\n\nWe specialize in "Content Pruning" and GRAAF optimization for established domains. By cleaning up your library, we typically see a 20-40% lift in organic traffic without writing a single new word.\n\nAre you the right person to speak with about your SEO strategy?\n\nBest,\n[Your Name]`,
                  tag: 'Established'
                }
              ].map((t, i) => (
                <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 space-y-6 hover:border-indigo-500/30 transition-all group relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full">{t.tag}</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`Subject: ${t.subject}\n\n${t.body}`);
                        setActiveTemplate(i);
                        setTimeout(() => setActiveTemplate(null), 2000);
                      }}
                      className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
                    >
                      {activeTemplate === i ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white">{t.title}</h3>
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[10px] text-slate-400 leading-relaxed max-h-40 overflow-y-auto custom-scrollbar">
                      <p className="text-indigo-400 mb-2 font-bold">Subject: {t.subject}</p>
                      <p className="whitespace-pre-wrap">{t.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* --- Selection Bar --- */}
      <AnimatePresence>
        {selectedLeads.size > 0 && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60]"
          >
            <div className="bg-slate-900 border border-slate-700 rounded-2xl px-8 py-4 shadow-2xl flex items-center gap-8 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
                  {selectedLeads.size}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Leads Selected</div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Ready for Outreach</div>
                </div>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    if (!license?.valid) {
                      alert('License required for bulk outreach.');
                      return;
                    }
                    const leadsToCall = leads.filter(l => selectedLeads.has(l.website) && l.phone);
                    if (leadsToCall.length === 0) {
                      alert('No selected leads have phone numbers.');
                      return;
                    }
                    if (confirm(`Start bulk Voicebot outreach to ${leadsToCall.length} leads?`)) {
                      leadsToCall.forEach((l, i) => {
                        setTimeout(() => triggerCall(l), i * 2000); // Stagger calls
                      });
                    }
                  }}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                >
                  <Bot className="w-4 h-4" />
                  Bulk Voicebot
                </button>
                <button 
                  onClick={exportCSV}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
                <button 
                  onClick={() => setSelectedLeads(new Set())}
                  className="p-2 text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Terms Modal */}
      <AnimatePresence>
        {!termsAccepted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6"
            >
              <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto">
                <Scale className="w-8 h-8 text-indigo-400" />
              </div>
              
              <div className="text-center space-y-2">
                <h2 className="text-xl font-bold">Legal Compliance & Terms</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Lead Crawler Pro provides AI-powered voice outreach tools. By using these tools, you agree to comply with all local and international laws (TCPA, GDPR, etc.).
                </p>
              </div>

              <div className="space-y-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
                <div className="flex gap-3">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  <p className="text-[10px] text-slate-400">I will only call businesses during legal hours (8 AM - 8 PM local time).</p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  <p className="text-[10px] text-slate-400">I will respect all "Do Not Call" requests immediately.</p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  <p className="text-[10px] text-slate-400">I understand that I am solely responsible for the content of my AI calls.</p>
                </div>
              </div>

              <button 
                onClick={() => {
                  setTermsAccepted(true);
                  localStorage.setItem(LS_TERMS, 'true');
                }}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20"
              >
                I Accept & Understand
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Footer --- */}
      <footer className="border-t border-slate-800 bg-slate-950/50 py-12 mt-24">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3 opacity-50">
            <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
              <Zap className="text-slate-400 w-4 h-4 fill-slate-400" />
            </div>
            <span className="text-sm font-bold tracking-tight text-slate-400">Lead Crawler <span className="text-slate-500">Pro</span></span>
          </div>
          <div className="flex items-center gap-8 text-[10px] font-bold uppercase tracking-widest text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              EU AI Act Compliant
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Made in Amsterdam
            </div>
            <div className="text-slate-700">© 2026 ContentScale.site</div>
          </div>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      ` }} />
    </div>
  );
}
