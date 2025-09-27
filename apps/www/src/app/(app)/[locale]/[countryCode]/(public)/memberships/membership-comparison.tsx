'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MembershipId } from '@server/constants';
import { Check, X } from 'lucide-react';
import { membershipColors } from './constants';

const comparison = {
  frequency: {
    label: 'Frecuencia de entrega',
    esencial: '1 vez por semana',
    premium: '1 vez por semana',
    elite: '1 vez por semana',
  },
  bouquetSize: {
    label: 'Tamaño del ramo',
    esencial: 'S',
    premium: 'M',
    elite: 'XL',
  },
  flowerType: {
    label: 'Tipo de flores',
    esencial: 'Flores de temporada',
    premium: 'Flores premium + follajes aromáticos',
    elite: 'Flores supremas + cromoterapia',
  },
  candle: {
    label: 'Velas aromáticas',
    esencial: '1 vela aromática por mes',
    premium: '1 vela grande aromática por mes',
    elite: '1 vela grande artesanal por mes',
  },
  fragrance: {
    label: 'Fragancias aromáticas',
    esencial: '—',
    premium: '1 fragancia grande',
    elite: '2 fragancias grandes',
  },
  vases: {
    label: 'Floreros incluidos',
    esencial: '—',
    premium: 'Primer y tercer envío',
    elite: 'Primer y tercer envío',
  },
  loyaltyCard: {
    label: 'Tarjeta de lealtad',
    esencial: 'Virtual, con recompensas',
    premium: 'Virtual, beneficios especiales',
    elite: 'Virtual, beneficios exclusivos',
  },
  support: {
    label: 'Atención personalizada',
    esencial: '—',
    premium: 'Soporte privado',
    elite: 'Consultoría VIP + artista floral',
  },
  exclusiveProducts: {
    label: 'Propuestas de productos únicos',
    esencial: 'No',
    premium: 'Sí',
    elite: 'Sí',
  },
  customization: {
    label: 'Personalización de arreglos',
    esencial: 'No',
    premium: 'Según consumo mensual',
    elite: 'Total, con asesoramiento floral',
  },
  idealFor: {
    label: 'Ideal para',
    esencial: 'Quienes quieren empezar con flores',
    premium: 'Amantes del bienestar y el detalle',
    elite: 'Espacios elegantes y únicos',
  },
  price: {
    label: 'Precio mensual (ARS)',
    esencial: '$110.000',
    premium: '$185.000',
    elite: '$285.000',
  },
};

function renderValue(value: string, feature: string) {
  if (value === '—' || value === 'No') {
    return (
      <div className='flex items-center justify-center'>
        <X className='h-4 w-4 text-red-500' />
      </div>
    );
  }

  if (value === 'Sí') {
    return (
      <div className='flex items-center justify-center'>
        <Check className='h-4 w-4 text-green-500' />
      </div>
    );
  }

  if (feature === 'bouquetSize') {
    return (
      <Badge
        variant='outline'
        className='font-semibold'
      >
        {value}
      </Badge>
    );
  }

  return <span className='text-sm'>{value}</span>;
}

const plans: MembershipId[] = ['esencial', 'premium', 'elite'];

export default function MembershipsComparison() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* Desktop Table */}
      <div className='hidden lg:block'>
        <div className='overflow-hidden rounded-lg border'>
          <table className='w-full'>
            <thead>
              <tr className='bg-muted/50 border-b'>
                <th className='p-4 text-left font-semibold'>Características</th>
                {plans.map((plan) => (
                  <th
                    key={plan}
                    className={`p-4 text-center ${membershipColors[plan].bg}`}
                  >
                    <Badge
                      className={`capitalize ${membershipColors[plan].accent}`}
                    >
                      {plan}
                    </Badge>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(comparison).map(([key, feature], index) => (
                <tr
                  key={key}
                  className={`border-b ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
                >
                  <td className='p-4 text-sm font-medium'>{feature.label}</td>
                  {plans.map((plan) => (
                    <td
                      key={plan}
                      className='p-4 text-center'
                    >
                      {key === 'price' ? (
                        <div className='text-primary text-lg font-bold'>
                          {feature[plan]}
                        </div>
                      ) : (
                        renderValue(feature[plan], key)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className='border-b'>
                <td className='p-4'></td>
                {plans.map((plan) => (
                  <td
                    key={plan}
                    className='p-4 text-center'
                  >
                    <Button
                      className={`w-full ${
                        plan === 'esencial'
                          ? 'bg-slate-600 hover:bg-slate-700'
                          : plan === 'premium'
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-purple-600 hover:bg-purple-700'
                      }`}
                      onClick={() => scrollToSection(plan)}
                    >
                      Elegir Plan
                    </Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className='space-y-6 lg:hidden'>
        {plans.map((plan) => (
          <Card
            key={plan}
            className={`${membershipColors[plan].bg}`}
          >
            <CardHeader className='text-center'>
              <CardTitle className='flex items-center justify-center gap-2'>
                <Badge className={membershipColors[plan].accent}>{plan}</Badge>
              </CardTitle>
              <div className='text-primary text-2xl font-bold'>
                {comparison.price[plan]}
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              {Object.entries(comparison).map(([key, feature]) => {
                if (key === 'price') return null;
                return (
                  <div
                    key={key}
                    className='border-muted flex items-center justify-between border-b py-2'
                  >
                    <span className='text-muted-foreground text-sm font-medium'>
                      {feature.label}
                    </span>
                    <div className='max-w-[60%] text-right'>
                      {renderValue(feature[plan], key)}
                    </div>
                  </div>
                );
              })}
              <div className='mt-4 border-t pt-4'>
                <Button
                  className={`w-full ${
                    plan === 'esencial'
                      ? 'bg-slate-600 hover:bg-slate-700'
                      : plan === 'premium'
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                  onClick={() => scrollToSection(plan)}
                >
                  Elegir Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
