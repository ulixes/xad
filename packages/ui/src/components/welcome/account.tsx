import { useSelector } from '@xstate/react';
import { ActorRefFrom } from 'xstate';
import { accountMachine } from '../../../../apps/actions/src/machines/accountMachine';
import { cn } from '@/lib/utils';
import { ChevronRight, Loader2 } from 'lucide-react';

interface AccountProps {
  actor: ActorRefFrom<typeof accountMachine>;
  onClick?: (account: any) => void;
}

export function Account({ actor, onClick }: AccountProps) {
  const snapshot = useSelector(actor, s => s);
  const { context, value } = snapshot;
  const isVerifying = value === 'verifying';

  return (
    <button
      onClick={() => !isVerifying && onClick?.(context)}
      disabled={isVerifying}
      className={cn(
        'w-full bg-card transition-colors rounded-lg p-3 flex items-center justify-between group',
        isVerifying ? 'opacity-60 cursor-not-allowed' : 'hover:bg-accent'
      )}
    >
      <div className="flex flex-col items-start">
        <span className="font-medium">@{context.handle}</span>
        <span className="text-sm text-muted-foreground">
          {isVerifying
            ? 'Verifying...'
            : `${context.availableActions} available actions`}
        </span>
      </div>
      {isVerifying ? (
        <Loader2 className="h-5 w-5 animate-spin text-foreground" />
      ) : (
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      )}
    </button>
  );
}
