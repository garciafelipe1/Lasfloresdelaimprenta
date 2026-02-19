import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/services/user.service';

export async function PUT(request: NextRequest) {
  try {
    const result = await userService.cancelSubscription();
    return NextResponse.json(result);
  } catch (error: any) {
    const status = error.message === 'No autorizado' ? 401 : 
                  error.message === 'No se encontró una suscripción activa para cancelar' ? 404 : 500;
    
    return NextResponse.json(
      { error: error.message || 'Error al cancelar la suscripción' },
      { status }
    );
  }
}

