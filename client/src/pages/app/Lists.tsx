import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const LIST_TYPES = [
  { value: "bucket", label: "🪣 Bucket List", color: "var(--sapphire)" },
  { value: "grocery", label: "🛒 Grocery", color: "var(--peridot)" },
  { value: "movies", label: "🎦 Movies", color: "var(--amethyst)" },
  { value: "travel", label: "✈️ Travel", color: "var(--midas-gold)" },
  { value: "goals", label: "🎯 Goals", color: "var(--neon-spark)" },
  { value: "custom", label: "📝 Custom", color: "var(--emerald)" },
];

export default function Lists() {
  const [newListTitle, setNewListTitle] = useState("");
  const [newListType, setNewListType] = useState("bucket");
  const [showNewList, setShowNewList] = useState(false);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState("");

  const { data: lists, refetch } = trpc.lists.all.useQuery();
  const createList = trpc.lists.create.useMutation({
    onSuccess: () => { refetch(); setNewListTitle(""); setShowNewList(false); toast.success("List created! 📝"); },
    onError: (e) => toast.error(e.message),
  });
  const addItem = trpc.lists.addItem.useMutation({
    onSuccess: () => { refetch(); setNewItem(""); toast.success("Item added!"); },
    onError: (e) => toast.error(e.message),
  });
  const toggleItem = trpc.lists.toggleItem.useMutation({
    onSuccess: () => refetch(),
  });

  const activeList = lists?.find((l: { id: string }) => l.id === activeListId);

  return (
    <div className="flex flex-col min-h-screen pb-24" style={{ background: "var(--background)" }}>
      <div className="px-4 pt-8 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Candara, sans-serif", color: "var(--sapphire)" }}>
            📋 Shared Lists
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            Bucket lists, goals, and more
          </p>
        </div>
        <button onClick={() => setShowNewList(!showNewList)}
          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all hover:opacity-80"
          style={{ background: "linear-gradient(135deg, var(--sapphire), var(--amethyst))", color: "white" }}>
          {showNewList ? "×" : "+"}
        </button>
      </div>

      {showNewList && (
        <div className="mx-4 mb-4 rounded-2xl p-4"
          style={{ background: "var(--card)", border: "1px solid var(--sapphire)44" }}>
          <input
            value={newListTitle}
            onChange={(e) => setNewListTitle(e.target.value)}
            placeholder="List name..."
            className="w-full rounded-xl px-3 py-2 text-sm mb-3"
            style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)", outline: "none" }}
          />
          <div className="flex flex-wrap gap-2 mb-3">
            {LIST_TYPES.map(({ value, label }) => (
              <button key={value} onClick={() => setNewListType(value)}
                className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                style={{
                  background: newListType === value ? "var(--sapphire)" : "var(--muted)22",
                  color: newListType === value ? "white" : "var(--muted-foreground)",
                }}>
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => createList.mutate({ title: newListTitle, listType: newListType })}
            disabled={createList.isPending || !newListTitle.trim()}
            className="w-full py-2.5 rounded-xl font-bold text-sm disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, var(--sapphire), var(--amethyst))", color: "white" }}>
            {createList.isPending ? "Creating..." : "Create List"}
          </button>
        </div>
      )}

      {activeList ? (
        <div className="px-4">
          <button onClick={() => setActiveListId(null)}
            className="flex items-center gap-2 mb-4 text-sm font-bold"
            style={{ color: "var(--sapphire)" }}>
            ← Back to Lists
          </button>
          <div className="rounded-2xl p-4 mb-4"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <h2 className="font-bold text-lg mb-4" style={{ fontFamily: "Candara, sans-serif" }}>
              {(activeList as { title?: string }).title}
            </h2>
            <div className="flex gap-2 mb-4">
              <input
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && newItem.trim()) addItem.mutate({ listId: activeList.id, content: newItem }); }}
                placeholder="Add item..."
                className="flex-1 rounded-xl px-3 py-2 text-sm"
                style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)", outline: "none" }}
              />
              <button
                onClick={() => { if (newItem.trim()) addItem.mutate({ listId: activeList.id, content: newItem }); }}
                className="px-4 py-2 rounded-xl font-bold text-sm"
                style={{ background: "var(--sapphire)", color: "white" }}>
                +
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {(activeList as { items?: { id: string; content: string; completed?: boolean; completed_by?: string }[] }).items?.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-2"
                  style={{ borderBottom: "1px solid var(--border)" }}>
                  <button
                    onClick={() => toggleItem.mutate({ itemId: item.id, completed: !item.completed })}
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                      background: item.completed ? "var(--emerald)" : "transparent",
                      border: `2px solid ${item.completed ? "var(--emerald)" : "var(--border)"}`,
                    }}>
                    {item.completed && <span className="text-xs text-white">✓</span>}
                  </button>
                  <span className="text-sm flex-1" style={{
                    textDecoration: item.completed ? "line-through" : "none",
                    color: item.completed ? "var(--muted-foreground)" : "var(--foreground)",
                  }}>
                    {item.content}
                  </span>
                </div>
              ))}
              {!(activeList as { items?: unknown[] }).items?.length && (
                <p className="text-sm text-center py-4" style={{ color: "var(--muted-foreground)" }}>
                  No items yet. Add the first one!
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 grid grid-cols-2 gap-3">
          {lists && lists.length > 0 ? lists.map((list: {
            id: string;
            title?: string;
            list_type?: string;
            items?: unknown[];
          }) => {
            const typeInfo = LIST_TYPES.find(t => t.value === list.list_type) ?? LIST_TYPES[5]!;
            const completedCount = (list.items as { completed?: boolean }[] | undefined)?.filter(i => i.completed).length ?? 0;
            const totalCount = list.items?.length ?? 0;
            return (
              <button key={list.id} onClick={() => setActiveListId(list.id)}
                className="rounded-2xl p-4 text-left transition-all hover:opacity-80"
                style={{ background: "var(--card)", border: `1px solid ${typeInfo.color}44` }}>
                <p className="text-2xl mb-2">{typeInfo.label.split(" ")[0]}</p>
                <p className="font-bold text-sm mb-1" style={{ fontFamily: "Candara, sans-serif" }}>{list.title}</p>
                <p className="text-xs" style={{ color: typeInfo.color }}>
                  {completedCount}/{totalCount} done
                </p>
              </button>
            );
          }) : (
            <div className="col-span-2 text-center py-16">
              <div className="text-5xl mb-4">📋</div>
              <p className="font-bold mb-2" style={{ fontFamily: "Candara, sans-serif" }}>No lists yet</p>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Tap + to create your first shared list</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
