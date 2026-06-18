import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  User, 
  Building, 
  Mail, 
  Calendar, 
  Clock, 
  Activity, 
  FileText, 
  ShieldAlert, 
  ShieldCheck, 
  Compass, 
  LogOut, 
  RefreshCw,
  Terminal,
  Trash2,
  Briefcase
} from 'lucide-react';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { ContactSubmission } from '../types';
import CRMPanel from './CRMPanel';

interface AccessLog {
  id: string;
  action: string;
  timestamp: string;
  userAgent: string;
  status: string;
}

interface ClientDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onLogout: () => void;
  proposals: ContactSubmission[];
  onRemoveProposal: (id: string) => void;
  onRefreshProposals: () => void;
}

export default function ClientDashboard({ 
  isOpen, 
  onClose, 
  user, 
  onLogout, 
  proposals, 
  onRemoveProposal,
  onRefreshProposals
}: ClientDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<'perfil' | 'solicitacoes' | 'acessos' | 'crm'>('crm');
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<{ fullName: string; email: string; companyName: string; createdAt: string } | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchAccessLogs();
      fetchUserProfile();
    }
  }, [isOpen, user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    try {
      // Create user data default from profile state
      const defaultProfile = {
        fullName: user.displayName || 'Não especificado',
        email: user.email || '',
        companyName: 'Buscando informacoes...',
        createdAt: 'Não registrada'
      };

      setUserProfile(defaultProfile);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAccessLogs = async () => {
    if (!user) return;
    setIsLogsLoading(true);
    try {
      const accessesRef = collection(db, 'users', user.uid, 'accesses');
      const snapshot = await getDocs(accessesRef);
      const logs: AccessLog[] = [];
      snapshot.forEach((snapDoc) => {
        const data = snapDoc.data();
        logs.push({
          id: snapDoc.id,
          action: data.action || 'Login',
          timestamp: data.timestamp || '',
          userAgent: data.userAgent || 'Chrome / Safari',
          status: data.status || 'Sucesso'
        });
      });

      // Sort logs locally (newest first) to avoid index requirements
      logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      setAccessLogs(logs);
    } catch (err) {
      console.error('Error fetching access logs:', err);
    } finally {
      setIsLogsLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  // Custom UserAgent parser to keep it super readable for humans
  const parseBrowser = (ua: string) => {
    if (!ua) return 'Navegador Padrão';
    if (ua.includes('Firefox')) return 'Mozilla Firefox';
    if (ua.includes('Chrome')) return 'Google Chrome';
    if (ua.includes('Safari')) return 'Apple Safari';
    if (ua.includes('Edge')) return 'Microsoft Edge';
    return ua.substring(0, 30) + '...';
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
        id="client-dashboard-overlay"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 26, stiffness: 180 }}
          className="relative w-full max-w-6xl bg-surface-container-lowest border border-outline-variant rounded-3xl shadow-2xl overflow-hidden my-8"
          onClick={(e) => e.stopPropagation()}
          id="client-dashboard-content"
        >
          {/* Main Layout Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-8 py-6 border-b border-outline-variant bg-surface-container-low gap-4" id="dashboard-header">
            <div>
              <span className="font-mono text-[10px] text-secondary font-bold uppercase tracking-widest block">
                Painel do Gestor Tecnológico
              </span>
              <h3 className="font-sans font-extrabold text-2xl text-primary flex items-center gap-2">
                <span>Viatix Client Hub</span>
                <span className="text-xs bg-secondary/10 text-secondary border border-secondary/20 px-2 rounded-md font-bold">
                  SLA Ativo
                </span>
              </h3>
            </div>
            
            {/* Header buttons */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <button 
                onClick={onLogout}
                className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-xl font-sans font-bold text-xs flex items-center gap-1.5 transition-all outline-none cursor-pointer"
                id="btn-logout-dash"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Terminar Sessão</span>
              </button>
              
              <button 
                onClick={onClose} 
                className="p-1 px-3 border border-outline-variant text-on-surface-variant hover:bg-surface-container font-mono text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                id="btn-close-dash"
              >
                <span>Fechar</span>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Nav Sub Tabs inside Dashboard */}
          <div className="flex border-b border-outline-variant bg-surface px-8 font-sans text-xs font-semibold" id="dashboard-tabs">
            <button
              onClick={() => setActiveSubTab('crm')}
              className={`py-4 px-3.5 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer outline-none ${
                activeSubTab === 'crm' 
                  ? 'border-secondary text-secondary font-bold' 
                  : 'border-transparent text-on-surface-variant hover:text-secondary'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>CRM de Vendas</span>
            </button>

            <button
              onClick={() => setActiveSubTab('solicitacoes')}
              className={`py-4 px-3.5 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer outline-none ${
                activeSubTab === 'solicitacoes' 
                  ? 'border-secondary text-secondary font-bold' 
                  : 'border-transparent text-on-surface-variant hover:text-secondary'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Minhas Consultas ({proposals.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('acessos')}
              className={`py-4 px-3.5 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer outline-none ${
                activeSubTab === 'acessos' 
                  ? 'border-secondary text-secondary font-bold' 
                  : 'border-transparent text-on-surface-variant hover:text-secondary'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Historico de Acesso</span>
            </button>

            <button
              onClick={() => setActiveSubTab('perfil')}
              className={`py-4 px-3.5 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer outline-none ${
                activeSubTab === 'perfil' 
                  ? 'border-secondary text-secondary font-bold' 
                  : 'border-transparent text-on-surface-variant hover:text-secondary'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Dados Corporativos</span>
            </button>
          </div>

          {/* Dashboard Body Grid panels */}
          <div className="p-8 min-h-[380px] max-h-[500px] overflow-y-auto" id="dashboard-body-panel">
            
            {/* CRM Hub Panel */}
            {activeSubTab === 'crm' && (
              <CRMPanel user={user} />
            )}

            {/* 1. Requests / Consultas Sub-tab */}
            {activeSubTab === 'solicitacoes' && (
              <div className="space-y-6" id="panel-solicitacoes">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-sans font-bold text-lg text-primary">Pranchas de Soluções</h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">Siga o status do acompanhamento técnico dos ambientes em análise.</p>
                  </div>
                  <button 
                    onClick={onRefreshProposals}
                    className="p-2 border border-outline-variant hover:bg-surface-container rounded-lg text-on-surface-variant shrink-0"
                    title="Atualizar painel"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {proposals.length === 0 ? (
                  <div className="p-12 border border-dashed border-outline-variant rounded-2xl text-center space-y-4 max-w-lg mx-auto">
                    <div className="p-4 bg-surface-container rounded-full text-secondary w-fit mx-auto">
                      <Compass className="w-8 h-8" />
                    </div>
                    <div>
                      <h5 className="font-sans font-bold text-primary">Nenhum Ambiente em Análise</h5>
                      <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                        Preencha o formulário técnico da Viatix no portal para agendar a primeira simulação ambiental de cloud e cibersegurança avançada.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="consultation-dash-grid">
                    {proposals.map((prop) => (
                      <div 
                        key={prop.id}
                        className="p-5 border border-outline-variant hover:border-secondary bg-surface rounded-2xl relative space-y-4 transition-colors"
                      >
                        <button
                          onClick={() => onRemoveProposal(prop.id)}
                          className="absolute top-4 right-4 p-1.5 border border-outline-variant hover:border-red-200 text-outline hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                          title="Cancelar e remover proposta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="space-y-1 pr-8 text-left">
                          <span className="font-mono text-[9px] text-secondary font-bold uppercase tracking-wider block">
                            {prop.service}
                          </span>
                          <h5 className="font-sans font-bold text-primary truncate">{prop.fullName}</h5>
                        </div>

                        <div className="p-3 bg-surface-container-low rounded-xl text-xs text-on-surface-variant leading-relaxed italic border border-outline-variant/35 truncate">
                          "{prop.message}"
                        </div>

                        <div className="flex justify-between items-center text-xs font-mono">
                          <span className="text-outline text-[10px]">{prop.timestamp}</span>
                          <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-bold ${
                            prop.status === 'Agendado' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {prop.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 2. Access Logs / Histórico de Acesso Sub-tab */}
            {activeSubTab === 'acessos' && (
              <div className="space-y-6" id="panel-acessos">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-sans font-bold text-lg text-primary">Histórico de Acesso (Auditoria)</h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">Mapeamos todas as autenticações de sessão em tempo real em conformidade técnica com o marco civil e LGPD.</p>
                  </div>
                  <button 
                    onClick={fetchAccessLogs}
                    disabled={isLogsLoading}
                    className="p-2 border border-outline-variant hover:bg-surface-container rounded-lg text-on-surface-variant shrink-0"
                    title="Recarregar logs"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLogsLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {isLogsLoading ? (
                  <div className="py-12 text-center text-xs font-mono text-on-surface-variant">
                    Buscando logs de auditoria...
                  </div>
                ) : accessLogs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-on-surface-variant">
                    Nenhum log de acesso disponível.
                  </div>
                ) : (
                  <div className="border border-outline-variant rounded-2xl overflow-hidden bg-surface" id="access-logs-table-wrapper">
                    <table className="w-full text-left font-sans text-xs" id="access-logs-table">
                      <thead className="bg-surface-container-low border-b border-outline-variant text-[10px] font-bold font-mono uppercase tracking-wider text-on-surface-variant">
                        <tr>
                          <th className="px-5 py-3.5">Ação / Operação</th>
                          <th className="px-5 py-3.5">Dispositivo / Navegador</th>
                          <th className="px-5 py-3.5">Horário / Data</th>
                          <th className="px-5 py-3.5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/60">
                        {accessLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-surface-container-lowest">
                            <td className="px-5 py-3.5 flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${
                                log.action === 'Cadastro' ? 'bg-indigo-500' : log.action === 'Login' ? 'bg-emerald-500' : 'bg-red-500'
                              }`} />
                              <span className="font-sans font-bold text-primary">{log.action}</span>
                            </td>
                            <td className="px-5 py-3.5 font-mono text-on-surface-variant">
                              {parseBrowser(log.userAgent)}
                            </td>
                            <td className="px-5 py-3.5 text-on-surface-variant">
                              {log.timestamp}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <span className="px-2 py-0.5 bg-green-50 border border-green-200 rounded-md text-[10px] font-bold text-green-700">
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 3. Profile / Dados Corporativos Sub-tab */}
            {activeSubTab === 'perfil' && (
              <div className="space-y-6" id="panel-perfil">
                <div>
                  <h4 className="font-sans font-bold text-lg text-primary">Dados do Account Holder Viatix</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">As chaves de controle da segurança de infraestrutura do seu negócio.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="perfil-card-grid">
                  
                  {/* Account detail card 1 */}
                  <div className="p-6 border border-outline-variant bg-surface rounded-2xl flex items-start gap-4" id="perfil-info-user">
                    <div className="p-3 bg-secondary/10 rounded-xl text-secondary shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <span className="font-mono text-[10px] uppercase text-outline block">Responsável Principal</span>
                      <h5 className="font-sans font-bold text-primary text-base">{user.displayName || 'Não Configurado'}</h5>
                      <span className="text-xs text-on-surface-variant block">{user.email}</span>
                    </div>
                  </div>

                  {/* Account detail card 2 */}
                  <div className="p-6 border border-outline-variant bg-surface rounded-2xl flex items-start gap-4" id="perfil-info-enterprise">
                    <div className="p-3 bg-secondary/10 rounded-xl text-secondary shrink-0">
                      <Building className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 text-left">
                      <span className="font-mono text-[10px] uppercase text-outline block">Empresa Registrada</span>
                      <h5 className="font-sans font-bold text-primary text-base">Viatix Corporate Account</h5>
                      <div className="flex items-center gap-1.5 mt-1">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span className="font-mono text-[10px] text-emerald-700 font-bold">Diagnóstico em conformidade</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Additional SLA information banner */}
                <div className="p-5 bg-surface-container-low border border-outline-variant rounded-2xl flex gap-3 text-xs text-on-surface-variant" id="dashboard-disclaimer">
                  <Terminal className="w-6 h-6 text-secondary shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Sua conta está operando sob os limites de chaves criptográficas do sandbox da Viatix Technology Solutions. Para escalar a capacidade operacional ou solicitar canais diretos de engenharia sob demanda, por favor utilize o formulário de propostas.
                  </p>
                </div>
              </div>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
