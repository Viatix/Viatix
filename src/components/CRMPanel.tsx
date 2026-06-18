import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit2, 
  Briefcase, 
  Phone, 
  Mail, 
  FileText, 
  CheckSquare, 
  Square, 
  User, 
  DollarSign, 
  Award, 
  AlertCircle, 
  Calendar, 
  RefreshCw,
  PlusCircle,
  TrendingDown,
  CheckCircle2,
  ListTodo,
  CheckSquare2,
  Clock
} from 'lucide-react';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { CRMLead, CRMTask } from '../types';

interface CRMPanelProps {
  user: any;
}

export default function CRMPanel({ user }: CRMPanelProps) {
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [tasks, setTasks] = useState<CRMTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'leads' | 'tasks'>('leads');

  // Lead Form States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<CRMLead | null>(null);
  
  // Input fields
  const [leadName, setLeadName] = useState('');
  const [leadCompany, setLeadCompany] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadValue, setLeadValue] = useState(0);
  const [leadStage, setLeadStage] = useState<'Novo' | 'Contato' | 'Proposta' | 'Ganho' | 'Perdido'>('Novo');
  const [leadService, setLeadService] = useState('Computação em Nuvem');
  const [leadNotes, setLeadNotes] = useState('');

  // Task Form States
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskLeadId, setTaskLeadId] = useState('');

  // Filtering / Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('Todos');

  // WhatsApp Integration States
  const [whatsappLead, setWhatsappLead] = useState<CRMLead | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('intro');
  const [customMsgText, setCustomMsgText] = useState<string>('');

  // Dynamically assemble customized WhatsApp messages
  useEffect(() => {
    if (whatsappLead) {
      const sender = user?.displayName || 'Consultor Técnico';
      const valorFormatado = whatsappLead.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
      
      let text = '';
      if (selectedTemplate === 'intro') {
        text = `Olá ${whatsappLead.name}, tudo bem? Me chamo ${sender}, vi que você registrou interesse em nosso serviço de ${whatsappLead.service} para a empresa ${whatsappLead.company}. Gostaria de agendar uma breve chamada de diagnóstico de 15 minutos para entendermos os seus desafios corporativos?`;
      } else if (selectedTemplate === 'proposal') {
        text = `Olá ${whatsappLead.name}! Tudo bem? Gostaria de formalizar nossa proposta para o projeto de ${whatsappLead.service}, estimado em ${valorFormatado} para a ${whatsappLead.company}. Fico à disposição para esclarecer qualquer detalhe técnico sobre o escopo. Quando seria a melhor data para iniciarmos?`;
      } else if (selectedTemplate === 'followup') {
        text = `Olá ${whatsappLead.name}, espero que esteja bem! Estou passando para saber se você conseguiu analisar a proposta ou valores referentes ao serviço de ${whatsappLead.service} que conversamos anteriormente? Se precisar de algum ajuste ou detalhe adicional, conte comigo!`;
      } else {
        text = `Olá ${whatsappLead.name}, tudo bem? Gostaria de dar seguimento ao nosso contato sobre o suporte inovador em ${whatsappLead.service}. Como podemos progredir nas etapas de onboarding?`;
      }
      setCustomMsgText(text);
    }
  }, [whatsappLead, selectedTemplate, user]);

  const handleSendWhatsApp = async () => {
    if (!whatsappLead || !whatsappLead.phone) return;

    let cleanedPhone = whatsappLead.phone.replace(/\D/g, '');
    if (cleanedPhone.length === 0) {
      alert('Número de telefone inválido para o envio do WhatsApp.');
      return;
    }
    if (cleanedPhone.length <= 11) {
      cleanedPhone = '55' + cleanedPhone;
    }

    const whatsappUrl = `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(customMsgText)}`;
    
    try {
      const localTimeStr = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR');
      const actionLog = `[Contatado via WhatsApp em ${localTimeStr}]: "${customMsgText.substring(0, 60)}..."\n\n`;
      const updatedNotes = actionLog + (whatsappLead.notes || '');

      const docRef = doc(db, 'users', user.uid, 'crmLeads', whatsappLead.id);
      const nextStage = whatsappLead.stage === 'Novo' ? 'Contato' : whatsappLead.stage;
      
      await updateDoc(docRef, {
        stage: nextStage,
        notes: updatedNotes,
        updatedAt: localTimeStr
      });

      // Update state locally
      setLeads(prev => prev.map(l => l.id === whatsappLead.id ? { 
        ...l, 
        stage: nextStage, 
        notes: updatedNotes, 
        updatedAt: localTimeStr 
      } : l));
      
      // Auto-schedule follow-up todo
      const taskId = Math.random().toString(36).substring(2, 9);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);
      const dueDateStr = futureDate.toISOString().split('T')[0];

      const autoTask: CRMTask = {
        id: taskId,
        leadId: whatsappLead.id,
        description: `Follow-up comercial via WhatsApp com o Lead ${whatsappLead.name}`,
        dueDate: dueDateStr,
        completed: false,
        createdAt: new Date().toLocaleDateString('pt-BR')
      };
      
      const taskDocRef = doc(db, 'users', user.uid, 'crmTasks', taskId);
      await setDoc(taskDocRef, autoTask);
      setTasks(prev => [autoTask, ...prev]);

    } catch (e) {
      console.error('Error auto-updating lead contact status:', e);
    }

    window.open(whatsappUrl, '_blank');
    setWhatsappLead(null);
  };

  useEffect(() => {
    if (user) {
      fetchCRMData();
    }
  }, [user]);

  const fetchCRMData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Leads
      const leadsColRef = collection(db, 'users', user.uid, 'crmLeads');
      const leadsSnapshot = await getDocs(leadsColRef);
      const leadsData: CRMLead[] = [];
      leadsSnapshot.forEach((docSnap) => {
        const d = docSnap.data();
        leadsData.push({
          id: docSnap.id,
          name: d.name || '',
          company: d.company || 'Não especificada',
          email: d.email || '',
          phone: d.phone || '',
          value: parseFloat(d.value) || 0,
          stage: d.stage || 'Novo',
          service: d.service || 'Computação em Nuvem',
          notes: d.notes || '',
          updatedAt: d.updatedAt || ''
        });
      });
      setLeads(leadsData);

      // 2. Fetch Tasks
      const tasksColRef = collection(db, 'users', user.uid, 'crmTasks');
      const tasksSnapshot = await getDocs(tasksColRef);
      const tasksData: CRMTask[] = [];
      tasksSnapshot.forEach((docSnap) => {
        const d = docSnap.data();
        tasksData.push({
          id: docSnap.id,
          leadId: d.leadId || '',
          description: d.description || '',
          dueDate: d.dueDate || '',
          completed: !!d.completed,
          createdAt: d.createdAt || ''
        });
      });
      setTasks(tasksData);
    } catch (err) {
      console.error('Error fetching CRM data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Safe Form Open Helper
  const openLeadForm = (lead: CRMLead | null = null) => {
    if (lead) {
      setEditingLead(lead);
      setLeadName(lead.name);
      setLeadCompany(lead.company);
      setLeadEmail(lead.email);
      setLeadPhone(lead.phone);
      setLeadValue(lead.value);
      setLeadStage(lead.stage);
      setLeadService(lead.service);
      setLeadNotes(lead.notes);
    } else {
      setEditingLead(null);
      setLeadName('');
      setLeadCompany('');
      setLeadEmail('');
      setLeadPhone('');
      setLeadValue(1500);
      setLeadStage('Novo');
      setLeadService('Computação em Nuvem');
      setLeadNotes('');
    }
    setIsFormOpen(true);
  };

  // Lead Submission
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadEmail) return;

    const leadId = editingLead ? editingLead.id : Math.random().toString(36).substring(2, 9);
    const updatedTimestamp = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR');

    const newLead: CRMLead = {
      id: leadId,
      name: leadName,
      company: leadCompany || 'Individual',
      email: leadEmail,
      phone: leadPhone,
      value: Number(leadValue),
      stage: leadStage,
      service: leadService,
      notes: leadNotes,
      updatedAt: updatedTimestamp
    };

    try {
      const docRef = doc(db, 'users', user.uid, 'crmLeads', leadId);
      await setDoc(docRef, {
        ...newLead,
        // Make sure types comply with security rules
        value: Number(leadValue)
      });

      if (editingLead) {
        setLeads(prev => prev.map(l => l.id === leadId ? newLead : l));
      } else {
        setLeads(prev => [newLead, ...prev]);
      }
      setIsFormOpen(false);
    } catch (err) {
      console.error('Error saving lead:', err);
    }
  };

  // Delete Lead
  const handleDeleteLead = async (id: string) => {
    if (!confirm('Deseja realmente remover este lead?')) return;
    try {
      const docRef = doc(db, 'users', user.uid, 'crmLeads', id);
      await deleteDoc(docRef);
      setLeads(prev => prev.filter(l => l.id !== id));
      // Also clear tasks linked to this lead
      const linkedTasks = tasks.filter(t => t.leadId === id);
      for (const t of linkedTasks) {
        await deleteDoc(doc(db, 'users', user.uid, 'crmTasks', t.id));
      }
      setTasks(prev => prev.filter(t => t.leadId !== id));
    } catch (err) {
      console.error('Error deleting lead:', err);
    }
  };

  // Fast Phase Shift
  const shiftLeadStage = async (id: string, nextStage: 'Novo' | 'Contato' | 'Proposta' | 'Ganho' | 'Perdido') => {
    try {
      const docRef = doc(db, 'users', user.uid, 'crmLeads', id);
      await updateDoc(docRef, { stage: nextStage, updatedAt: new Date().toLocaleDateString('pt-BR') });
      setLeads(prev => prev.map(l => l.id === id ? { ...l, stage: nextStage, updatedAt: new Date().toLocaleDateString('pt-BR') } : l));
    } catch (e) {
      console.error(e);
    }
  };

  // Add Action Item CRM task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskDescription || !taskDueDate) return;

    const taskId = Math.random().toString(36).substring(2, 9);
    const newTask: CRMTask = {
      id: taskId,
      leadId: taskLeadId || undefined,
      description: taskDescription,
      dueDate: taskDueDate,
      completed: false,
      createdAt: new Date().toLocaleDateString('pt-BR')
    };

    try {
      const docRef = doc(db, 'users', user.uid, 'crmTasks', taskId);
      await setDoc(docRef, newTask);
      setTasks(prev => [newTask, ...prev]);
      setTaskDescription('');
      setTaskDueDate('');
      setTaskLeadId('');
    } catch (err) {
      console.error('Error saving task:', err);
    }
  };

  // Toggle Task Completion state
  const toggleTaskCompletion = async (taskId: string, currentStatus: boolean) => {
    try {
      const docRef = doc(db, 'users', user.uid, 'crmTasks', taskId);
      await updateDoc(docRef, { completed: !currentStatus });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !currentStatus } : t));
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Action Item
  const handleDeleteTask = async (taskId: string) => {
    try {
      const docRef = doc(db, 'users', user.uid, 'crmTasks', taskId);
      await deleteDoc(docRef);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (e) {
      console.error(e);
    }
  };

  // Calculated Metrics
  const totalLeads = leads.length;
  const totalRevenuePotential = leads.reduce((sum, l) => sum + l.value, 0);
  const closedWonRevenue = leads.filter(l => l.stage === 'Ganho').reduce((sum, l) => sum + l.value, 0);
  const lossRevenue = leads.filter(l => l.stage === 'Perdido').reduce((sum, l) => sum + l.value, 0);
  const activeOpportunities = leads.filter(l => l.stage !== 'Ganho' && l.stage !== 'Perdido').length;
  
  // Pipeline Stage Count Breakdown
  const stageCounts = {
    Novo: leads.filter(l => l.stage === 'Novo').length,
    Contato: leads.filter(l => l.stage === 'Contato').length,
    Proposta: leads.filter(l => l.stage === 'Proposta').length,
    Ganho: leads.filter(l => l.stage === 'Ganho').length,
    Perdido: leads.filter(l => l.stage === 'Perdido').length,
  };

  // Filters Leads
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      lead.company.toLowerCase().includes(searchQuery.toLowerCase()) || 
      lead.service.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStage = stageFilter === 'Todos' || lead.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const getStageBadgeColor = (stage: string) => {
    switch (stage) {
      case 'Novo': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Contato': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Proposta': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Ganho': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Perdido': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-8" id="crm-panel-wrapper">
      
      {/* 1. KPI Cards Dashboard Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="crm-metrics-grid">
        
        {/* KPI 1 */}
        <div className="p-5 border border-outline-variant bg-surface rounded-2xl flex items-start justify-between relative shadow-sm overflow-hidden group">
          <div className="space-y-1.5">
            <span className="text-xs font-mono font-bold text-outline uppercase tracking-wider block">Total Leads</span>
            <div className="flex items-baseline gap-2">
              <h4 className="font-sans font-black text-3xl text-primary">{totalLeads}</h4>
              <span className="text-xs text-secondary font-mono font-medium">{activeOpportunities} ativos</span>
            </div>
          </div>
          <div className="p-3 bg-secondary/15 rounded-xl text-secondary">
            <User className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-5 border border-outline-variant bg-surface rounded-2xl flex items-start justify-between relative shadow-sm overflow-hidden group">
          <div className="space-y-1.5">
            <span className="text-xs font-mono font-bold text-outline uppercase tracking-wider block">Projetado (Funil)</span>
            <div className="flex items-baseline gap-1">
              <h4 className="font-sans font-black text-3xl text-primary">
                {totalRevenuePotential.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              </h4>
            </div>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-700">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-5 border border-outline-variant bg-surface rounded-2xl flex items-start justify-between relative shadow-sm overflow-hidden group">
          <div className="space-y-1.5">
            <span className="text-xs font-mono font-bold text-outline uppercase tracking-wider block">Contratos Ganhos</span>
            <div className="flex items-baseline gap-1">
              <h4 className="font-sans font-black text-3xl text-emerald-800">
                {closedWonRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              </h4>
            </div>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-700">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-5 border border-outline-variant bg-surface rounded-2xl flex items-start justify-between relative shadow-sm overflow-hidden group">
          <div className="space-y-1.5 text-left">
            <span className="text-xs font-mono font-bold text-outline uppercase tracking-wider block">Taxa de Conversão</span>
            <div className="flex items-baseline gap-2">
              <h4 className="font-sans font-black text-3xl text-primary">
                {totalLeads > 0 ? Math.round((stageCounts.Ganho / totalLeads) * 100) : 0}%
              </h4>
              <span className="text-xs text-outline font-mono">de perdas</span>
            </div>
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-700">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. visual pipeline funnel chart */}
      <div className="p-6 border border-outline-variant bg-surface-container-low rounded-2xl space-y-4" id="crm-funnel-card">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div>
            <h5 className="font-sans font-bold text-base text-primary">Distribuição do Funil Comercial de Leads</h5>
            <p className="text-xs text-on-surface-variant">Siga a proporção de negócios por etapa do encadeamento comercial.</p>
          </div>
          <span className="text-xs font-semibold bg-secondary/10 px-2.5 py-1 text-secondary border border-secondary/20 rounded-md">
            Mapeado Real-Time
          </span>
        </div>

        {/* Horizontal Funnel Progress Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2" id="funnel-breakdown">
          {(['Novo', 'Contato', 'Proposta', 'Ganho', 'Perdido'] as const).map((stg) => {
            const count = stageCounts[stg];
            const maxVal = Math.max(...Object.values(stageCounts), 1);
            const percentage = Math.round((count / maxVal) * 100);
            
            return (
              <div key={stg} className="bg-surface border border-outline-variant/65 p-3.5 rounded-xl relative space-y-2 text-left">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-sans font-bold text-on-surface">{stg}</span>
                  <span className="font-mono text-[10px] bg-secondary-container text-on-secondary-container px-1.5 py-0.5 rounded-md font-extrabold">{count}</span>
                </div>
                {/* Custom Micro mini progress bar */}
                <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-700 ${
                      stg === 'Ganho' ? 'bg-emerald-500' : stg === 'Perdido' ? 'bg-red-400' : 'bg-secondary'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* WhatsApp Integration Hub Status Banner */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left" id="whatsapp-integration-banner">
        <div className="flex items-start gap-3">
          <span className="text-xl pt-0.5">⚡</span>
          <div>
            <h6 className="font-sans font-extrabold text-sm text-emerald-800">Integração Ativa: WhatsApp CRM Linker Pro</h6>
            <p className="text-xs text-emerald-700/90 leading-relaxed font-sans max-w-2xl">
              Dispare mensagens personalizadas de forma semi-automatizada utilizando nosso roteador inteligente. Ao contatar um lead por WhatsApp, o sistema atualiza de imediato o funil para a etapa <strong>"Contato"</strong>, anexa o histórico de data nas notas do cliente e cria um lembrete automático de reagendamento comercial na sua agenda.
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase tracking-widest">Linker API Ativada</span>
        </div>
      </div>

      {/* 3. Main CRM Action Nav Tabs */}
      <div className="flex border-b border-outline-variant" id="crm-view-switches">
        <button
          onClick={() => setActiveTab('leads')}
          className={`py-3 px-5 border-b-2 font-sans text-xs font-bold transition-all flex items-center gap-2 cursor-pointer outline-none ${
            activeTab === 'leads'
              ? 'border-secondary text-secondary'
              : 'border-transparent text-outline hover:text-secondary'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Gestão de Leads ({leads.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`py-3 px-5 border-b-2 font-sans text-xs font-bold transition-all flex items-center gap-2 cursor-pointer outline-none ${
            activeTab === 'tasks'
              ? 'border-secondary text-secondary'
              : 'border-transparent text-outline hover:text-secondary'
          }`}
        >
          <ListTodo className="w-4 h-4" />
          <span>Agenda de Ações ({tasks.filter(t => !t.completed).length} pendentes)</span>
        </button>
      </div>

      {/* 4. CRM CORE VIEW BODY */}
      <div id="crm-core-body">
        
        {/* VIEW A: Leads Hub */}
        {activeTab === 'leads' && (
          <div className="space-y-4" id="leads-container">
            
            {/* Search, Filter & Add Row */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center" id="leads-filter-row">
              
              {/* Search text filter */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                <input
                  type="text"
                  placeholder="Buscar Lead, Empresa ou Serviço"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-outline-variant focus:border-secondary rounded-xl text-xs bg-surface outline-none font-sans"
                />
              </div>

              {/* Stage buttons selector */}
              <div className="flex flex-wrap items-center gap-2" id="leads-stage-filters">
                <span className="text-[10px] font-mono font-semibold uppercase text-outline hidden md:inline">Status:</span>
                {['Todos', 'Novo', 'Contato', 'Proposta', 'Ganho', 'Perdido'].map((stg) => (
                  <button
                    key={stg}
                    onClick={() => setStageFilter(stg)}
                    className={`px-3 py-1.5 border rounded-lg text-xs font-sans transition-all cursor-pointer outline-none ${
                      stageFilter === stg
                        ? 'bg-secondary text-white border-secondary font-semibold'
                        : 'border-outline-variant hover:bg-surface-container-low text-on-surface-variant'
                    }`}
                  >
                    {stg}
                  </button>
                ))}
              </div>

              {/* Add Lead trigger */}
              <button
                onClick={() => openLeadForm(null)}
                className="py-2.5 px-4 bg-secondary text-on-secondary font-sans font-bold text-xs rounded-xl hover:bg-secondary/95 transition-all shadow-sm active:scale-95 cursor-pointer flex items-center justify-center gap-2 mt-2 sm:mt-0"
                id="btn-add-crm-lead"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Lead</span>
              </button>
            </div>

            {/* Leads Table Container */}
            {isLoading ? (
              <div className="py-12 text-center text-xs font-mono text-outline flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-secondary" />
                <span>Sincronizando Leads de Clientes com Firestore...</span>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-outline-variant rounded-2xl max-w-md mx-auto space-y-3">
                <p className="font-sans font-semibold text-sm text-primary">Nenhum Lead Encontrado</p>
                <p className="text-xs text-on-surface-variant">Comece adicionando novos contatos potenciais ao funil de vendas corporativas.</p>
                <button
                  onClick={() => openLeadForm(null)}
                  className="px-3.5 py-1.5 bg-secondary text-on-secondary rounded-lg font-sans text-xs font-extrabold inline-block"
                >
                  Criar Primeiro Lead
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3" id="crm-leads-stack-list">
                {filteredLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="p-5 border border-outline-variant bg-surface rounded-2xl hover:border-secondary transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 text-left shadow-sm relative group"
                  >
                    {/* Basic info lead */}
                    <div className="space-y-1.5 flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 border text-[9px] font-mono leading-none tracking-wider font-bold uppercase rounded-md ${getStageBadgeColor(lead.stage)}`}>
                          {lead.stage}
                        </span>
                        <span className="font-mono text-[10px] text-outline font-semibold">Atendimento em {lead.service}</span>
                      </div>
                      <div>
                        <h4 className="font-sans font-extrabold text-base text-primary">{lead.name}</h4>
                        <span className="text-xs text-on-surface-variant flex items-center gap-1 font-sans">
                          💼 <span>{lead.company}</span>
                        </span>
                      </div>
                    </div>

                    {/* Contact stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-on-surface-variant font-sans md:px-4 border-t md:border-t-0 md:border-x border-outline-variant/60 py-2 md:py-0">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-secondary" />
                        <span className="truncate">{lead.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Phone className="w-3.5 h-3.5 text-secondary animate-pulse" />
                        <span>{lead.phone || 'N/A'}</span>
                        {lead.phone && (
                          <button
                            onClick={() => setWhatsappLead(lead)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-[9px] font-extrabold px-1.5 py-0.5 rounded transition-all cursor-pointer flex items-center gap-0.5 shadow-sm shrink-0 ml-1.5 active:scale-95"
                            title="Disparar mensagem WhatsApp Inteligente"
                          >
                            <span className="text-[10px]">💬</span>
                            <span>Conectar</span>
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 sm:col-span-2 pt-1">
                        <FileText className="w-3.5 h-3.5 text-outline shrink-0" />
                        <span className="truncate font-sans italic text-outline" title={lead.notes}>
                          {lead.notes ? `"${lead.notes}"` : 'Sem anotações registradas.'}
                        </span>
                      </div>
                    </div>

                    {/* Price Tag, Fast Stage Change & Action Buttons */}
                    <div className="flex items-center justify-between md:justify-end gap-4 min-w-[220px]">
                      
                      {/* Price potential tag */}
                      <div className="text-left md:text-right">
                        <span className="text-[10px] font-mono font-bold uppercase text-outline tracking-wider block">Estimação Comercial</span>
                        <span className="font-sans font-black text-sm text-primary">
                          {lead.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                        </span>
                      </div>

                      {/* Quick stage cycle trigger */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openLeadForm(lead)}
                          className="p-2 border border-outline-variant hover:border-secondary hover:text-secondary rounded-lg transition-colors cursor-pointer"
                          title="Editar informações do Lead"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLead(lead.id)}
                          className="p-2 border border-outline-variant hover:border-red-200 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                          title="Remover Lead permanente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Fast Phase selectors inside lead lists bottom-level */}
                    <div className="absolute top-4 right-4 hidden group-hover:flex items-center gap-0.5 bg-surface p-1 shadow-md border border-outline-variant rounded-lg" id={`phase-cycle-${lead.id}`}>
                      {(['Novo', 'Contato', 'Proposta', 'Ganho', 'Perdido'] as const).map((ps) => (
                        <button
                          key={ps}
                          onClick={() => shiftLeadStage(lead.id, ps)}
                          disabled={lead.stage === ps}
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.5 border rounded cursor-pointer transition-colors ${
                            lead.stage === ps 
                              ? 'bg-secondary text-white border-secondary' 
                              : 'bg-surface-container-low hover:bg-surface-container border-outline-variant/60 text-on-surface-variant'
                          }`}
                        >
                          {ps}
                        </button>
                      ))}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW B: CRM Action Schedule Tasks */}
        {activeTab === 'tasks' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="tasks-layout-panel">
            
            {/* Task Add Form Box */}
            <div className="p-5 border border-outline-variant bg-surface rounded-2xl h-fit space-y-4" id="task-creator-panel">
              <h5 className="font-sans font-bold text-base text-primary flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-secondary" />
                <span>Registrar Nova Tarefa</span>
              </h5>

              <form onSubmit={handleAddTask} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono font-bold uppercase text-outline tracking-wider">Descrição do Follow-up</label>
                  <input
                    required
                    type="text"
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Ex: Ligar para Leonardo enviar contrato"
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg text-xs bg-surface focus:border-secondary outline-none font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-mono font-bold uppercase text-outline tracking-wider">Lembrete Vencimento</label>
                  <input
                    required
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg text-xs bg-surface focus:border-secondary outline-none font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-mono font-bold uppercase text-outline tracking-wider">Vincular a Lead Existente (Opcional)</label>
                  <select
                    value={taskLeadId}
                    onChange={(e) => setTaskLeadId(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg text-xs bg-surface focus:border-secondary outline-none font-sans"
                  >
                    <option value="">Nenhum lead associado</option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.company})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-secondary text-on-secondary font-sans font-bold text-xs rounded-lg hover:bg-secondary/95 transition-all shadow-sm active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar na Agenda</span>
                </button>
              </form>
            </div>

            {/* Tasks Lists Box */}
            <div className="md:col-span-2 space-y-4" id="tasks-tracker-panel">
              <div className="flex justify-between items-center text-left">
                <div>
                  <h5 className="font-sans font-bold text-base text-primary">Agenda de Lembretes & Tarefas</h5>
                  <p className="text-xs text-on-surface-variant">Acompanhe as ligações, reuniões comerciais e compromissos importantes de vendas.</p>
                </div>
              </div>

              {tasks.length === 0 ? (
                <div className="py-12 border border-dashed border-outline-variant rounded-2xl text-center text-xs text-on-surface-variant">
                  Não possui nenhuma tarefa comercial cadastrada na agenda.
                </div>
              ) : (
                <div className="space-y-2" id="tasks-todo-stack">
                  {tasks.map((tsk) => {
                    // Match bound lead
                    const boundLead = leads.find(l => l.id === tsk.leadId);
                    
                    return (
                      <div 
                        key={tsk.id}
                        className={`p-4 border rounded-xl flex items-start justify-between gap-3 text-left transition-all ${
                          tsk.completed 
                            ? 'bg-surface-container-low border-outline-variant/50 opacity-70' 
                            : 'bg-surface border-outline-variant'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => toggleTaskCompletion(tsk.id, tsk.completed)}
                            className="text-secondary hover:text-secondary-variant mt-0.5 shrink-0 focus:outline-none cursor-pointer"
                          >
                            {tsk.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <Square className="w-5 h-5 text-outline hover:text-secondary" />
                            )}
                          </button>

                          <div className="space-y-1">
                            <p className={`font-sans text-xs text-primary font-medium leading-relaxed ${tsk.completed ? 'line-through text-outline' : ''}`}>
                              {tsk.description}
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[9px] text-outline">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Vence em: {new Date(tsk.dueDate).toLocaleDateString('pt-BR')}</span>
                              </span>
                              
                              {boundLead && (
                                <span className="bg-secondary-container text-on-secondary-container px-1.5 py-0.5 rounded-md font-bold">
                                  Lead: {boundLead.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button 
                          onClick={() => handleDeleteTask(tsk.id)}
                          className="p-1 border border-outline-variant hover:border-red-200 text-outline hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                          title="Remover lembrete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* 5. FORM MODAL DETAILED LEAD (Create / Edit Modal) */}
      <AnimatePresence>
        {isFormOpen && (
          <div 
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsFormOpen(false)}
            id="lead-form-overlay"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              id="lead-form-content"
            >
              <div className="bg-primary text-white p-5 border-b border-outline-variant">
                <h4 className="font-sans font-bold text-lg">
                  {editingLead ? 'Editar Oportunidade Lead' : 'Cadastrar Lead Comercial'}
                </h4>
                <p className="text-xs text-white/75 mt-0.5">Preencha os campos para mapear este lead com acuidade de pipeline.</p>
              </div>

              <form onSubmit={handleLeadSubmit} className="p-6 space-y-4 text-left font-sans">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Lead Name */}
                  <div className="space-y-1">
                    <label className="block text-xs font-mono font-bold uppercase text-outline">Nome Completo</label>
                    <input
                      required
                      type="text"
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      placeholder="Ex: Amanda Mendes de Castro"
                      className="w-full px-3 py-2 border border-outline-variant bg-surface rounded-lg text-xs focus:border-secondary outline-none transition-colors"
                    />
                  </div>

                  {/* Company Name */}
                  <div className="space-y-1">
                    <label className="block text-xs font-mono font-bold uppercase text-outline">Empresa / Corporativo</label>
                    <input
                      type="text"
                      value={leadCompany}
                      onChange={(e) => setLeadCompany(e.target.value)}
                      placeholder="Ex: Grupo Hospitalar MedLife"
                      className="w-full px-3 py-2 border border-outline-variant bg-surface rounded-lg text-xs focus:border-secondary outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email */}
                  <div className="space-y-1">
                    <label className="block text-xs font-mono font-bold uppercase text-outline">E-mail Corporativo</label>
                    <input
                      required
                      type="email"
                      value={leadEmail}
                      onChange={(e) => setLeadEmail(e.target.value)}
                      placeholder="amanda@empresa.com"
                      className="w-full px-3 py-2 border border-outline-variant bg-surface rounded-lg text-xs focus:border-secondary outline-none transition-colors"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="block text-xs font-mono font-bold uppercase text-outline">Telefone / Canal Ativo</label>
                    <input
                      type="text"
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                      placeholder="(11) 98765-4321"
                      className="w-full px-3 py-2 border border-outline-variant bg-surface rounded-lg text-xs focus:border-secondary outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Potential value estimation */}
                  <div className="space-y-1 sm:col-span-1">
                    <label className="block text-xs font-mono font-bold uppercase text-outline">Valor Estimado (R$)</label>
                    <input
                      required
                      type="number"
                      value={leadValue}
                      onChange={(e) => setLeadValue(Number(e.target.value))}
                      placeholder="1500"
                      className="w-full px-3 py-2 border border-outline-variant bg-surface rounded-lg text-xs focus:border-secondary outline-none transition-colors"
                    />
                  </div>

                  {/* Pipeline Phase */}
                  <div className="space-y-1 sm:col-span-1">
                    <label className="block text-xs font-mono font-bold uppercase text-outline">Etapa Funil</label>
                    <select
                      value={leadStage}
                      onChange={(e) => setLeadStage(e.target.value as any)}
                      className="w-full px-3 py-1.5 border border-outline-variant bg-surface rounded-lg text-xs focus:border-secondary outline-none transition-colors"
                    >
                      <option value="Novo">Novo</option>
                      <option value="Contato">Contato</option>
                      <option value="Proposta">Proposta</option>
                      <option value="Ganho">Ganho</option>
                      <option value="Perdido">Perdido</option>
                    </select>
                  </div>

                  {/* Interested Tech Service */}
                  <div className="space-y-1 sm:col-span-1">
                    <label className="block text-xs font-mono font-bold uppercase text-outline">Serviço de Interesse</label>
                    <select
                      value={leadService}
                      onChange={(e) => setLeadService(e.target.value)}
                      className="w-full px-3 py-1.5 border border-outline-variant bg-surface rounded-lg text-xs focus:border-secondary outline-none transition-colors"
                    >
                      <option value="Computação em Nuvem">Nuvem Híbrida</option>
                      <option value="Cibersegurança Avançada">Cibersegurança</option>
                      <option value="Suporte Gerenciado">Suporte de TI</option>
                      <option value="Desenvolvimento de Software">Desenvolvimento</option>
                      <option value="Outro">Outro Serviço</option>
                    </select>
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="space-y-1">
                  <label className="block text-xs font-mono font-bold uppercase text-outline">Anotações do Cliente / Histórico</label>
                  <textarea
                    rows={3}
                    value={leadNotes}
                    onChange={(e) => setLeadNotes(e.target.value)}
                    placeholder="Necessita de alta performance multicloud e blindagem técnica contra ataques phishing..."
                    className="w-full px-3 py-2 border border-outline-variant bg-surface rounded-lg text-xs focus:border-secondary outline-none transition-colors"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 bg-surface-container border border-outline-variant rounded-lg text-xs font-sans font-bold cursor-pointer hover:bg-surface-container-high transition-colors text-on-surface"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-secondary text-on-secondary rounded-lg text-xs font-sans font-bold cursor-pointer hover:bg-secondary/95 transition-colors"
                  >
                    Salvar Oportunidade
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}

        {whatsappLead && (
          <div 
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setWhatsappLead(null)}
            id="whatsapp-template-overlay"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl relative overflow-hidden text-left"
              onClick={(e) => e.stopPropagation()}
              id="whatsapp-template-content"
            >
              <div className="bg-emerald-600 text-white p-5 border-b border-outline-variant">
                <h4 className="font-sans font-semibold text-lg flex items-center gap-2">
                  <span>💬</span>
                  <span>Roteador de Mensagens WhatsApp</span>
                </h4>
                <p className="text-xs text-white/80 mt-0.5">Selecione ou personalize a mensagem ideal para o lead <strong>{whatsappLead.name}</strong>.</p>
              </div>

              <div className="p-6 space-y-4 text-left font-sans">
                {/* Information Badge */}
                <div className="p-3.5 bg-emerald-50 border border-emerald-150 rounded-xl text-xs text-emerald-800 leading-relaxed">
                  <strong>Fluxo Automático Integrado:</strong> Ao disparar, o CRM avançará este Lead automaticamente para a etapa de <strong>"Contato"</strong>, anexará o histórico de envio nas notas detalhadas e criará uma tarefa de acompanhamento na sua agenda com prazo de 3 dias.
                </div>

                {/* Templates Selector */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono font-bold uppercase text-outline tracking-wider">Selecione o Modelo de Abordagem</label>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => setSelectedTemplate('intro')}
                      className={`p-3 border text-xs text-left rounded-xl transition-all cursor-pointer outline-none ${
                        selectedTemplate === 'intro'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold shadow-sm'
                          : 'border-outline-variant hover:bg-surface-container-low text-on-surface'
                      }`}
                    >
                      <span className="block font-sans font-bold text-xs text-emerald-800">1. Primeiro Contato (Apresentação)</span>
                      <span className="block text-[10px] text-outline mt-1 font-sans truncate">Olá {whatsappLead.name}, tudo bem? Me chamo...</span>
                    </button>

                    <button
                      onClick={() => setSelectedTemplate('proposal')}
                      className={`p-3 border text-xs text-left rounded-xl transition-all cursor-pointer outline-none ${
                        selectedTemplate === 'proposal'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold shadow-sm'
                          : 'border-outline-variant hover:bg-surface-container-low text-on-surface'
                      }`}
                    >
                      <span className="block font-sans font-bold text-xs text-emerald-800">2. Envio de Proposta Comercial</span>
                      <span className="block text-[10px] text-outline mt-1 font-sans truncate">Olá {whatsappLead.name}! Gostaria de formalizar nossa proposta...</span>
                    </button>

                    <button
                      onClick={() => setSelectedTemplate('followup')}
                      className={`p-3 border text-xs text-left rounded-xl transition-all cursor-pointer outline-none ${
                        selectedTemplate === 'followup'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold shadow-sm'
                          : 'border-outline-variant hover:bg-surface-container-low text-on-surface'
                      }`}
                    >
                      <span className="block font-sans font-bold text-xs text-emerald-800">3. Follow-up / Retorno Amigável</span>
                      <span className="block text-[10px] text-outline mt-1 font-sans truncate">Olá {whatsappLead.name}, passando para saber se conseguiu analisar...</span>
                    </button>
                  </div>
                </div>

                {/* Live Message Text Area */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono font-bold uppercase text-outline tracking-wider">Pré-visualização e Edição Manual</label>
                  <textarea
                    rows={4}
                    value={customMsgText}
                    onChange={(e) => setCustomMsgText(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant bg-surface rounded-lg text-xs font-sans focus:border-emerald-500 outline-none leading-relaxed"
                    placeholder="Escreva sua mensagem personalizada..."
                  />
                </div>

                {/* Confirm Buttons */}
                <div className="flex justify-end gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => setWhatsappLead(null)}
                    className="px-4 py-2 bg-surface-container border border-outline-variant rounded-lg text-xs font-sans font-bold cursor-pointer hover:bg-surface-container-high transition-colors text-on-surface"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-sans font-bold cursor-pointer hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <span>Disparar Mensagem</span>
                    <span>➔</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
