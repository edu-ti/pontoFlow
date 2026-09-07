import React from 'react';
import { 
  LogIn, 
  Utensils, 
  Coffee, 
  LogOut, 
  Check, 
  Lock, 
  Loader2 
} from 'lucide-react';

export function PunchButtons({ ponto, onPunch, loadingPunch }) {
  const steps = [
    {
      tipo: 'entrada_expediente',
      numero: 1,
      titulo: '1. Entrada Expediente',
      descricao: 'Início da jornada de trabalho',
      icon: LogIn,
      valor: ponto?.entrada_expediente,
      isCompleted: !!ponto?.entrada_expediente,
      isReady: !ponto?.entrada_expediente,
      lockReason: null
    },
    {
      tipo: 'saida_almoco',
      numero: 2,
      titulo: '2. Saída Almoço',
      descricao: 'Início do intervalo intrajornada',
      icon: Utensils,
      valor: ponto?.saida_almoco,
      isCompleted: !!ponto?.saida_almoco,
      isReady: !!ponto?.entrada_expediente && !ponto?.saida_almoco,
      lockReason: !ponto?.entrada_expediente ? 'Aguardando Entrada' : null
    },
    {
      tipo: 'volta_almoco',
      numero: 3,
      titulo: '3. Volta Almoço',
      descricao: 'Retorno para o expediente da tarde',
      icon: Coffee,
      valor: ponto?.volta_almoco,
      isCompleted: !!ponto?.volta_almoco,
      isReady: !!ponto?.saida_almoco && !ponto?.volta_almoco,
      lockReason: !ponto?.saida_almoco ? 'Aguardando Saída Almoço' : null
    },
    {
      tipo: 'saida_expediente',
      numero: 4,
      titulo: '4. Fim do Expediente',
      descricao: 'Encerramento da jornada diária',
      icon: LogOut,
      valor: ponto?.saida_expediente,
      isCompleted: !!ponto?.saida_expediente,
      isReady: !!ponto?.volta_almoco && !ponto?.saida_expediente,
      lockReason: !ponto?.volta_almoco ? 'Aguardando Volta Almoço' : null
    }
  ];

  return (
    <div className="punch-grid" role="group" aria-label="Botões de registro de ponto">
      {steps.map((step) => {
        const IconComponent = step.icon;
        const isLoading = loadingPunch === step.tipo;

        let cardClass = 'punch-card';
        if (step.isCompleted) {
          cardClass += ' completed';
        } else if (step.isReady) {
          cardClass += ' ready';
        } else {
          cardClass += ' disabled';
        }

        return (
          <div key={step.tipo} className={cardClass}>
            <div className="punch-left">
              <div className="punch-number">
                {step.isCompleted ? <Check size={18} /> : step.numero}
              </div>

              <div className="punch-info">
                <div className="punch-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <IconComponent size={16} />
                  <span>{step.titulo}</span>
                </div>
                <div className="punch-sub">{step.descricao}</div>
              </div>
            </div>

            <div className="punch-right">
              {step.isCompleted ? (
                <div className="punch-stamp" title="Horário oficial registrado">
                  <Check size={16} />
                  <span>{step.valor}</span>
                </div>
              ) : step.isReady ? (
                <button
                  className="btn-punch-action"
                  onClick={() => onPunch(step.tipo)}
                  disabled={!!loadingPunch}
                  aria-label={`Bater ${step.titulo}`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Registrando...</span>
                    </>
                  ) : (
                    <>
                      <span>Bater Ponto</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="lock-badge">
                  <Lock size={14} />
                  <span>{step.lockReason}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
