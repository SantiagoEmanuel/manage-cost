import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { toast } from '@/shared/components/Toast';
import { PageMeta } from '@/shared/components/PageMeta';

const schema = z.object({
  email: z.string().email('Email inválido'),
  username: z.string().min(3, 'Mínimo 3 caracteres').max(30).regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guiones bajos'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});
type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const { mutate, isPending } = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      toast('success', '¡Cuenta creada! Iniciá sesión.');
      navigate('/login');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => toast('error', err.response?.data?.message ?? 'Error al registrarse'),
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <PageMeta
        title="Crear cuenta"
        description="Registrate gratis en ManageCost y empezá a controlar tus gastos personales y compartidos con amigos y familia."
        canonicalPath="/register"
      />
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-violet-600 mb-4">
            <span className="text-2xl">💸</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Crear cuenta</h1>
          <p className="text-sm text-slate-500 mt-1">Empezá a controlar tus gastos</p>
        </div>

        <form onSubmit={handleSubmit(data => mutate(data))} className="flex flex-col gap-4">
          <Input label="Email" type="email" placeholder="tu@email.com" error={errors.email?.message} {...register('email')} />
          <Input label="Usuario" placeholder="juanperez" error={errors.username?.message} {...register('username')} />
          <Input label="Contraseña" type="password" placeholder="Mínimo 8 caracteres" error={errors.password?.message} {...register('password')} />
          <Button type="submit" loading={isPending} className="w-full mt-2">
            Crear cuenta
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
