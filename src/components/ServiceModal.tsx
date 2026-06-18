import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Cloud, Shield, Headphones, Terminal, CheckCircle2, ArrowRight } from 'lucide-react';
import { ServiceDetail } from '../types';

interface ServiceModalProps {
  service: ServiceDetail | null;
  onClose: () => void;
  onSelectService: (serviceTitle: string) => void;
}

export default function ServiceModal({ service, onClose, onSelectService }: ServiceModalProps) {
  if (!service) return null;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'CloudDone':
        return <Cloud className="w-10 h-10 text-secondary" id="icon-cloud-modal" />;
      case 'Shield':
        return <Shield className="w-10 h-10 text-secondary" id="icon-shield-modal" />;
      case 'SupportAgent':
        return <Headphones className="w-10 h-10 text-secondary" id="icon-support-modal" />;
      case 'Terminal':
        return <Terminal className="w-10 h-10 text-secondary" id="icon-terminal-modal" />;
      default:
        return <Cloud className="w-10 h-10 text-secondary" id="icon-default-modal" />;
    }
  };

  const handleAction = () => {
    onSelectService(service.title);
    onClose();
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        id="service-modal-overlay"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-2xl overflow-hidden bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          id="service-modal-content"
        >
          {/* Header Banner */}
          {service.imageUrl && (
            <div className="relative h-44 w-full bg-cover bg-center overflow-hidden border-b border-outline-variant" id="service-modal-banner">
              <img 
                src={service.imageUrl} 
                alt={service.title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-black/50 text-white hover:bg-black/80 rounded-full transition-colors z-10"
                aria-label="Clean close modal button"
                id="btn-close-banner-modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {!service.imageUrl && (
            <div className="p-6 pb-0 flex justify-between items-start" id="service-modal-nobanner-header">
              <div className="p-3 bg-secondary/10 rounded-xl">
                {getIcon(service.icon)}
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors"
                aria-label="Close modal button"
                id="btn-close-nobanner"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Modal Main Content */}
          <div className="p-6 md:p-8 space-y-6" id="service-modal-inner-body">
            <div>
              <span className="font-mono text-label-sm text-secondary uppercase tracking-wider block mb-1">
                Serviço Viatix
              </span>
              <h3 className="font-sans font-bold text-2xl text-primary" id="modal-service-title">{service.title}</h3>
              <p className="mt-3 text-on-surface-variant text-body-md leading-relaxed" id="modal-service-long-desc">
                {service.longDescription}
              </p>
            </div>

            {/* Bullet List */}
            <div className="space-y-3" id="modal-service-bullets-container">
              <h4 className="font-sans font-semibold text-primary text-sm uppercase tracking-wider">
                Recursos Inclusos no Escopo
              </h4>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {service.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-on-surface-variant text-sm">
                    <CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tech stack badges */}
            {service.techStack && (
              <div className="space-y-2.5" id="modal-service-techs-container">
                <h4 className="font-sans font-semibold text-primary text-sm uppercase tracking-wider">
                  Tecnologias & Ferramentas
                </h4>
                <div className="flex flex-wrap gap-2">
                  {service.techStack.map((tech, idx) => (
                    <span 
                      key={idx} 
                      className="px-2.5 py-1 bg-surface-container text-on-surface-variant font-mono text-xs rounded-md"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* CTA panel */}
            <div className="pt-4 border-t border-outline-variant flex flex-col sm:flex-row justify-end items-center gap-3">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 font-sans font-medium text-sm text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors text-center"
                id="btn-modal-cancel"
              >
                Voltar
              </button>
              <button
                onClick={handleAction}
                className="w-full sm:w-auto px-5 py-2.5 bg-secondary text-on-secondary font-sans font-semibold text-sm rounded-lg hover:bg-secondary/90 shadow-md shadow-secondary/10 flex items-center justify-center gap-2 transition-all group"
                id="btn-modal-cta"
              >
                <span>Solicitar Proposta Sob Medida</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
