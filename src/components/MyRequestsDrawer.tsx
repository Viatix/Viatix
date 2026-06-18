import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, User, Mail, MessageSquare, Trash2, CalendarCheck2, ArrowRight } from 'lucide-react';
import { ContactSubmission } from '../types';

interface MyRequestsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  requests: ContactSubmission[];
  onRemoveRequest: (id: string) => void;
}

export default function MyRequestsDrawer({ isOpen, onClose, requests, onRemoveRequest }: MyRequestsDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay mask */}
          <div 
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs"
            onClick={onClose}
            id="my-requests-overlay"
          />

          {/* Drawer content */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
            className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-surface-container-lowest border-l border-outline-variant shadow-2xl flex flex-col"
            id="my-requests-drawer"
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low" id="requests-drawer-header">
              <div className="flex items-center gap-2">
                <CalendarCheck2 className="w-5.5 h-5.5 text-secondary" />
                <h3 className="font-sans font-bold text-lg text-primary">Minhas Solicitações ({requests.length})</h3>
              </div>
              <button 
                onClick={onClose} 
                className="p-1 px-2.5 rounded-lg border border-outline-variant hover:bg-surface-container text-on-surface-variant font-mono text-xs font-semibold flex items-center gap-1"
                id="btn-close-requests-drawer"
              >
                <span>Fechar</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4" id="requests-drawer-body">
              {requests.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4" id="requests-empty-state">
                  <div className="p-4 bg-surface-container rounded-full text-outline">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-sans font-semibold text-primary">Nenhuma Solicitação</h4>
                    <p className="mt-1 text-sm text-on-surface-variant max-w-xs">
                      Preencha o formulário de consultoria ou selecione um de nossos planos para iniciar sua jornada tecnológica com a Viatix.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 font-sans" id="requests-list">
                  <p className="text-xs font-mono text-on-surface-variant uppercase tracking-wider block">
                    Acompanhamento de Atendimento
                  </p>
                  
                  {requests.map((request) => (
                    <div 
                      key={request.id} 
                      className="border border-outline-variant hover:border-secondary bg-surface rounded-xl p-4.5 space-y-3 transition-colors relative"
                    >
                      {/* Delete button */}
                      <button
                        onClick={() => onRemoveRequest(request.id)}
                        className="absolute top-4 right-4 p-1.5 text-outline hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors"
                        title="Cancelar solicitação"
                        aria-label="Delete request"
                        id={`btn-delete-request-${request.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {/* Header info */}
                      <div className="space-y-1 pr-6">
                        <span className="font-mono text-[10px] text-secondary font-bold uppercase tracking-widest block">
                          {request.service}
                        </span>
                        <h4 className="font-semibold text-primary truncate text-base">{request.fullName}</h4>
                      </div>

                      {/* Info cards fields */}
                      <div className="space-y-2 text-xs text-on-surface-variant">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{request.email}</span>
                        </div>
                        <div className="flex items-start gap-2 max-h-16 overflow-hidden">
                          <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <p className="leading-normal line-clamp-2 truncate whitespace-normal font-sans italic">{request.message}</p>
                        </div>
                      </div>

                      {/* Bottom status */}
                      <div className="pt-3 border-t border-outline-variant/60 flex justify-between items-center">
                        <span className="font-mono text-[10px] text-outline">
                          {request.timestamp}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wide border ${
                          request.status === 'Agendado' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Panel */}
            <div className="p-6 border-t border-outline-variant bg-surface-container-low text-center space-y-1.5" id="requests-drawer-footer">
              <p className="font-mono text-xs text-on-surface-variant">
                Nosso suporte entrará em contato via e-mail corporativo.
              </p>
              <p className="text-[10px] text-outline">
                Suas informações comerciais estão seguras sob as políticas de LGPD da Viatix.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
