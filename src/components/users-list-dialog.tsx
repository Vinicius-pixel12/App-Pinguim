import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { users, type MockUser } from "@/lib/mock-data";

function sampleUsers(seed: string, count: number): MockUser[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const out: MockUser[] = [];
  const n = Math.min(count, 30);
  for (let i = 0; i < n; i++) {
    out.push(users[Math.abs((h + i * 17) % users.length)]);
  }
  return out;
}

export function UsersListDialog({
  open,
  onOpenChange,
  title,
  seed,
  count,
  onNavigate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  seed: string;
  count: number;
  onNavigate?: () => void;
}) {
  const list = sampleUsers(seed, count);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm gap-0 p-0">
        <DialogHeader className="border-b border-border p-4">
          <DialogTitle className="text-base">
            {title} <span className="text-muted-foreground">({count})</span>
          </DialogTitle>
        </DialogHeader>
        <ul className="max-h-[60vh] divide-y divide-border overflow-y-auto">
          {list.map((u, i) => (
            <li key={`${u.id}-${i}`}>
              <Link
                to="/perfil/$username"
                params={{ username: u.username }}
                onClick={() => {
                  onOpenChange(false);
                  onNavigate?.();
                }}
                className="flex items-center gap-3 p-3 hover:bg-muted"
              >
                <img src={u.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{u.name}</div>
                  <div className="truncate text-xs text-muted-foreground">@{u.username}</div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
