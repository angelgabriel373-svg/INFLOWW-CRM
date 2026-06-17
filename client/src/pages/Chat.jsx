import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '../api';
import { getSocket } from '../socket';
import { useAuth } from '../context/AuthContext';

function timeAgo(date) {
  const d = (Date.now() - new Date(date).getTime()) / 1000;
  if (d < 60) return 'ahora';
  if (d < 3600) return `${Math.floor(d / 60)}m`;
  if (d < 86400) return `${Math.floor(d / 3600)}h`;
  return `${Math.floor(d / 86400)}d`;
}

export default function Chat() {
  const { user } = useAuth();
  const [models, setModels] = useState([]);
  const [modelFilter, setModelFilter] = useState('');
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [active, setActive] = useState(null);
  const [search, setSearch] = useState('');
  const [scripts, setScripts] = useState([]);
  const [body, setBody] = useState('');
  const [isPpv, setIsPpv] = useState(false);
  const [price, setPrice] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [sending, setSending] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);

  const loadConversations = useCallback(() => {
    const qs = new URLSearchParams();
    if (modelFilter) qs.set('modelId', modelFilter);
    if (search) qs.set('q', search);
    api.get(`/conversations?${qs.toString()}`).then(setConversations).catch(() => {});
  }, [modelFilter, search]);

  // Carga inicial: modelos
  useEffect(() => {
    api.get('/models').then(setModels).catch(() => {});
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Abrir conversacion
  const openConversation = (id) => {
    setActiveId(id);
    api.get(`/conversations/${id}`).then((c) => {
      setActive(c);
      api.get(`/scripts?modelId=${c.modelId}`).then(setScripts).catch(() => {});
      // marcar leida en la lista
      setConversations((prev) => prev.map((x) => (x.id === id ? { ...x, unreadCount: 0 } : x)));
    });
  };

  // Socket en tiempo real
  useEffect(() => {
    const socket = getSocket();

    const onNew = (msg) => {
      if (msg.conversationId === activeId) {
        setActive((prev) => (prev ? { ...prev, messages: [...prev.messages, msg] } : prev));
      }
      loadConversations();
    };
    const onUpdated = (msg) => {
      setActive((prev) =>
        prev ? { ...prev, messages: prev.messages.map((m) => (m.id === msg.id ? { ...m, ...msg } : m)) } : prev
      );
    };
    const onTyping = ({ user: name, isTyping }) => setTypingUser(isTyping ? name : null);

    socket.on('message:new', onNew);
    socket.on('message:updated', onUpdated);
    socket.on('conversation:updated', loadConversations);
    socket.on('typing', onTyping);

    return () => {
      socket.off('message:new', onNew);
      socket.off('message:updated', onUpdated);
      socket.off('conversation:updated', loadConversations);
      socket.off('typing', onTyping);
    };
  }, [activeId, loadConversations]);

  // Unirse a la sala de la conversacion activa
  useEffect(() => {
    if (!activeId) return;
    const socket = getSocket();
    socket.emit('conversation:join', activeId);
    return () => socket.emit('conversation:leave', activeId);
  }, [activeId]);

  // Auto-scroll al fondo
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [active?.messages?.length]);

  const send = async (e) => {
    e?.preventDefault();
    if ((!body.trim() && !attachment) || !active) return;
    setSending(true);
    try {
      let attachmentUrl = null;
      if (attachment) {
        const up = await api.upload(attachment);
        attachmentUrl = up.url;
      }
      await api.post(`/conversations/${active.id}/messages`, {
        body: body.trim(),
        attachmentUrl,
        isPpv,
        price: isPpv ? Number(price) : 0,
      });
      setBody('');
      setIsPpv(false);
      setPrice('');
      setAttachment(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  const simulateFan = async () => {
    const text = prompt('Mensaje del fan (simulado):', 'Hola guapa, estas ahi?');
    if (text == null) return;
    await api.post(`/conversations/${active.id}/simulate-fan`, { body: text });
  };

  const markPurchased = async (msgId) => {
    await api.patch(`/messages/${msgId}/purchase`);
  };

  const exportCsv = () => {
    const token = localStorage.getItem('ofm_token');
    // descarga con fetch para incluir el token
    fetch(`/api/export/conversations/${active.id}.csv`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conversacion-${active.fan.username}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      });
  };

  return (
    <div className="flex h-full">
      {/* Bandeja */}
      <div className="flex w-80 shrink-0 flex-col border-r border-ink-600 bg-ink-800">
        <div className="space-y-2 border-b border-ink-600 p-3">
          <select className="input" value={modelFilter} onChange={(e) => setModelFilter(e.target.value)}>
            <option value="">Todas mis modelos</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>{m.alias || m.name}</option>
            ))}
          </select>
          <input className="input" placeholder="Buscar fan..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && <p className="p-4 text-sm text-gray-500">Sin conversaciones.</p>}
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => openConversation(c.id)}
              className={`flex w-full items-center gap-3 border-b border-ink-700/50 px-3 py-3 text-left hover:bg-ink-700 ${
                activeId === c.id ? 'bg-ink-700' : ''
              }`}
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-500/30 font-semibold text-brand-400">
                {(c.fan.name || c.fan.username || '?')[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm font-medium">{c.fan.name || c.fan.username}</span>
                  <span className="text-xs text-gray-500">{timeAgo(c.lastMessageAt)}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs text-gray-500">{c.lastMessage?.body || 'Sin mensajes'}</span>
                  {c.unreadCount > 0 && (
                    <span className="badge bg-brand-500 text-white">{c.unreadCount}</span>
                  )}
                </div>
                <span className="text-[10px] text-accent">{c.model.alias || c.model.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Hilo */}
      <div className="flex flex-1 flex-col">
        {!active ? (
          <div className="grid flex-1 place-items-center text-gray-500">Selecciona una conversacion</div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-ink-600 bg-ink-800 px-4 py-3">
              <div>
                <div className="font-semibold">{active.fan.name || active.fan.username}</div>
                <div className="text-xs text-gray-500">
                  Hablando como <span className="text-accent">{active.model.name}</span> · gasto del fan: {active.fan.totalSpent} €
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={simulateFan} className="btn btn-ghost text-xs">Simular fan</button>
                <button onClick={exportCsv} className="btn btn-ghost text-xs">Exportar CSV</button>
              </div>
            </div>

            {active.fan.notes && (
              <div className="border-b border-ink-600 bg-ink-700/40 px-4 py-2 text-xs text-amber-300">
                📌 {active.fan.notes}
              </div>
            )}

            <div className="flex-1 space-y-3 overflow-y-auto bg-ink-900 p-4">
              {active.messages.map((m) => {
                const mine = m.senderType === 'MODEL';
                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${mine ? 'bg-brand-500 text-white' : 'bg-ink-700 text-gray-100'}`}>
                      {m.attachmentUrl && (
                        <img src={m.attachmentUrl} alt="adjunto" className="mb-2 max-h-60 rounded-lg" />
                      )}
                      {m.isPpv && (
                        <div className={`mb-1 text-xs font-semibold ${m.purchased ? 'text-green-300' : 'text-yellow-200'}`}>
                          🔒 PPV {m.price}€ {m.purchased ? '· comprado ✅' : ''}
                        </div>
                      )}
                      {m.body && <div className="whitespace-pre-wrap text-sm">{m.body}</div>}
                      <div className={`mt-1 flex items-center gap-2 text-[10px] ${mine ? 'text-white/70' : 'text-gray-500'}`}>
                        <span>{new Date(m.createdAt).toLocaleString('es-ES')}</span>
                        {mine && m.sentByUser && <span>· por {m.sentByUser.name}</span>}
                        {mine && m.isPpv && !m.purchased && (
                          <button onClick={() => markPurchased(m.id)} className="underline hover:text-white">marcar comprado</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {typingUser && <div className="text-xs italic text-gray-500">{typingUser} escribiendo...</div>}
              <div ref={bottomRef} />
            </div>

            {/* Scripts / respuestas rapidas */}
            {scripts.length > 0 && (
              <div className="flex gap-2 overflow-x-auto border-t border-ink-600 bg-ink-800 px-3 py-2">
                {scripts.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setBody((b) => (b ? b + ' ' : '') + s.body)}
                    title={s.body}
                    className="shrink-0 rounded-full bg-ink-600 px-3 py-1 text-xs text-gray-200 hover:bg-ink-500"
                  >
                    ⚡ {s.title}
                  </button>
                ))}
              </div>
            )}

            {/* Composer */}
            <form onSubmit={send} className="border-t border-ink-600 bg-ink-800 p-3">
              {attachment && (
                <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
                  📎 {attachment.name}
                  <button type="button" onClick={() => { setAttachment(null); if (fileRef.current) fileRef.current.value=''; }} className="text-red-400">quitar</button>
                </div>
              )}
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <label className="flex cursor-pointer items-center gap-1 text-xs text-gray-400 hover:text-gray-200">
                  📎 Adjuntar
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setAttachment(e.target.files[0])} />
                </label>
                <label className="flex items-center gap-1 text-xs text-gray-400">
                  <input type="checkbox" checked={isPpv} onChange={(e) => setIsPpv(e.target.checked)} /> PPV
                </label>
                {isPpv && (
                  <input
                    type="number" min="0" step="0.5" placeholder="precio €"
                    value={price} onChange={(e) => setPrice(e.target.value)}
                    className="input w-24 py-1"
                  />
                )}
              </div>
              <div className="flex gap-2">
                <textarea
                  className="input resize-none"
                  rows={2}
                  placeholder={`Escribe como ${active.model.name}...`}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                />
                <button className="btn btn-primary" disabled={sending}>{sending ? '...' : 'Enviar'}</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
