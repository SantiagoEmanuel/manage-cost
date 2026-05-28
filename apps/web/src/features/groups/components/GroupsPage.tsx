import { useState } from 'react';
import { PageMeta } from '@/shared/components/PageMeta';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Users, ChevronRight } from 'lucide-react';
import { groupsApi } from '../api/groups.api';
import { queryClient } from '@/shared/lib/query-client';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Modal } from '@/shared/components/Modal';
import { EmptyState } from '@/shared/components/EmptyState';
import { CardSkeleton } from '@/shared/components/SkeletonLoader';
import { toast } from '@/shared/components/Toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  description: z.string().optional(),
  currency: z.string().min(1),
});
type FormData = z.infer<typeof schema>;

export function GroupsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const { data: groups, isLoading } = useQuery({ queryKey: ['groups'], queryFn: groupsApi.list });
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { currency: 'USD' } });

  const createMutation = useMutation({
    mutationFn: groupsApi.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['groups'] }); setShowCreate(false); reset(); toast('success', 'Grupo creado'); },
    onError: () => toast('error', 'Error al crear grupo'),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageMeta title="Grupos" noindex />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Grupos</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gastos compartidos</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" />Nuevo</Button>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} lines={2} />)}
        </div>
      ) : groups?.length === 0 ? (
        <EmptyState icon={<Users className="h-12 w-12" />} title="Sin grupos" description="Creá un grupo para compartir gastos" action={<Button size="sm" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" />Crear grupo</Button>} />
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {groups?.map(g => (
            <Link key={g.id} to={`/groups/${g.id}`}>
              <Card className="hover:border-slate-700 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center text-violet-400">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-100">{g.name}</p>
                    <p className="text-xs text-slate-500">{g.members?.length ?? 0} miembro{(g.members?.length ?? 0) !== 1 ? 's' : ''} · {g.currency}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => { setShowCreate(false); reset(); }} title="Crear grupo">
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="flex flex-col gap-4">
          <Input label="Nombre" placeholder="Casa, Viaje, Amigos..." error={errors.name?.message} {...register('name')} />
          <Input label="Descripción (opcional)" placeholder="..." {...register('description')} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Moneda</label>
            <select className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500" {...register('currency')}>
              {['USD', 'ARS', 'EUR', 'BRL'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setShowCreate(false); reset(); }} className="flex-1">Cancelar</Button>
            <Button type="submit" loading={createMutation.isPending} className="flex-1">Crear</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
