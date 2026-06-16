import { useCallback, useEffect, useState } from 'react';

const firmaKey = (userId: number | undefined) => `sgd_firma_${userId ?? 'anon'}`;

// `storage` solo se dispara entre pestañas distintas. Para que múltiples
// instancias del hook en la misma pestaña (p. ej. el expediente + un modal)
// se mantengan sincronizadas, emitimos también este evento custom.
const FIRMA_CHANGE_EVENT = 'sgd:firma-changed';

interface FirmaChangeDetail {
  key: string;
  value: string | null;
}

function broadcastFirmaChange(detail: FirmaChangeDetail) {
  window.dispatchEvent(new CustomEvent<FirmaChangeDetail>(FIRMA_CHANGE_EVENT, { detail }));
}

/**
 * useFirmaPersistida — fuente única para la firma digital del usuario (HU-11).
 *
 * Persiste en localStorage bajo `sgd_firma_{userId}` y sincroniza todas las
 * instancias activas (misma pestaña y entre pestañas) para que expediente,
 * UploadModal y FirmarDocumentoModal vean siempre el mismo valor.
 */
export function useFirmaPersistida(userId: number | undefined) {
  const key = firmaKey(userId);
  const [firma, setFirma] = useState<string | null>(null);

  useEffect(() => {
    setFirma(localStorage.getItem(key));

    const onStorage = (e: StorageEvent) => {
      if (e.key === key) setFirma(e.newValue);
    };
    const onLocal = (e: Event) => {
      const { detail } = e as CustomEvent<FirmaChangeDetail>;
      if (detail.key === key) setFirma(detail.value);
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(FIRMA_CHANGE_EVENT, onLocal);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(FIRMA_CHANGE_EVENT, onLocal);
    };
  }, [key]);

  const saveFirma = useCallback((dataUrl: string) => {
    localStorage.setItem(key, dataUrl);
    broadcastFirmaChange({ key, value: dataUrl });
  }, [key]);

  const removeFirma = useCallback(() => {
    localStorage.removeItem(key);
    broadcastFirmaChange({ key, value: null });
  }, [key]);

  return { firma, saveFirma, removeFirma };
}
