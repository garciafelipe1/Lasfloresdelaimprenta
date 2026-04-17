import { authService } from '@/services/auth.service';
import { NextResponse } from 'next/server';

/**
 * Indica si hay cliente autenticado (cookie + Medusa).
 * Nunca debe tirar la app: si Medusa no responde, asumimos no logueado.
 */
export async function GET() {
  try {
    const user = await authService.getUser();
    return NextResponse.json({ loggedIn: !!user });
  } catch {
    return NextResponse.json({ loggedIn: false });
  }
}
