export interface AdvanceAPI {
    id: number;
    employeeid: string;
    amount_id?: number;
    amount?: number;
    monto?: number; 
    request_date: string;
    status: string;
    agreement_pdf_url?: string;
    agreement_signed_at?: string;
    created_at?: string;
    updated_at?: string;
    user_name?: string;
    user_email?: string;
    user_department?: string;
    user_documenttype?: number;
    user_banknumber?: string;
}

export interface MontoConfig {
    id: number;
    monto: number;
    descripcion?: string;
    activo: boolean;
}

export interface Anticipo {
    id: number;
    employeeid: string;
    monto: number;
    fecha_solicitud: string;
    estado: string;
    pdf_url?: string;
    fecha_firma?: string;
    usuario_nombre?: string;
    usuario_email?: string;
    usuario_departamento?: string;
    usuario_documenttype?: number;
    usuario_banknumber?: string;
}

export interface BankInfo {
    hasBankAccount?: boolean;
    bankAccount?: string;
    bankName?: string;
    employeeId?: string;
    user_documenttype?: number;
    user_banknumber?: string;
}

export interface UserData {
    employeeid: string;
    name: string;
    email: string;
    department: string;
    documenttype: number;
    banknumber: string;
    documentType?: string;
}

export interface AmountConfig {
    id: number;
    amount: number;
    description?: string;
    active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface DBUser {
    id: number;
    employeeid: string;
    name: string;
    email: string | null;
    ou: string | null;
    document_type: number | null;
    bank_account: string | null;
    bank_number: number | null;
    role: string | null;
    telephone: string | null;
    mobile: string | null;
    created_at: Date | null;
    updated_at: Date | null;
}