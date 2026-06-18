import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, 
  Shield, 
  Headphones, 
  Terminal, 
  CheckCircle2, 
  Mail, 
  Phone, 
  ArrowRight, 
  CalendarCheck2, 
  Lock, 
  Server, 
  Sparkles, 
  Info,
  BadgeAlert,
  HelpCircle,
  Clock,
  ShieldCheck,
  Building,
  DollarSign,
  X,
  User
} from 'lucide-react';
import { SERVICES_DATA, TESTIMONIALS_DATA } from './data';
import { ContactSubmission, ServiceDetail } from './types';
import ServiceModal from './components/ServiceModal';
import RiskAuditModal from './components/RiskAuditModal';
import MyRequestsDrawer from './components/MyRequestsDrawer';
import AuthModal from './components/AuthModal';
import ClientDashboard from './components/ClientDashboard';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export default function App() {
  // Navigation active state
  const [activeTab, setActiveTab ] = useState('header-hero');
  
  // Selection/Modal states
  const [selectedService, setSelectedService] = useState<ServiceDetail | null>(null);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  
  // Auth & Dashboard States
  const [user, setUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);

  // Storage state
  const [requests, setRequests] = useState<ContactSubmission[]>([]);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedServiceTitle, setSelectedServiceTitle] = useState('Computação em Nuvem');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Monitor auth state changes and sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Logged in: Sync consultations requests with Firestore
        await syncProposalsFromFirestore(currentUser.uid);
      } else {
        // Guest mode: Read proposals from standard localStorage
        try {
          const stored = localStorage.getItem('viatix_consultations');
          if (stored) {
            setRequests(JSON.parse(stored));
          } else {
            setRequests([]);
          }
        } catch (e) {
          console.error('Error reading localStorage', e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const syncProposalsFromFirestore = async (userId: string) => {
    try {
      const colRef = collection(db, 'users', userId, 'consultations');
      const snapshot = await getDocs(colRef);
      const fsRequests: ContactSubmission[] = [];
      
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        fsRequests.push({
          id: docSnap.id,
          fullName: data.fullName || '',
          email: data.email || '',
          service: data.service || '',
          message: data.message || '',
          timestamp: data.timestamp || '',
          status: data.status || 'Pendente'
        });
      });

      // Automatically migrate local consultations if present
      const storedLocal = localStorage.getItem('viatix_consultations');
      if (storedLocal) {
        try {
          const localList: ContactSubmission[] = JSON.parse(storedLocal);
          for (const item of localList) {
            if (!fsRequests.some(fs => fs.id === item.id)) {
              const docRef = doc(db, 'users', userId, 'consultations', item.id);
              await setDoc(docRef, item);
              fsRequests.push(item);
            }
          }
          // Clear localStorage as they are now securely backed up to Firestore
          localStorage.removeItem('viatix_consultations');
        } catch (err) {
          console.error('Error parsing local list', err);
        }
      }

      // Sort locally so newest requests are on top
      fsRequests.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      setRequests(fsRequests);
    } catch (e) {
      console.error("Error syncing consultations with Firestore", e);
    }
  };

  const handleRefreshProposals = async () => {
    if (user) {
      await syncProposalsFromFirestore(user.uid);
    }
  };

  // Save submissions helper (for guest users)
  const saveRequestsToStorage = (updatedList: ContactSubmission[]) => {
    setRequests(updatedList);
    try {
      localStorage.setItem('viatix_consultations', JSON.stringify(updatedList));
    } catch (e) {
      console.error('Error saving to localStorage', e);
    }
  };

  // Nav scroll behavior & detection
  const navLinks = [
    { id: 'services-section', label: 'Serviços' },
    { id: 'stats-section', label: 'Vantagens' },
    { id: 'testimonials-section', label: 'Parceiros' },
    { id: 'contact-section', label: 'Contato' }
  ];

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveTab(id);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;

    setIsSubmitting(true);

    const newSubmission: ContactSubmission = {
      id: Math.random().toString(36).substring(2, 9),
      fullName,
      email,
      service: selectedServiceTitle,
      message: message || 'Gostaria de agendar uma reunião inicial para entender melhor as opções da Viatix.',
      timestamp: new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }) + ' às ' + new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      status: 'Pendente'
    };

    try {
      if (user) {
        // Save directly to Firestore for logged in user
        const docRef = doc(db, 'users', user.uid, 'consultations', newSubmission.id);
        await setDoc(docRef, newSubmission);
        setRequests(prev => [newSubmission, ...prev]);
      } else {
        // Guest mode
        const updated = [newSubmission, ...requests];
        saveRequestsToStorage(updated);
      }

      setIsSubmitting(false);
      setSubmitSuccess(true);
      
      // Reset inputs after delay
      setTimeout(() => {
        setFullName('');
        setEmail('');
        setMessage('');
        setSubmitSuccess(false);
      }, 3500);
    } catch (err) {
      console.error('Error submitting form:', err);
      setIsSubmitting(false);
    }
  };

  const handleRemoveRequest = async (id: string) => {
    setRequests(prev => prev.filter(r => r.id !== id));
    if (user) {
      try {
        const docRef = doc(db, 'users', user.uid, 'consultations', id);
        await deleteDoc(docRef);
      } catch (err) {
        console.error('Error deleting proposal from Firestore:', err);
      }
    } else {
      const updated = requests.filter(r => r.id !== id);
      saveRequestsToStorage(updated);
    }
  };

  const handleLogout = async () => {
    if (user) {
      try {
        // Write logout access log
        const logId = Math.random().toString(36).substring(2, 9);
        const accessLogRef = doc(db, `users/${user.uid}/accesses`, logId);
        await setDoc(accessLogRef, {
          id: logId,
          action: 'Logout',
          timestamp: new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR'),
          userAgent: navigator.userAgent.substring(0, 150),
          status: 'Sucesso'
        });
      } catch (e) {
        console.error(e);
      }
    }
    await signOut(auth);
    setIsDashboardOpen(false);
  };


  // Completing the technical vulnerability audit
  const onCompleteAudit = (safetyPercentage: number, generatedMessage: string) => {
    setSelectedServiceTitle('Cibersegurança Avançada');
    setMessage(generatedMessage);
    handleScrollTo('contact-section');
  };

  // Selecting a service from within details window
  const onSelectFromModal = (serviceTitle: string) => {
    setSelectedServiceTitle(serviceTitle);
    handleScrollTo('contact-section');
  };

  // Plan trigger handler
  const handleSelectPlan = (planName: string) => {
    setSelectedServiceTitle('Desenvolvimento de Software');
    setMessage(`Olá! Gostaria de obter informações comerciais sobre o plano [${planName}]. Desejo que um especialista faça um contato comercial para avaliarmos a implantação.`);
    setShowPlansModal(false);
    handleScrollTo('contact-section');
  };

  return (
    <div className="bg-background text-on-surface font-sans selection:bg-secondary-fixed min-h-screen flex flex-col antialiased" id="viatix-root">
      
      {/* TopNavBar Shared Component */}
      <header className="bg-surface-container-lowest/90 backdrop-blur-md sticky top-0 border-b border-outline-variant shadow-sm z-40 transition-all duration-300" id="main-header">
        <div className="flex justify-between items-center h-20 px-6 md:px-16 max-w-[1280px] mx-auto w-full">
          {/* Logo */}
          <div 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
            className="font-sans text-2xl font-bold tracking-tight text-primary cursor-pointer flex items-center gap-1.5"
            id="brand-logo"
          >
            <span className="text-secondary font-extrabold">•</span>
            <span>Viatix</span>
          </div>

          {/* Navigation Items */}
          <nav className="hidden md:flex gap-8 font-sans text-sm font-medium" id="navbar-links">
            {navLinks.map((link) => (
              <button 
                key={link.id}
                onClick={() => handleScrollTo(link.id)}
                className={`transition-colors py-2 relative outline-none cursor-pointer ${
                  activeTab === link.id 
                    ? 'text-secondary font-semibold' 
                    : 'text-on-surface-variant hover:text-secondary'
                }`}
              >
                <span>{link.label}</span>
                {activeTab === link.id && (
                  <motion.span 
                    layoutId="activeNavIndicator" 
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary rounded-full" 
                  />
                )}
              </button>
            ))}
          </nav>

          {/* Nav Actions */}
          <div className="flex items-center gap-3" id="navbar-actions">
            {user ? (
              // Logged In Dashboard Button
              <button 
                onClick={() => setIsDashboardOpen(true)}
                className="px-3.5 py-2 bg-secondary/10 border border-secondary/25 hover:border-secondary/40 text-secondary hover:bg-secondary/15 rounded-lg font-sans text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer outline-none"
                id="btn-client-home"
              >
                <div className="w-5 h-5 bg-secondary text-white rounded-full flex items-center justify-center font-bold text-[10px] uppercase shrink-0">
                  {user.displayName ? user.displayName.substring(0, 1) : 'U'}
                </div>
                <span className="hidden sm:inline">Painel do Gestor</span>
              </button>
            ) : (
              // Logged Out Login Button
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3.5 py-2 border border-outline-variant hover:border-secondary text-primary hover:bg-surface-container-low rounded-lg font-sans text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer outline-none"
                id="btn-client-login"
              >
                <User className="w-4 h-4 text-secondary shrink-0" />
                <span>Área do Cliente</span>
              </button>
            )}

            {requests.length > 0 && !user && (
              <button 
                onClick={() => setIsDrawerOpen(true)}
                className="relative px-3 py-2 border border-outline-variant hover:border-secondary rounded-lg font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors text-secondary cursor-pointer"
                id="btn-my-consultations"
                title="Ver minhas solicitações temporárias"
              >
                <CalendarCheck2 className="w-4 h-4" />
                <span className="hidden sm:inline">Minhas Consultas</span>
                <span className="px-1.5 py-0.25 bg-secondary text-white rounded-full text-[10px] font-bold">
                  {requests.length}
                </span>
              </button>
            )}
            
            <button 
              onClick={() => handleScrollTo('contact-section')}
              className="bg-primary text-on-primary text-sm px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 transition-all shadow-sm active:scale-95 cursor-pointer hidden md:block"
              id="btn-get-started"
            >
              Agendar Consultoria
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1" id="main-content">
        
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-20 md:pt-28 md:pb-36 max-w-[1280px] mx-auto px-6 md:px-16" id="header-hero">
          <div className="relative z-10 max-w-4xl space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary/10 rounded-full font-mono text-xs text-secondary font-semibold uppercase tracking-wider" id="hero-badge">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tecnologia de Precisão</span>
            </div>

            <h1 className="font-sans font-bold text-4xl sm:text-5xl md:text-6.5xl leading-[1.1] text-primary tracking-tight" id="hero-title">
              Impulsionando o Futuro Digital com <span className="gradient-text">Soluções de TI sob Medida</span>
            </h1>

            <p className="text-on-surface-variant text-base sm:text-lg md:text-xl leading-relaxed max-w-3xl" id="hero-subtitle">
              Da nuvem à cibersegurança, a Viatix entrega a infraestrutura cibernética e de engenharia que sua empresa precisa para crescer com estabilidade, conformidade legal e inovação técnica.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4" id="hero-ctas">
              <button 
                onClick={() => handleScrollTo('contact-section')}
                className="bg-primary text-on-primary px-8 py-4.5 rounded-xl text-base font-semibold hover:scale-102 cursor-pointer shadow-md shadow-primary/10 transition-transform text-center flex items-center justify-center gap-2 group"
                id="hero-cta-primary"
              >
                <span>Agende uma Consultoria Gratuita</span>
                <ArrowRight className="w-4.5 h-4.5 transition-transform group-hover:translate-x-1" />
              </button>
              
              <button 
                onClick={() => setShowPlansModal(true)}
                className="border border-outline-variant text-primary hover:border-secondary hover:bg-surface-container/50 px-8 py-4.5 rounded-xl text-base font-semibold transition-colors text-center cursor-pointer"
                id="hero-cta-secondary"
              >
                Conheça Nossos Planos
              </button>
            </div>
          </div>

          {/* Ambient visual element */}
          <div className="absolute right-0 top-12 w-96 h-96 bg-secondary/5 blur-3xl rounded-full -z-10 pointer-events-none" />
        </section>

        {/* Stats Section */}
        <section className="bg-surface-container-low py-8 border-y border-outline-variant" id="stats-section">
          <div className="max-w-[1280px] mx-auto px-6 md:px-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left" id="stats-grid">
              {/* Stat 1 */}
              <div className="flex flex-col items-center md:items-start p-4 md:border-r border-outline-variant/60 last:border-r-0" id="stat-1">
                <span className="font-sans font-extrabold text-4xl lg:text-5xl text-primary leading-none">15+</span>
                <p className="font-mono text-xs uppercase tracking-widest text-on-surface-variant mt-2.5">Anos de Experiência Coletiva</p>
              </div>

              {/* Stat 2 */}
              <div className="flex flex-col items-center md:items-start p-4 md:border-r border-outline-variant/60 last:border-r-0" id="stat-2">
                <span className="font-sans font-extrabold text-4xl lg:text-5xl text-secondary leading-none">24/7</span>
                <p className="font-mono text-xs uppercase tracking-widest text-on-surface-variant mt-2.5">Suporte Técnico Ativo</p>
              </div>

              {/* Stat 3 */}
              <div className="flex flex-col items-center md:items-start p-4 text-center md:text-left" id="stat-3">
                <span className="font-sans font-extrabold text-4xl lg:text-5xl text-primary leading-none gradient-text">30%</span>
                <p className="font-mono text-xs uppercase tracking-widest text-on-surface-variant mt-2.5">Redução Média de Custos de Cloud</p>
              </div>
            </div>
          </div>
        </section>

        {/* Services Bento Grid */}
        <section className="py-20 md:py-28 max-w-[1280px] mx-auto px-6 md:px-16" id="services-section">
          <div className="mb-14 text-center md:text-left space-y-3" id="services-header">
            <span className="font-mono text-xs text-secondary font-bold uppercase tracking-widest">Inovação e Estabilidade</span>
            <h2 className="font-sans font-bold text-3xl md:text-4xl text-primary tracking-tight">Nossos Serviços Especializados</h2>
            <p className="text-on-surface-variant text-base max-w-xl">
              Soluções modulares desenhadas sob medida para mitigar a complexidade do cenário tecnológico corporativo atual.
            </p>
          </div>

          <div className="grid grid-cols-12 gap-6" id="services-bento-grid">
            
            {/* 1. Cloud Computing Card (8 cols) */}
            <div 
              className="col-span-12 md:col-span-8 bg-surface-container-lowest border border-outline-variant p-6 sm:p-8 rounded-2xl flex flex-col lg:flex-row gap-6 card-glow cursor-pointer"
              onClick={() => setSelectedService(SERVICES_DATA[0])}
              id="card-cloud-computing"
            >
              <div className="flex-1 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="p-3 bg-secondary/10 rounded-xl w-fit">
                    <Cloud className="w-6 h-6 text-secondary" />
                  </div>
                  <h3 className="font-sans font-bold text-2xl text-primary">Computação em Nuvem</h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed">
                    Migração, arquitetura serverless, gerenciamento e otimização de ambientes AWS, Azure e Google Cloud focados em escalabilidade sólida.
                  </p>
                </div>
                
                <ul className="space-y-2.5 font-mono text-xs text-on-surface-variant">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
                    <span>Arquitetura Serverless Avançada</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
                    <span>Monitoramento de Performance em Tempo Real</span>
                  </li>
                </ul>

                <span className="text-secondary font-sans text-xs font-semibold flex items-center gap-1 group">
                  <span>Conhecer Escopo de Cloud</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
              
              <div className="w-full lg:w-[45%] h-48 sm:h-auto min-h-[180px] rounded-xl overflow-hidden border border-outline-variant/60">
                <img 
                  className="w-full h-full object-cover select-none" 
                  alt="A clean high-tech server room with glowing blue neon lights." 
                  src={SERVICES_DATA[0].imageUrl}
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* 2. Cybersecurity Card (4 cols) - Contrast/Primary-Container style */}
            <div 
              className="col-span-12 md:col-span-4 bg-primary-container text-white border border-primary p-6 sm:p-8 rounded-2xl flex flex-col justify-between space-y-8 card-glow cursor-pointer hover:bg-primary-container/98 relative overflow-hidden"
              onClick={() => setSelectedService(SERVICES_DATA[1])}
              id="card-cyber-security"
            >
              <div className="space-y-4 relative z-10">
                <div className="p-3 bg-white/10 rounded-xl w-fit">
                  <Shield className="w-6 h-6 text-secondary-container" />
                </div>
                <h3 className="font-sans font-bold text-2xl text-inverse-primary">Cibersegurança Avançada</h3>
                <p className="text-on-primary-container text-sm leading-relaxed">
                  Proteção multicamada contra ameaças digitais, engenharia social, sequestro de dados (Ransomware) e ataques volumétricos DDoS.
                </p>
              </div>

              <div className="pt-2 relative z-10 space-y-3">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAuditOpen(true);
                  }}
                  className="w-full py-3.5 bg-secondary-container text-on-secondary-container hover:bg-secondary-container/95 rounded-xl font-sans font-bold text-sm tracking-wide transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                  id="btn-trigger-risk-audit"
                >
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>Iniciar Auditoria de Risco</span>
                </button>
                <span className="text-on-primary-container font-mono text-[10px] text-center block opacity-80">
                  Responda 4 perguntas e gere seu scorecard.
                </span>
              </div>

              {/* Background gradient layout */}
              <div className="absolute right-0 bottom-0 w-32 h-32 bg-secondary/10 blur-xl rounded-full" />
            </div>

            {/* 3. Managed Support Card (5 cols) */}
            <div 
              className="col-span-12 md:col-span-5 bg-surface-container-lowest border border-outline-variant p-6 sm:p-8 rounded-2xl flex flex-col justify-between space-y-6 card-glow cursor-pointer"
              onClick={() => setSelectedService(SERVICES_DATA[2])}
              id="card-managed-support"
            >
              <div className="space-y-4">
                <div className="p-3 bg-secondary/10 rounded-xl w-fit">
                  <Headphones className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="font-sans font-bold text-2xl text-primary">Suporte Gerenciado</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  Esqueça os chamados que demoram dias para obter retorno. Equipe técnica exclusiva estruturada em SLAs inteligentes focada em garantir zero downtime na sua empresa.
                </p>
              </div>

              <div className="h-32 rounded-lg bg-cover bg-center border border-outline-variant/50 relative overflow-hidden flex items-end p-3">
                <img 
                  src={SERVICES_DATA[2].imageUrl} 
                  alt="High speed connectivity support" 
                  className="absolute inset-0 w-full h-full object-cover select-none"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="relative font-mono text-[10px] text-white tracking-widest uppercase">Padrão Corporativo Premium</span>
              </div>

              <span className="text-secondary font-sans text-xs font-semibold flex items-center gap-1 group">
                <span>Visualizar SLAs técnicos</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </div>

            {/* 4. Software Development Card (7 cols) */}
            <div 
              className="col-span-12 md:col-span-7 bg-surface-container-lowest border border-outline-variant p-6 sm:p-8 rounded-2xl card-glow cursor-pointer flex flex-col justify-between space-y-6"
              onClick={() => setSelectedService(SERVICES_DATA[3])}
              id="card-software-dev"
            >
              <div className="space-y-4">
                <div className="p-3 bg-secondary/10 rounded-xl w-fit">
                  <Terminal className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="font-sans font-bold text-2xl text-primary">Desenvolvimento de Software</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  Sistemas customizados, APIs de integração robustas e portais de alta performance desenhados de forma escalável e centrada na melhor experiência de uso de ponta a ponta.
                </p>
              </div>

              {/* Grid of technologies */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center" id="tech-stack-display">
                <div className="bg-surface-container p-2.5 rounded-lg font-mono text-xs text-on-surface-variant hover:text-secondary hover:bg-secondary/5 border border-outline-variant/40 transition-colors">
                  React/Next.js
                </div>
                <div className="bg-surface-container p-2.5 rounded-lg font-mono text-xs text-on-surface-variant hover:text-secondary hover:bg-secondary/5 border border-outline-variant/40 transition-colors">
                  Node.js
                </div>
                <div className="bg-surface-container p-2.5 rounded-lg font-mono text-xs text-on-surface-variant hover:text-secondary hover:bg-secondary/5 border border-outline-variant/40 transition-colors">
                  Python
                </div>
                <div className="bg-surface-container p-2.5 rounded-lg font-mono text-xs text-on-surface-variant hover:text-secondary hover:bg-secondary/5 border border-outline-variant/40 transition-colors">
                  Go-Lang
                </div>
              </div>

              <span className="text-secondary font-sans text-xs font-semibold flex items-center gap-1 group">
                <span>Consultar Projetos & Arquitetura</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </div>

          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 md:py-24 bg-surface-container-high border-y border-outline-variant overflow-hidden" id="testimonials-section">
          <div className="max-w-[1280px] mx-auto px-6 md:px-16 space-y-12">
            <div className="text-center space-y-2">
              <span className="font-mono text-xs text-secondary font-bold uppercase tracking-widest">Sucesso Compartilhado</span>
              <h2 className="font-sans font-bold text-3xl text-primary tracking-tight">O que dizem nossos parceiros</h2>
              <p className="text-on-surface-variant text-sm max-w-md mx-auto">
                Confiança mútua estabelecida com base em resultados consolidados e SLA real cumprido à risca.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8" id="testimonials-grid">
              {TESTIMONIALS_DATA.map((t, idx) => (
                <div 
                  key={idx} 
                  className="bg-surface-container-lowest p-6 sm:p-8 rounded-2xl border border-outline-variant relative flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Styled Quote Decorative Marks */}
                  <span className="absolute top-4 right-6 font-serif text-secondary/15 text-7xl select-none pointer-events-none font-extrabold leading-none">
                    "
                  </span>

                  <p className="font-sans italic text-base leading-relaxed text-on-surface-variant relative z-10 mb-6">
                    "{t.quote}"
                  </p>

                  <div className="flex items-center gap-4 relative z-10 border-t border-outline-variant/60 pt-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-outline-variant shadow-xs border border-outline-variant shrink-0">
                      <img 
                        className="w-full h-full object-cover pointer-events-none" 
                        src={t.imageUrl} 
                        alt={t.name} 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <h4 className="font-sans font-bold text-primary text-sm">{t.name}</h4>
                      <p className="font-mono text-xs text-on-surface-variant">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Consultation / Contact form Section */}
        <section className="py-20 md:py-24 max-w-[1280px] mx-auto px-6 md:px-16" id="contact-section">
          <div className="bg-primary text-white rounded-3xl overflow-hidden flex flex-col lg:flex-row shadow-2xl border border-outline/35" id="contact-billing-card">
            
            {/* Visual Left Info Bar */}
            <div className="p-8 sm:p-12 lg:p-20 lg:w-[45%] flex flex-col justify-between space-y-12 bg-black relative" id="contact-panel-info">
              <div className="space-y-6">
                <span className="font-mono text-xs text-secondary-container font-bold uppercase tracking-widest block">Inicie sua Transformação</span>
                <h2 className="font-sans font-semibold text-3xl sm:text-4xl leading-tight">Pronto para Transformar sua TI?</h2>
                <p className="text-on-primary-container text-sm leading-relaxed opacity-85 max-w-md">
                  Deixe seus dados de contato comercial e um de nossos engenheiros de segurança e infraestrutura entrará em contato em até 2 horas úteis para apresentar sua análise gratuita ambiental.
                </p>
              </div>

              {/* Credentials detail lists */}
              <div className="space-y-4 pt-4 border-t border-white/10" id="contact-credentials-list">
                <div className="flex items-center gap-3.5" id="contact-email">
                  <div className="p-2.5 bg-white/5 rounded-lg">
                    <Mail className="w-5 h-5 text-secondary-container" />
                  </div>
                  <div>
                    <span className="font-mono text-[10px] uppercase text-on-primary-container block">E-mail Comercial</span>
                    <a href="mailto:contato@viatix.com.br" className="hover:underline text-sm font-semibold text-white">
                      contato@viatix.com.br
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3.5" id="contact-phone">
                  <div className="p-2.5 bg-white/5 rounded-lg">
                    <Phone className="w-5 h-5 text-secondary-container" />
                  </div>
                  <div>
                    <span className="font-mono text-[10px] uppercase text-on-primary-container block">Fale Conosco</span>
                    <span className="text-sm font-semibold text-white">0800 123 4567</span>
                  </div>
                </div>
              </div>

              {/* Ambient visual sphere */}
              <div className="absolute right-0 bottom-0 w-36 h-36 bg-secondary/10 blur-2xl rounded-full pointer-events-none" />
            </div>

            {/* Practical Form Element */}
            <div className="p-8 sm:p-12 lg:p-20 lg:w-[55%] bg-surface-container-lowest text-on-surface" id="contact-panel-form">
              <form onSubmit={handleFormSubmit} className="space-y-5" id="institutional-lead-form">
                
                {/* Real-time Dynamic Feedback status indicator */}
                <AnimatePresence>
                  {submitSuccess && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl flex items-start gap-3"
                      id="form-success-banner"
                    >
                      <CheckCircle2 className="w-5.5 h-5.5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-sans font-bold block text-sm">Parabéns! Sua proposta foi agendada.</span>
                        <p className="text-xs mt-0.5 leading-relaxed text-emerald-700">
                          Dados de infraestrutura salvos com sucesso no sistema Viatix. Nosso especialista entrará em contato comercial muito em breve.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-1">
                  <label className="block font-sans font-semibold text-xs uppercase tracking-wide text-on-surface-variant mb-1">
                    Nome Completo
                  </label>
                  <input 
                    required 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome ou departamento"
                    className="w-full border border-outline-variant rounded-lg p-3.5 focus:ring-2 focus:ring-secondary/15 focus:border-secondary outline-none transition-all text-sm bg-surface"
                    id="input-fullname"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-sans font-semibold text-xs uppercase tracking-wide text-on-surface-variant mb-1">
                    E-mail Corporativo
                  </label>
                  <input 
                    required 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nome@empresa.com.br"
                    className="w-full border border-outline-variant rounded-lg p-3.5 focus:ring-2 focus:ring-secondary/15 focus:border-secondary outline-none transition-all text-sm bg-surface"
                    id="input-email"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-sans font-semibold text-xs uppercase tracking-wide text-on-surface-variant mb-1">
                    Serviço de Interesse
                  </label>
                  <select 
                    value={selectedServiceTitle}
                    onChange={(e) => setSelectedServiceTitle(e.target.value)}
                    className="w-full border border-outline-variant rounded-lg p-3.5 focus:ring-2 focus:ring-secondary/15 focus:border-secondary outline-none transition-all text-sm bg-surface cursor-pointer font-sans"
                    id="input-service"
                  >
                    <option>Computação em Nuvem</option>
                    <option>Cibersegurança Avançada</option>
                    <option>Suporte Gerenciado</option>
                    <option>Desenvolvimento de Software</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-sans font-semibold text-xs uppercase tracking-wide text-on-surface-variant mb-1">
                    Informações Adicionais (Mensagem)
                  </label>
                  <textarea 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Quais são os principais desafios ou metas da infraestrutura da sua empresa?"
                    rows={4}
                    className="w-full border border-outline-variant rounded-lg p-3.5 focus:ring-2 focus:ring-secondary/15 focus:border-secondary outline-none transition-all text-sm bg-surface font-sans"
                    id="input-message"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting || !fullName || !email}
                  className={`w-full py-4 rounded-xl font-sans font-bold text-sm tracking-widest text-center transition-all ${
                    isSubmitting 
                      ? 'bg-secondary/70 text-white cursor-not-allowed'
                      : !fullName || !email
                        ? 'bg-outline-variant text-on-surface-variant/40 cursor-not-allowed'
                        : 'bg-secondary text-on-secondary hover:bg-secondary/95 hover:scale-[1.01]'
                  }`}
                  id="btn-submit-lead"
                >
                  {isSubmitting ? 'ENVIANDO SOLICITAÇÃO...' : 'SOLICITAR CONSULTORIA DE TI'}
                </button>
              </form>
            </div>

          </div>
        </section>

      </main>

      {/* Footer System Component */}
      <footer className="bg-surface-container-highest border-t border-outline-variant mt-auto" id="main-footer">
        <div className="max-w-[1280px] mx-auto px-6 md:px-16 py-10 flex flex-col md:flex-row justify-between items-center gap-6" id="footer-inner">
          <div className="space-y-1.5 text-center md:text-left" id="footer-copyright-box">
            <div className="font-sans text-xl font-bold text-primary flex items-center justify-center md:justify-start gap-1">
              <span className="text-secondary">•</span>
              <span>Viatix</span>
            </div>
            <p className="font-sans text-xs text-on-surface-variant">
              © {new Date().getFullYear()} Viatix Technology Solutions. Todos os direitos reservados.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2.5" id="footer-policy-urls">
            <a 
              href="#" 
              onClick={(e) => {e.preventDefault(); alert('Políticas de Privacidade: Seus dados estão em conformidade com as regras da LGPD nacional.');}}
              className="font-mono text-xs text-on-surface-variant hover:text-secondary underline"
            >
              Política de Privacidade
            </a>
            <a 
              href="#" 
              onClick={(e) => {e.preventDefault(); alert('Termos de Serviço: Soluções acordadas mediante SLA estruturada por contrato.');}}
              className="font-mono text-xs text-on-surface-variant hover:text-secondary underline"
            >
              Termos de Uso
            </a>
            <a 
              href="#" 
              onClick={(e) => {e.preventDefault(); alert('Políticas de Cookies: Utilizamos cookies técnicos de sessão para melhorar o carregamento local.');}}
              className="font-mono text-xs text-on-surface-variant hover:text-secondary underline"
            >
              Política de Cookies
            </a>
            <a 
              href="#" 
              onClick={(e) => {e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' });}}
              className="font-mono text-xs text-on-surface-variant hover:text-secondary underline"
            >
              Voltar ao Topo
            </a>
          </div>
        </div>
      </footer>

      {/* 5. Pricing comparator Modal (triggered by "Conheça Nossos Planos") */}
      <AnimatePresence>
        {showPlansModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowPlansModal(false)}
            id="plans-modal-overlay"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
              id="plans-modal"
            >
              {/* Header */}
              <div className="p-6 md:p-8 bg-surface-container-low border-b border-outline-variant flex justify-between items-center" id="plans-modal-header">
                <div>
                  <span className="font-mono text-xs text-secondary font-bold uppercase tracking-widest block">Planejamento Estratégico</span>
                  <h3 className="font-sans font-bold text-2xl text-primary">Tabelas de Planos Corporativos Viatix</h3>
                </div>
                <button 
                  onClick={() => setShowPlansModal(false)}
                  className="p-1.5 border border-outline-variant text-on-surface-variant hover:bg-surface-container rounded-full transition-colors font-mono text-xs cursor-pointer"
                  id="btn-close-plans"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Plans Grid */}
              <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6" id="plans-modal-grid">
                
                {/* Plan 1 */}
                <div className="border border-outline-variant rounded-xl p-5 hover:border-secondary transition-colors flex flex-col justify-between space-y-6" id="plan-essence">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[10px] bg-secondary/10 text-secondary px-2 py-0.5 rounded-md font-bold uppercase">Essencial</span>
                      <Building className="w-4.5 h-4.5 text-on-surface-variant/70" />
                    </div>
                    <div>
                      <h4 className="font-sans font-bold text-lg text-primary">TI Startup</h4>
                      <p className="text-xs text-on-surface-variant mt-1">Ideal para pequenas empresas com até 20 endpoints locais.</p>
                    </div>
                    <div className="border-t border-outline-variant/60 pt-4 space-y-2.5 text-xs text-on-surface-variant font-sans">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-secondary shrink-0" />
                        <span>Suporte N1/N2 em horário comercial</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-secondary shrink-0" />
                        <span>SLA de atendimento de até 2 horas</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-secondary shrink-0" />
                        <span>Inventário de até 15 máquinas</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleSelectPlan('TI Startup (Essencial)')}
                    className="w-full py-2.5 border border-primary text-primary hover:bg-surface-container text-xs font-bold rounded-lg transition-all cursor-pointer text-center"
                  >
                    Selecionar Plano
                  </button>
                </div>

                {/* Plan 2 */}
                <div className="border-2 border-secondary bg-secondary/5 rounded-xl p-5 relative flex flex-col justify-between space-y-6" id="plan-scale">
                  <div className="absolute top-0 right-5 transform -translate-y-1/2 bg-secondary text-on-secondary px-2 py-0.5 rounded-full font-mono text-[9px] font-extrabold uppercase tracking-widest">
                    Mais Reclamado
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[10px] bg-secondary text-on-secondary px-2 py-0.5 rounded-md font-bold uppercase">Scale-Up</span>
                      <Server className="w-4.5 h-4.5 text-secondary" />
                    </div>
                    <div>
                      <h4 className="font-sans font-bold text-lg text-primary">Cloud Business</h4>
                      <p className="text-xs text-on-surface-variant mt-1">Mais indicado para médias operações necessitando de monitoramento completo.</p>
                    </div>
                    <div className="border-t border-outline-variant/60 pt-4 space-y-2.5 text-xs text-on-surface-variant font-sans">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-secondary shrink-0" />
                        <span className="font-semibold text-primary">Suporte Ativo 24/7/365</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-secondary shrink-0" />
                        <span>SLA para urgências de até 15 minutos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-secondary shrink-0" />
                        <span>Monitoramento avançado de servidores cloud</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-secondary shrink-0" />
                        <span>Conformidade jurídica LGPD inclusa</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleSelectPlan('Cloud Business (Scale-Up)')}
                    className="w-full py-2.5 bg-secondary text-on-secondary hover:bg-secondary/95 text-xs font-bold rounded-lg transition-all cursor-pointer text-center"
                    id="btn-select-scale"
                  >
                    Selecionar Plano
                  </button>
                </div>

                {/* Plan 3 */}
                <div className="border border-outline-variant rounded-xl p-5 hover:border-secondary transition-colors flex flex-col justify-between space-y-6" id="plan-enterprise">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[10px] bg-secondary/10 text-secondary px-2 py-0.5 rounded-md font-bold uppercase">Enterprise</span>
                      <ShieldCheck className="w-4.5 h-4.5 text-on-surface-variant/70" />
                    </div>
                    <div>
                      <h4 className="font-sans font-bold text-lg text-primary">Cyber Shield</h4>
                      <p className="text-xs text-on-surface-variant mt-1">Foco extremo em segurança Zero-Trust e consultorias dedicadas.</p>
                    </div>
                    <div className="border-t border-outline-variant/60 pt-4 space-y-2.5 text-xs text-on-surface-variant font-sans">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-secondary shrink-0" />
                        <span>Painel de SOC 24 horas integrado</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-secondary shrink-0" />
                        <span>Pentests trimestrais de vulnerabilidade</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-secondary shrink-0" />
                        <span>Arquiteto de infraestrutura exclusivo</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleSelectPlan('Cyber Shield (Enterprise)')}
                    className="w-full py-2.5 border border-primary text-primary hover:bg-surface-container text-xs font-bold rounded-lg transition-all cursor-pointer text-center"
                  >
                    Selecionar Plano
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Service View Breakout Trigger Modal */}
      <ServiceModal 
        service={selectedService}
        onClose={() => setSelectedService(null)}
        onSelectService={onSelectFromModal}
      />

      {/* Cyber Technical Vulnerability Assessment Modal */}
      <RiskAuditModal 
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        onCompleteAudit={onCompleteAudit}
      />

      {/* Slide-over persistent requests drawer */}
      <MyRequestsDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        requests={requests}
        onRemoveRequest={handleRemoveRequest}
      />

      {/* Dynamic Firebase Auth Authentication Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={async (action) => {
          // Immediately trigger proposals refresh
          if (auth.currentUser) {
            await syncProposalsFromFirestore(auth.currentUser.uid);
          }
        }}
      />

      {/* Secure Enterprise Client Dashboard Hub */}
      <ClientDashboard 
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
        user={user}
        onLogout={handleLogout}
        proposals={requests}
        onRemoveProposal={handleRemoveRequest}
        onRefreshProposals={handleRefreshProposals}
      />

    </div>
  );
}

