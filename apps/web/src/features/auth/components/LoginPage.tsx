import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../auth.store';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { toast } from '@/shared/components/Toast';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});
type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore(s => s.setUser);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const { mutate, isPending } = useMutation({
    mutationFn: authApi.login,
    onSuccess: (user) => {
      setUser(user);
      navigate('/dashboard');
    },
    onError: () => toast('error', 'Credenciales incorrectas'),
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-violet-600 mb-4">
            <span className="text-2xl">💸</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Bienvenido</h1>
          <p className="text-sm text-slate-500 mt-1">Ingresá a tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit(data => mutate(data))} className="flex flex-col gap-4">
          <Input label="Email" type="email" placeholder="tu@email.com" error={errors.email?.message} {...register('email')} />
          <Input label="Contraseña" type="password" placeholder="••••••••" error={errors.password?.message} {...register('password')} />
          <Button type="submit" loading={isPending} className="w-full mt-2">
            Iniciar sesión
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          ¿No tenés cuenta?{' '}
          <Link to="/register" className="text-violet-400 hover:text-violet-300 font-medium">
            Registrate
          </Link>
        </p>
      </div>
    </div>
  );
}
