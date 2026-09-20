import { toast } from 'sonner'

export function DashboardPage() {
  return (
    <main className='mx-auto max-w-xl p-8'>
      <h1 className='text-3xl font-bold'>School Board – Panel</h1>
      <button
        type='button'
        className='mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
        onClick={() => toast.success('Hello World')}
      >
        Kliknij
      </button>
    </main>
  )
}
