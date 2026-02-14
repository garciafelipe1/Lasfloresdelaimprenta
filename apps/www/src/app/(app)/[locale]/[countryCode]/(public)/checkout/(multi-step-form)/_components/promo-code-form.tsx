'use client';

import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { applyPromoCodeAction } from '@/app/actions/checkout/apply-promo-code.action';
import { removePromoCodeAction } from '@/app/actions/checkout/remove-promo-code.action';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type CartPromotion = { code?: string; id?: string };

interface Props {
  appliedPromotions: CartPromotion[] | null | undefined;
}

export function PromoCodeForm({ appliedPromotions }: Props) {
  const t = useTranslations('checkout');
  const router = useRouter();
  const [code, setCode] = useState('');
  const [state, setState] = useState<{ error: string | null }>({ error: null });
  const [isApplying, setIsApplying] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const applied = appliedPromotions?.length ? appliedPromotions : [];
  const hasPromo = applied.length > 0;
  const firstCode = applied[0]?.code ?? '';

  const handleApply = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setIsApplying(true);
    setState({ error: null });
    try {
      const result = await applyPromoCodeAction({ promoCode: trimmed });
      if (result?.data) {
        // Solo limpiar el código si se aplicó exitosamente
        setCode('');
        // Forzar recarga de la página para actualizar los totales
        router.refresh();
      }
    } catch (err: any) {
      const msg = err?.message;
      let errorMessage = t('promo.errorGeneric');
      
      if (msg === 'invalid_or_used') {
        errorMessage = t('promo.errorInvalid');
      } else if (msg === 'inactive') {
        errorMessage = t('promo.errorInactive');
      }
      
      setState({ error: errorMessage });
      // NO limpiar el código si hay error, para que el usuario pueda corregirlo
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    setState({ error: null });
    try {
      await removePromoCodeAction();
      // Forzar recarga de la página para actualizar los totales
      router.refresh();
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">{t('promo.label')}</label>
      {hasPromo ? (
        <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
          <span className="text-sm font-medium">{firstCode}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto text-xs"
            onClick={handleRemove}
            disabled={isRemoving}
          >
            {t('promo.remove')}
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder={t('promo.placeholder')}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApply())}
            className="flex-1"
            maxLength={50}
          />
          <Button
            type="button"
            size="sm"
            onClick={handleApply}
            disabled={!code.trim() || isApplying}
          >
            {t('promo.apply')}
          </Button>
        </div>
      )}
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
    </div>
  );
}
