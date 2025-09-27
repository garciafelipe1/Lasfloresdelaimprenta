import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { AddressForm } from './_components/address-form';

export default function CheckoutAddressStepPage() {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Dirección de envío</CardTitle>
        </CardHeader>
        <CardContent>
          <AddressForm />
        </CardContent>
      </Card>
      <Card className='px-4'>
        <p className='m-0'>Envío</p>
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
