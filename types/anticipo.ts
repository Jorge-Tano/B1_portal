// types/anticipo.ts
export interface Anticipo {
  id: number;
  employeeid: string;
  monto: number;
  fecha_solicitud: string;
  estado: string;
  usuario_nombre: string;
  usuario_employeeid: string;
  departamento?: string;
  datos_bancarios?: {
    numero_cuenta?: string;
    banco_nombre?: string;
    tipo_cuenta?: string;
    numero_documento?: string;
    email?: string;
    celular?: string;
    codigo_banco?: string;
    tipo_documento?: string;
  };
}

// Para el formato bancario
export interface FormatoPABRow {
  NIT_PAGADOR: string;
  TIPO_DE_PAGO: string;
  APLICACION: string;
  SECUENCIA_DE_ENVIO: string;
  NRO_CUENTA_A_DEBITAR: string;
  TIPO_DE_CUENTA_A_DEBITAR: string;
  DESCRIPCION_DEL_PAGO: string;
}

export interface BeneficiarioRow {
  TIPO_DOCUMENTO_BENEFICIARIO: string;
  NIT_BENEFICIARIO: string;
  NOMBRE_BENEFICIARIO: string;
  TIPO_TRANSACCION: string;
  CODIGO_BANCO: string;
  NO_CUENTA_BENEFICIARIO: string;
  EMAIL: string;
  DOCUMENTO_AUTORIZADO: string;
  REFERENCIA: string;
  CELULAR_BENEFICIARIO: string;
  VALOR_TRANSACCION: number;
  FECHA_DE_APLICACION: string;
}