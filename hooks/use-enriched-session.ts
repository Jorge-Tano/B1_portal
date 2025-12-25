// hooks/use-enriched-session.ts
"use client";

import { useSession as useNextAuthSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";

export function useEnrichedSession() {
    const { data: session, status, update } = useNextAuthSession();
    const [refreshing, setRefreshing] = useState(false);

    /**
     * Refrescar datos de la base de datos
     */
    const refreshDbData = async () => {
        if (!session?.user?.id) return null;
        
        setRefreshing(true);
        try {
            // Llamar a API route para refrescar datos
            const response = await fetch('/api/auth/refresh-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: session.user.id })
            });

            const data = await response.json();
            
            if (data.success && data.user) {
                // Actualizar sesión con nuevos datos
                await update({ dbUser: data.user });
                return data.user;
            }
            
            return null;
        } catch (error) {
            console.error("Error refrescando datos:", error);
            return null;
        } finally {
            setRefreshing(false);
        }
    };

    /**
     * Verificar si el usuario tiene un rol específico
     */
    const hasRole = (requiredRole: string): boolean => {
        if (!session?.user?.dbUser?.role) return false;
        return session.user.dbUser.role === requiredRole;
    };

    /**
     * Verificar si el usuario tiene acceso a una campaña específica
     */
    const hasCampaignAccess = (campaignId: number): boolean => {
        if (!session?.user?.dbUser) return false;
        
        // Administradores tienen acceso a todo
        if (session.user.dbUser.role === 'admin') return true;
        
        return session.user.dbUser.campaign_id === campaignId;
    };

    return {
        session: session as any, // Con tipos extendidos
        status,
        refreshing,
        refreshDbData,
        hasRole,
        hasCampaignAccess,
        signOut
    };
}