const API_URL = '/api/areas';

export interface Area {
    id: number;
    nombre: string;
    descripcion: string;
    contratista_id: number;
    contratista?: { id: number; nombre: string }; // Depending on what backend returns
    creadoEn: string;
}

export interface CreateAreaDto {
    nombre: string;
    descripcion?: string;
    contratista_id: number;
}

export interface AreaStats {
    total: number;
}

export const areasApi = {
    getAll: async () => {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Error al obtener áreas');
        return await response.json();
    },

    getById: async (id: number) => {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) throw new Error('Error al obtener área');
        return await response.json();
    },

    create: async (data: CreateAreaDto) => {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Error al crear área');
        return await response.json();
    },

    update: async (id: number, data: CreateAreaDto) => {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Error al actualizar área');
        return await response.json();
    },

    delete: async (id: number) => {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.message || 'Error al eliminar área');
        }
        return await response.json();
    }
};
