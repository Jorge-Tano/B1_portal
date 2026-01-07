// app/(global)/mis_anticipos/components/PendientesModal.tsx
import React from 'react';

interface PendientesModalProps {
    isOpen: boolean;
    onClose: () => void;
    pendientesCount: number;
}

const PendientesModal: React.FC<PendientesModalProps> = ({ 
    isOpen, 
    onClose, 
    pendientesCount 
}) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.3s ease'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
                maxWidth: '500px',
                width: '90%',
                textAlign: 'center',
                animation: 'slideIn 0.3s ease'
            }}>
                {/* Icono de advertencia */}
                <div style={{
                    marginBottom: '1.5rem',
                    color: '#e67e22',
                    fontSize: '3.5rem'
                }}>
                    ⚠️
                </div>
                
                {/* Título */}
                <h3 style={{
                    margin: '0 0 0.75rem 0',
                    color: '#2c3e50',
                    fontSize: '1.5rem',
                    fontWeight: '600'
                }}>
                    Anticipo Solicitado
                </h3>
                
                {/* Mensaje */}
                <p style={{
                    color: '#34495e',
                    marginBottom: '2rem',
                    lineHeight: '1.6',
                    fontSize: '1rem'
                }}>
                    Ya tienes <strong style={{ color: '#e74c3c' }}>{pendientesCount}</strong> 
                    {pendientesCount === 1 ? ' anticipo solicitado' : ' anticipos solicitados'} este mes.
                    <br />
                    No puedes solicitar otro anticipo hasta que se procese el actual.
                </p>
                
                {/* Botón de cierre */}
                <button
                    onClick={onClose}
                    style={{
                        backgroundColor: '#3498db',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 2rem',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease',
                        width: '100%'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2980b9'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3498db'}
                >
                    Entendido
                </button>
            </div>
            
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes slideIn {
                    from { 
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default PendientesModal;