import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldAlert, CheckCircle, AlertTriangle, ChevronRight, HelpCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { QUIZ_QUESTIONS } from '../data';

interface RiskAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteAudit: (scorePercentage: number, message: string) => void;
}

export default function RiskAuditModal({ isOpen, onClose, onCompleteAudit }: RiskAuditModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [finished, setFinished] = useState(false);

  if (!isOpen) return null;

  const currentQuestion = QUIZ_QUESTIONS[currentStep];
  const maxSteps = QUIZ_QUESTIONS.length;

  const handleSelectOption = (score: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion.id]: score
    });
    setShowFeedback(true);
  };

  const handleNext = () => {
    setShowFeedback(false);
    if (currentStep < maxSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setFinished(true);
    }
  };

  const calculateResults = () => {
    let totalScore = 0;
    (Object.values(selectedAnswers) as number[]).forEach((score) => {
      totalScore += score;
    });

    const maxScore = maxSteps * 10;
    // Score % starts at 100% and decreases based on risk level
    const safetyPercentage = Math.round(((maxScore - totalScore) / maxScore) * 100);

    let riskLevel: 'Baixo' | 'Médio' | 'Inseguro' = 'Baixo';
    let riskColor = 'text-green-600 bg-green-50 border-green-200 dark:text-green-400';
    let riskDescription = '';

    if (safetyPercentage < 50) {
      riskLevel = 'Inseguro';
      riskColor = 'text-red-600 bg-red-50 border-red-200 dark:text-red-400';
      riskDescription = 'ALERTA CRÍTICO: Sua infraestrutura está vulnerável a vazamentos e sequestro de dados (Ransomware). É indicado obter auxílio técnico especializado de forma prioritária.';
    } else if (safetyPercentage < 80) {
      riskLevel = 'Médio';
      riskColor = 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400';
      riskDescription = 'ATENÇÃO: Sua operação possui falhas pontuais que expõem dados estratégicos. Recomendamos ajustar seus protocolos para impedir invasões e gargalos de segurança.';
    } else {
      riskLevel = 'Baixo';
      riskColor = 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400';
      riskDescription = 'Sua empresa segue boas práticas de segurança. Continue atualizando processos e refine acessos para manter o ambiente totalmente imutável.';
    }

    return {
      safetyPercentage,
      riskLevel,
      riskColor,
      riskDescription,
      totalScore
    };
  };

  const handleReset = () => {
    setCurrentStep(0);
    setSelectedAnswers({});
    setShowFeedback(false);
    setFinished(false);
  };

  const handleCompletePlan = () => {
    const { safetyPercentage, riskLevel } = calculateResults();
    const message = `Olá, gostaria de agendar uma consultorial especializada da Viatix para analisar minha infraestrutura. Realizei a Auditoria de Risco de Cibersegurança no site e minha Pontuação de Segurança foi de ${safetyPercentage}% (Nível de Risco: ${riskLevel}). Desejo agendar um diagnóstico técnico completo para mitigar vulnerabilidades e otimizar meus ambientes de trabalho.`;
    onCompleteAudit(safetyPercentage, message);
    onClose();
  };

  const results = finished ? calculateResults() : null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
        id="risk-audit-overlay"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          transition={{ type: 'spring', damping: 25, stiffness: 180 }}
          className="relative w-full max-w-xl bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl overflow-hidden my-8"
          onClick={(e) => e.stopPropagation()}
          id="risk-audit-content"
        >
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-5 border-b border-outline-variant bg-surface-container-low" id="risk-audit-header">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5.5 h-5.5 text-secondary shrink-0" />
              <h3 className="font-sans font-bold text-lg text-primary">Auditoria de Cibersegurança</h3>
            </div>
            <button 
              onClick={onClose}
              className="p-1 text-on-surface-variant hover:bg-surface-container rounded-full transition-all"
              aria-label="Close risk audit"
              id="btn-close-risk-audit"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 md:p-8" id="risk-audit-body">
            {!finished ? (
              <div className="space-y-6" id="risk-audit-running">
                {/* Progress bar info */}
                <div className="flex justify-between items-center text-xs font-mono text-on-surface-variant">
                  <span className="bg-secondary/10 text-secondary px-2.5 py-1 rounded-full font-bold">
                    Etapa {currentStep + 1} de {maxSteps}
                  </span>
                  <span>{currentQuestion.category}</span>
                </div>

                {/* Progress Bar Graphic */}
                <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-secondary h-1.5 transition-all duration-300 rounded-full" 
                    style={{ width: `${((currentStep + 1) / maxSteps) * 100}%` }}
                  />
                </div>

                {/* Question */}
                <div className="space-y-2">
                  <span className="font-mono text-xs text-secondary font-semibold uppercase tracking-wider">Pergunta Técnica</span>
                  <p className="font-sans font-semibold text-lg text-primary leading-snug">
                    {currentQuestion.text}
                  </p>
                </div>

                {/* Options List */}
                <div className="space-y-3">
                  {currentQuestion.options.map((option, idx) => {
                    const isSelected = selectedAnswers[currentQuestion.id] === option.score;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(option.score)}
                        className={`w-full text-left p-4 rounded-xl border text-sm font-sans transition-all duration-200 outline-none flex items-start gap-3 ${
                          isSelected
                            ? 'border-secondary bg-secondary/5 ring-2 ring-secondary/10'
                            : 'border-outline-variant hover:border-secondary hover:bg-surface-container-low'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full border shrink-0 flex items-center justify-center mt-0.5 text-xs font-bold transition-all ${
                          isSelected 
                            ? 'bg-secondary text-white border-secondary' 
                            : 'border-outline text-on-surface-variant hover:border-secondary'
                        }`}>
                          {idx === 0 ? 'A' : idx === 1 ? 'B' : 'C'}
                        </span>
                        <span className={`leading-relaxed ${isSelected ? 'text-primary font-semibold' : 'text-on-surface-variant'}`}>
                          {option.text}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Live Feedback explaining the choice */}
                <AnimatePresence>
                  {showFeedback && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className={`p-4 rounded-xl border text-sm font-sans flex items-start gap-3 ${
                        selectedAnswers[currentQuestion.id] === 0
                          ? 'bg-green-50 border-green-100 text-green-800'
                          : selectedAnswers[currentQuestion.id] === 5
                            ? 'bg-amber-50 border-amber-100 text-amber-800'
                            : 'bg-red-50 border-red-100 text-red-800'
                      }`}
                      id="live-feedback-box"
                    >
                      {selectedAnswers[currentQuestion.id] === 0 ? (
                        <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-1">
                        <span className="font-semibold block">Explicação Crítica:</span>
                        <p className="leading-relaxed">
                          {currentQuestion.options.find(o => o.score === selectedAnswers[currentQuestion.id])?.feedback}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation Button */}
                <div className="flex justify-end pt-2">
                  <button
                    disabled={selectedAnswers[currentQuestion.id] === undefined}
                    onClick={handleNext}
                    className={`px-5 py-3 font-sans font-semibold text-sm rounded-xl flex items-center gap-2 transition-all ${
                      selectedAnswers[currentQuestion.id] !== undefined
                        ? 'bg-primary text-on-primary hover:opacity-95 cursor-pointer shadow-md'
                        : 'bg-surface-container text-outline-variant cursor-not-allowed'
                    }`}
                    id="btn-next-risk-question"
                  >
                    <span>{currentStep === maxSteps - 1 ? 'Ver Diagnóstico Final' : 'Próxima Pergunta'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              results && (
                <div className="space-y-6" id="risk-audit-results">
                  {/* Results Heading */}
                  <div className="text-center space-y-2">
                    <span className="font-mono text-xs text-secondary font-bold uppercase tracking-widest">Diagnóstico Concluído</span>
                    <h4 className="font-sans font-bold text-2xl text-primary">Relatório de Saúde Digital</h4>
                  </div>

                  {/* Score Visualization */}
                  <div className="flex flex-col items-center justify-center py-4 bg-surface-container-low rounded-2xl border border-outline-variant space-y-3">
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      {/* Circle Track SVG */}
                      <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                        <circle 
                          cx="56" 
                          cy="56" 
                          r="48" 
                          className="text-surface-container-high stroke-current" 
                          strokeWidth="8"
                          fill="transparent"
                        />
                        <circle 
                          cx="56" 
                          cy="56" 
                          r="48" 
                          className={`stroke-current transition-all duration-1000 ease-out ${
                            results.safetyPercentage < 50 ? 'text-red-600' : results.safetyPercentage < 80 ? 'text-amber-500' : 'text-emerald-500'
                          }`} 
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 48}
                          strokeDashoffset={2 * Math.PI * 48 * (1 - results.safetyPercentage / 100)}
                        />
                      </svg>
                      {/* Percent Inside */}
                      <span className="font-sans font-bold text-3xl text-primary">{results.safetyPercentage}%</span>
                    </div>
                    <div className="text-center">
                      <span className="font-mono text-xs text-on-surface-variant block">Índice de Segurança Geral</span>
                      <div className="mt-1 flex items-center gap-1.5 justify-center">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                          results.safetyPercentage < 50 ? 'bg-red-600' : results.safetyPercentage < 80 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                        <span className="font-sans font-bold text-sm text-primary">
                          Vulnerabilidade: {results.riskLevel}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description of safety risk */}
                  <div className="p-4 bg-surface-container-lowest border border-outline-variant rounded-xl flex gap-3 text-sm font-sans leading-relaxed">
                    {results.safetyPercentage < 80 ? (
                      <ShieldAlert className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                    ) : (
                      <ShieldCheck className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
                    )}
                    <p className="text-on-surface-variant">
                      {results.riskDescription}
                    </p>
                  </div>

                  {/* Summary lists */}
                  <div className="space-y-2 text-xs font-mono text-on-surface-variant">
                    <span className="font-sans font-semibold text-primary text-sm tracking-wide block">Gargalos Identificados</span>
                    <div className="space-y-1.5">
                      {QUIZ_QUESTIONS.map((q) => {
                        const score = selectedAnswers[q.id];
                        const text = q.options.find(o => o.score === score)?.text || '';
                        return (
                          <div key={q.id} className="flex justify-between items-start border-b border-surface-container pb-2 last:border-0">
                            <span className="text-left max-w-xs">{q.category}</span>
                            <span className={`font-bold shrink-0 ml-4 ${score === 0 ? 'text-green-600' : score === 5 ? 'text-amber-600' : 'text-red-600'}`}>
                              {score === 0 ? 'Conforme' : score === 5 ? 'Alerta' : 'Crítico'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="pt-4 border-t border-outline-variant flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleReset}
                      className="w-full sm:w-1/3 px-4 py-3 font-sans font-semibold text-sm border border-outline-variant hover:bg-surface-container-low text-on-surface-variant rounded-xl transition-all text-center"
                      id="btn-restart-audit"
                    >
                      Refazer Teste
                    </button>
                    <button
                      onClick={handleCompletePlan}
                      className="w-full sm:w-2/3 px-5 py-3 bg-secondary text-on-secondary font-sans font-bold text-sm rounded-xl hover:bg-secondary/95 shadow-lg shadow-secondary/25 flex items-center justify-center gap-2 transition-all group"
                      id="btn-schedule-remediation"
                    >
                      <span>Preencher Consulta & Corrigir</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
