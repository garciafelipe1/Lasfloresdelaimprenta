import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { cartService } from '@/services/cart.service';
import { EditCard } from '../_components/edit-card';
import { ShippingForm } from './_components/shipping-form';

export default async function CheckoutShippingStepPage() {
  const response = await cartService.getShippingOptions();

  return (
    <>
      <EditCard stepSlug='address' />
      <Card>
        <CardHeader>
          <CardTitle>Opciones de envío</CardTitle>
        </CardHeader>
        <CardContent>
          <ShippingForm shippingMethodsAvailables={response} />
        </CardContent>
      </Card>
      <Card className='px-4'>
        <p className='m-0'>Pago</p>
      </Card>
      <Card className='px-4'>
        <p className='m-0'>Resumen</p>
      </Card>
    </>
  );
}
