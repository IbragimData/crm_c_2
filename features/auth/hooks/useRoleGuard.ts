'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/authStore';
import { Role } from '../types';

export function useRoleGuard(allowedRoles: Role[]) {
  const router = useRouter();
  const employee = useAuthStore((s) => s.employee);

  useEffect(() => {
    if (!employee) return; // ещё не загрузился
    if (!allowedRoles.includes(employee.role)) {
      // редирект на "нет доступа" или главную
      router.replace('/leads'); 
    }
  }, [employee, allowedRoles, router]);
}