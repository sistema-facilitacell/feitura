import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";

// ─── Firebase config ───────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyB59Ruh_m9BH3s1d_-CaBLV_4WR1-dmNkM",
  authDomain: "feitura-eaf3d.firebaseapp.com",
  projectId: "feitura-eaf3d",
  storageBucket: "feitura-eaf3d.firebasestorage.app",
  messagingSenderId: "376425355963",
  appId: "1:376425355963:web:af9fd2457babbb1dab279e",
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const itemsRef = collection(db, "feitura_items");

// ─── Categorias ────────────────────────────────────────────────────────────────
const categorias = [
  { nome: "Oferendas", icone: "🌹" },
  { nome: "Roupas e Tecidos", icone: "🪡" },
  { nome: "Velas e Incensos", icone: "🕯️" },
  { nome: "Ervas e Natureza", icone: "🌿" },
  { nome: "Alimentos", icone: "🍯" },
  { nome: "Ferramentas", icone: "⚒️" },
  { nome: "Outros", icone: "✦" },
];

// ─── Animations ────────────────────────────────────────────────────────────────
const glowAnim = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap');

@keyframes flicker {
  0%, 100% { opacity: 1; }
  47% { opacity: 1; }
  48% { opacity: 0.85; }
  49% { opacity: 1; }
  62% { opacity: 1; }
  63% { opacity: 0.9; }
  64% { opacity: 1; }
}
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
}
@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes rise {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 8px rgba(200,134,10,0.3); }
  50% { box-shadow: 0 0 22px rgba(200,134,10,0.7), 0 0 40px rgba(200,134,10,0.2); }
}
@keyframes smoke {
  0% { opacity: 0.5; transform: translateY(0) scaleX(1); }
  100% { opacity: 0; transform: translateY(-40px) scaleX(1.5); }
}
@keyframes slide-up {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

// ─── Sub-components ────────────────────────────────────────────────────────────
function Candle({ style }) {
  return (
    <div style={{ position: "relative", display: "inline-block", ...style }}>
      <div style={{
        position: "absolute", top: -18, left: "50%", transform: "translateX(-50%)",
        width: 3, height: 16, background: "rgba(255,255,255,0.15)",
        borderRadius: 4, animation: "smoke 2s ease-out infinite",
      }} />
      <div style={{
        position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
        width: 8, height: 12,
        background: "radial-gradient(ellipse at 50% 80%, #f0c040 0%, #e07010 50%, #c03010 100%)",
        borderRadius: "50% 50% 30% 30%",
        animation: "flicker 3s ease-in-out infinite",
        boxShadow: "0 0 8px rgba(240,192,64,0.8), 0 0 16px rgba(240,192,64,0.4)",
      }} />
      <div style={{
        width: 14, height: 48, borderRadius: "2px 2px 0 0",
        background: "linear-gradient(180deg, #f5f0e0 0%, #e8ddb0 50%, #d4c880 100%)",
        boxShadow: "inset -3px 0 6px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.4)",
      }} />
      <div style={{
        width: 18, height: 4, borderRadius: "0 0 4px 4px", marginLeft: -2,
        background: "linear-gradient(90deg, #b8a050, #d4c060, #b8a050)",
      }} />
    </div>
  );
}

function StarSymbol({ size = 16, color = "#c8860a", animated = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}
      style={animated ? { animation: "spin-slow 12s linear infinite" } : {}}>
      <path d="M12 2 L13.5 9 L20 8 L14.5 13 L17 20 L12 16 L7 20 L9.5 13 L4 8 L10.5 9 Z" />
    </svg>
  );
}

// ─── ItemCard ──────────────────────────────────────────────────────────────────
function ItemCard({ item, idx, confirmDelete, setConfirmDelete, toggleComprado, updateQtdComprada, removeItem, catIcone, isComprado }) {
  const [expanded, setExpanded] = useState(false);
  const progresso = item.quantidade > 0 ? (item.quantidadeComprada / item.quantidade) * 100 : 0;

  return (
    <div style={{
      background: isComprado
        ? "rgba(39,174,96,0.04)"
        : item.prioridade === "alta"
          ? "rgba(192,57,43,0.06)"
          : "rgba(255,255,255,0.04)",
      border: isComprado
        ? "1px solid rgba(39,174,96,0.2)"
        : item.prioridade === "alta"
          ? "1px solid rgba(192,57,43,0.35)"
          : "1px solid rgba(200,134,10,0.15)",
      borderRadius: 16, padding: "14px 16px",
      opacity: isComprado ? 0.7 : 1,
      animation: `rise 0.4s ease ${idx * 0.06}s both`,
      transition: "all 0.2s",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => toggleComprado(item.id, item.comprado, item.quantidade)} style={{
          width: 28, height: 28, borderRadius: "50%", border: "none", cursor: "pointer",
          flexShrink: 0, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
          background: item.comprado
            ? "linear-gradient(135deg, #27ae60, #1e8449)"
            : "rgba(255,255,255,0.07)",
          color: item.comprado ? "#fff" : "#a07840",
          transition: "all 0.25s",
          boxShadow: item.comprado ? "0 2px 10px rgba(39,174,96,0.4)" : "none",
        }}>
          {item.comprado ? "✓" : "○"}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 15, fontWeight: 600,
            color: item.comprado ? "#7a5820" : "#e8d5b0",
            textDecoration: item.comprado ? "line-through" : "none",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            letterSpacing: 0.5,
          }}>{item.nome}</div>

          <div style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{
              fontSize: 10, padding: "2px 9px", borderRadius: 10,
              background: "rgba(200,134,10,0.12)", color: "#c8860a", letterSpacing: 0.5,
            }}>{catIcone(item.categoria)} {item.categoria}</span>

            {item.prioridade === "alta" && (
              <span style={{
                fontSize: 10, padding: "2px 9px", borderRadius: 10,
                background: "rgba(192,57,43,0.2)", color: "#e74c3c", letterSpacing: 0.5,
              }}>🔥 PRIORITÁRIO</span>
            )}

            <span style={{ fontSize: 10, color: "#7a5820" }}>
              {item.quantidadeComprada}/{item.quantidade} un.
              {item.preco && ` · R$ ${(item.preco * item.quantidade).toFixed(2).replace(".", ",")}`}
            </span>
          </div>

          {item.quantidade > 1 && (
            <div style={{
              marginTop: 7, height: 3, borderRadius: 2,
              background: "rgba(255,255,255,0.08)", overflow: "hidden",
            }}>
              <div style={{
                height: "100%", borderRadius: 2,
                width: `${progresso}%`,
                background: progresso >= 100
                  ? "linear-gradient(90deg, #27ae60, #2ecc71)"
                  : "linear-gradient(90deg, #c8860a, #f0c040)",
                transition: "width 0.4s ease",
              }} />
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
          {confirmDelete === item.id ? (
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => removeItem(item.id)} style={{
                padding: "4px 10px", background: "#c0392b", color: "#fff",
                border: "none", borderRadius: 8, cursor: "pointer", fontSize: 11,
                fontFamily: "'Cormorant Garamond', serif",
              }}>Sim</button>
              <button onClick={() => setConfirmDelete(null)} style={{
                padding: "4px 10px", background: "rgba(255,255,255,0.08)", color: "#e8d5b0",
                border: "none", borderRadius: 8, cursor: "pointer", fontSize: 11,
                fontFamily: "'Cormorant Garamond', serif",
              }}>Não</button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {!item.comprado && item.quantidade > 1 && (
                <button onClick={() => setExpanded(v => !v)} style={{
                  background: "none", border: "none", color: "#a07840",
                  cursor: "pointer", fontSize: 14, padding: "4px",
                }}>⊕</button>
              )}
              <button onClick={() => setConfirmDelete(item.id)} style={{
                background: "none", border: "none", color: "#7a5820",
                cursor: "pointer", fontSize: 16, padding: "4px",
              }}>🗑</button>
            </div>
          )}
        </div>
      </div>

      {expanded && !item.comprado && item.quantidade > 1 && (
        <div style={{
          marginTop: 10, paddingTop: 10,
          borderTop: "1px solid rgba(200,134,10,0.12)",
          display: "flex", alignItems: "center", gap: 10,
          animation: "rise 0.2s ease",
        }}>
          <span style={{ fontSize: 11, color: "#7a5820", letterSpacing: 1 }}>Qtd comprada:</span>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button onClick={() => updateQtdComprada(item.id, item.quantidadeComprada - 1, item.quantidade)} style={{
              width: 24, height: 24, borderRadius: "50%", border: "none", cursor: "pointer",
              background: "rgba(200,134,10,0.15)", color: "#c8860a", fontSize: 14,
            }}>−</button>
            <span style={{ fontSize: 15, color: "#e8d5b0", minWidth: 20, textAlign: "center" }}>
              {item.quantidadeComprada}
            </span>
            <button onClick={() => updateQtdComprada(item.id, item.quantidadeComprada + 1, item.quantidade)} style={{
              width: 24, height: 24, borderRadius: "50%", border: "none", cursor: "pointer",
              background: "rgba(200,134,10,0.15)", color: "#c8860a", fontSize: 14,
            }}>+</button>
          </div>
          <span style={{ fontSize: 11, color: "#7a5820" }}>de {item.quantidade}</span>
        </div>
      )}
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("Velas e Incensos");
  const [prioridade, setPrioridade] = useState("normal");
  const [quantidade, setQuantidade] = useState(1);
  const [preco, setPreco] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showComprados, setShowComprados] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  // ── Firestore: escuta em tempo real ────────────────────────────────────────
  useEffect(() => {
    const q = query(itemsRef, orderBy("criadoEm", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setItems(data);
        setLoaded(true);
      },
      (err) => {
        console.error("Firestore error:", err);
        setLoaded(true);
      }
    );
    return () => unsubscribe();
  }, []);

  const showToast = (msg, type = "success") => {
    clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  };

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const addItem = async () => {
    if (!nome.trim()) return;
    const novo = {
      nome: nome.trim(),
      categoria,
      prioridade,
      quantidade: Number(quantidade) || 1,
      preco: preco ? parseFloat(preco.replace(",", ".")) : null,
      comprado: false,
      quantidadeComprada: 0,
      criadoEm: Date.now(), // número para ordenação no Firestore
      criadoEmLabel: new Date().toLocaleDateString("pt-BR"),
    };
    try {
      await addDoc(itemsRef, novo);
      setNome(""); setCategoria("Velas e Incensos");
      setPrioridade("normal"); setQuantidade(1); setPreco("");
      setShowForm(false);
      showToast("Item adicionado com axé ✦");
    } catch (e) {
      showToast("Erro ao salvar :(", "info");
    }
  };

  const toggleComprado = async (id, compradoAtual, qtd) => {
    const novoComprado = !compradoAtual;
    try {
      await updateDoc(doc(db, "feitura_items", id), {
        comprado: novoComprado,
        quantidadeComprada: novoComprado ? qtd : 0,
      });
    } catch (e) {
      showToast("Erro ao atualizar :(", "info");
    }
  };

  const updateQtdComprada = async (id, val, qtdTotal) => {
    const qtd = Math.max(0, Math.min(qtdTotal, Number(val)));
    try {
      await updateDoc(doc(db, "feitura_items", id), {
        quantidadeComprada: qtd,
        comprado: qtd >= qtdTotal,
      });
    } catch (e) {
      showToast("Erro ao atualizar :(", "info");
    }
  };

  const removeItem = async (id) => {
    try {
      await deleteDoc(doc(db, "feitura_items", id));
      setConfirmDelete(null);
      showToast("Item removido", "info");
    } catch (e) {
      showToast("Erro ao remover :(", "info");
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const pendentes = items.filter(i => !i.comprado);
  const comprados = items.filter(i => i.comprado);
  const prioritarios = items.filter(i => i.prioridade === "alta" && !i.comprado);

  const totalGasto = comprados.reduce((acc, i) => {
    if (!i.preco) return acc;
    return acc + i.preco * i.quantidade;
  }, 0);

  const totalPrevisto = items.reduce((acc, i) => {
    if (!i.preco) return acc;
    return acc + i.preco * i.quantidade;
  }, 0);

  const filteredMain = filtro === "prioritario" ? prioritarios : pendentes;

  const catIcone = (nome) => categorias.find(c => c.nome === nome)?.icone || "✦";

  const inputStyle = {
    width: "100%", padding: "11px 14px", borderRadius: 10,
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(200,134,10,0.25)",
    color: "#e8d5b0", fontSize: 14, fontFamily: "'Cormorant Garamond', serif",
    outline: "none", boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  const labelStyle = {
    fontSize: 10, color: "#a07840", letterSpacing: 1.5,
    display: "block", marginBottom: 5, textTransform: "uppercase",
    fontFamily: "'Cormorant Garamond', serif",
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (!loaded) return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0a0800 0%, #1a0e00 60%, #0a0800 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", gap: 16,
    }}>
      <style>{glowAnim}</style>
      <Candle />
      <p style={{ color: "#a07840", fontFamily: "'Cormorant Garamond', serif", fontSize: 16, letterSpacing: 2, animation: "flicker 2s infinite" }}>
        Carregando os fundamentos...
      </p>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{glowAnim}</style>
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #0a0800 0%, #140c00 40%, #1a0e02 70%, #0a0800 100%)",
        fontFamily: "'Cormorant Garamond', serif",
        color: "#e8d5b0",
        position: "relative",
        overflow: "hidden",
      }}>

        {/* Fundo decorativo */}
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
          <div style={{
            position: "absolute", top: "8%", left: "50%", transform: "translateX(-50%)",
            opacity: 0.04, animation: "spin-slow 60s linear infinite",
          }}>
            <svg width="500" height="500" viewBox="0 0 500 500" fill="#c8860a">
              <polygon points="250,10 290,190 470,190 325,295 385,470 250,365 115,470 175,295 30,190 210,190" />
            </svg>
          </div>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 30%, rgba(180,120,20,0.06) 0%, transparent 55%)" }} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 70% 70%, rgba(140,30,20,0.06) 0%, transparent 55%)" }} />
          <svg style={{ position: "absolute", bottom: 0, right: 0, opacity: 0.04 }} width="300" height="300" viewBox="0 0 300 300" fill="none" stroke="#c8860a" strokeWidth="0.8">
            {[0, 30, 60, 90, 120, 150, 180].map(r => (
              <circle key={r} cx="300" cy="300" r={r + 20} />
            ))}
          </svg>
        </div>

        {/* Toast */}
        {toast && (
          <div style={{
            position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
            zIndex: 200, padding: "10px 22px", borderRadius: 30,
            background: toast.type === "success"
              ? "linear-gradient(135deg, rgba(200,134,10,0.9), rgba(240,192,64,0.9))"
              : "rgba(30,30,30,0.9)",
            color: toast.type === "success" ? "#1a0a00" : "#e8d5b0",
            fontSize: 13, fontWeight: "bold", letterSpacing: 1,
            boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
            animation: "rise 0.3s ease",
          }}>
            {toast.msg}
          </div>
        )}

        <div style={{ maxWidth: 560, margin: "0 auto", padding: "28px 16px 140px", position: "relative", zIndex: 1 }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 28, marginBottom: 12, alignItems: "flex-end" }}>
              <Candle style={{ opacity: 0.8 }} />
              <div style={{ animation: "float 4s ease-in-out infinite" }}>
                <div style={{ fontSize: 44, lineHeight: 1 }}>🌿</div>
              </div>
              <Candle style={{ opacity: 0.8 }} />
            </div>

            <h1 style={{
              fontSize: 28, fontWeight: 900, margin: "0 0 4px", letterSpacing: 4,
              fontFamily: "'Cinzel Decorative', serif",
              background: "linear-gradient(135deg, #a06010 0%, #f0c040 40%, #c8860a 60%, #f5e090 100%)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              animation: "shimmer 4s linear infinite",
              textTransform: "uppercase",
            }}>
              Lista de Feitura
            </h1>

            <p style={{
              color: "#a07840", fontSize: 13, margin: "4px 0 0", letterSpacing: 3,
              fontStyle: "italic", fontFamily: "'Cormorant Garamond', serif",
            }}>
              Axé · Organização · Memória
            </p>

            {/* Indicador Firebase */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5, marginTop: 8,
              background: "rgba(39,174,96,0.08)", border: "1px solid rgba(39,174,96,0.2)",
              borderRadius: 20, padding: "3px 12px",
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%", background: "#27ae60",
                boxShadow: "0 0 6px rgba(39,174,96,0.8)",
                animation: "pulse-glow 2s ease infinite",
              }} />
              <span style={{ fontSize: 10, color: "#27ae60", letterSpacing: 1 }}>Firebase · Sincronizado</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px auto 0", maxWidth: 280, justifyContent: "center" }}>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, rgba(200,134,10,0.5))" }} />
              <StarSymbol size={12} color="#c8860a" />
              <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(200,134,10,0.5), transparent)" }} />
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
            {[
              { label: "Pendentes", value: pendentes.length, color: "#d4ac0d", icon: "⏳" },
              { label: "Alta prioridade", value: prioritarios.length, color: "#c0392b", icon: "🔥" },
              { label: "Comprados", value: comprados.length, color: "#27ae60", icon: "✓" },
            ].map((s, i) => (
              <div key={s.label} onClick={() => { if (s.label === "Comprados") setShowComprados(v => !v); }}
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${s.label === "Comprados" && showComprados ? "rgba(39,174,96,0.5)" : "rgba(200,134,10,0.15)"}`,
                  borderRadius: 14, padding: "12px 8px", textAlign: "center",
                  cursor: s.label === "Comprados" ? "pointer" : "default",
                  animation: `rise 0.4s ease ${i * 0.1}s both`,
                  transition: "all 0.2s",
                }}>
                <div style={{ fontSize: 11, marginBottom: 2 }}>{s.icon}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: s.color, fontFamily: "'Cinzel Decorative', serif" }}>{s.value}</div>
                <div style={{ fontSize: 10, color: "#7a5820", letterSpacing: 0.5, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Orçamento */}
          {totalPrevisto > 0 && (
            <div style={{
              background: "rgba(200,134,10,0.06)",
              border: "1px solid rgba(200,134,10,0.2)",
              borderRadius: 14, padding: "12px 16px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: 20, animation: "rise 0.5s ease both",
            }}>
              <div>
                <div style={{ fontSize: 10, color: "#7a5820", letterSpacing: 1.5, textTransform: "uppercase" }}>Previsto</div>
                <div style={{ fontSize: 18, color: "#c8860a", fontWeight: 600 }}>
                  R$ {totalPrevisto.toFixed(2).replace(".", ",")}
                </div>
              </div>
              <div style={{ width: 1, height: 36, background: "rgba(200,134,10,0.2)" }} />
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: "#7a5820", letterSpacing: 1.5, textTransform: "uppercase" }}>Já gasto</div>
                <div style={{ fontSize: 18, color: "#27ae60", fontWeight: 600 }}>
                  R$ {totalGasto.toFixed(2).replace(".", ",")}
                </div>
              </div>
            </div>
          )}

          {/* Filtros */}
          <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
            {[
              { key: "todos", label: "Todos" },
              { key: "prioritario", label: "🔥 Prioritários" },
            ].map(f => (
              <button key={f.key} onClick={() => setFiltro(f.key)} style={{
                padding: "7px 16px", borderRadius: 20, border: "none", cursor: "pointer",
                fontSize: 12, fontFamily: "'Cormorant Garamond', serif", letterSpacing: 1,
                background: filtro === f.key
                  ? "linear-gradient(135deg, #c8860a, #f0c040)"
                  : "rgba(255,255,255,0.05)",
                color: filtro === f.key ? "#1a0a00" : "#a07840",
                fontWeight: filtro === f.key ? "bold" : "normal",
                transition: "all 0.2s",
                boxShadow: filtro === f.key ? "0 2px 12px rgba(200,134,10,0.3)" : "none",
              }}>{f.label}</button>
            ))}
          </div>

          {/* Lista pendentes */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
            {filteredMain.length === 0 && (
              <div style={{
                textAlign: "center", padding: "44px 20px",
                color: "#7a5820", fontSize: 14, letterSpacing: 1,
                border: "1px dashed rgba(200,134,10,0.18)", borderRadius: 18,
                fontStyle: "italic",
              }}>
                <div style={{ fontSize: 32, marginBottom: 12, animation: "flicker 3s infinite" }}>🕯️</div>
                Nenhum item aqui.<br />
                <span style={{ fontSize: 12, opacity: 0.7 }}>Adicione itens com o botão abaixo.</span>
              </div>
            )}
            {filteredMain.map((item, idx) => (
              <ItemCard
                key={item.id}
                item={item}
                idx={idx}
                confirmDelete={confirmDelete}
                setConfirmDelete={setConfirmDelete}
                toggleComprado={toggleComprado}
                updateQtdComprada={updateQtdComprada}
                removeItem={removeItem}
                catIcone={catIcone}
              />
            ))}
          </div>

          {/* Seção Comprados */}
          {comprados.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <button onClick={() => setShowComprados(v => !v)} style={{
                width: "100%", padding: "12px 16px",
                background: showComprados ? "rgba(39,174,96,0.08)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${showComprados ? "rgba(39,174,96,0.3)" : "rgba(200,134,10,0.15)"}`,
                borderRadius: 14, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                color: "#e8d5b0", fontFamily: "'Cormorant Garamond', serif",
                transition: "all 0.25s",
              }}>
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 16 }}>✅</span>
                  <span style={{ fontSize: 15, letterSpacing: 1 }}>Itens Comprados</span>
                  <span style={{
                    background: "rgba(39,174,96,0.2)", color: "#27ae60",
                    borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700,
                  }}>{comprados.length}</span>
                </span>
                <span style={{ color: "#a07840", fontSize: 18, transition: "transform 0.3s", transform: showComprados ? "rotate(180deg)" : "none" }}>▾</span>
              </button>

              {showComprados && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                  {comprados.map((item, idx) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      idx={idx}
                      confirmDelete={confirmDelete}
                      setConfirmDelete={setConfirmDelete}
                      toggleComprado={toggleComprado}
                      updateQtdComprada={updateQtdComprada}
                      removeItem={removeItem}
                      catIcone={catIcone}
                      isComprado
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal formulário */}
        {showForm && (
          <div onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }} style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}>
            <div style={{
              width: "100%", maxWidth: 560,
              background: "linear-gradient(170deg, #1a0d00 0%, #0f0900 100%)",
              border: "1px solid rgba(200,134,10,0.3)",
              borderRadius: "24px 24px 0 0",
              padding: "24px 20px 40px",
              boxShadow: "0 -12px 60px rgba(0,0,0,0.7)",
              animation: "slide-up 0.35s cubic-bezier(0.16,1,0.3,1)",
            }}>
              <div style={{ textAlign: "center", marginBottom: 22 }}>
                <div style={{ width: 44, height: 4, background: "rgba(200,134,10,0.35)", borderRadius: 2, margin: "0 auto 16px" }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  <StarSymbol size={14} color="#c8860a" />
                  <h2 style={{
                    margin: 0, fontSize: 18, color: "#e8d5b0", letterSpacing: 2,
                    fontFamily: "'Cinzel Decorative', serif", fontWeight: 400,
                  }}>Novo Item</h2>
                  <StarSymbol size={14} color="#c8860a" />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={labelStyle}>Nome do item *</label>
                  <input autoFocus value={nome} onChange={e => setNome(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addItem()}
                    placeholder="Ex: Vela branca, Pemba, Ojá..."
                    style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Categoria</label>
                  <select value={categoria} onChange={e => setCategoria(e.target.value)} style={inputStyle}>
                    {categorias.map(c => (
                      <option key={c.nome} value={c.nome} style={{ background: "#1a0d00" }}>
                        {c.icone} {c.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={labelStyle}>Quantidade</label>
                    <input type="number" min="1" value={quantidade}
                      onChange={e => setQuantidade(e.target.value)}
                      style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Preço unit. (R$)</label>
                    <input type="text" value={preco}
                      onChange={e => setPreco(e.target.value)}
                      placeholder="0,00"
                      style={inputStyle} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Prioridade</label>
                  <div style={{ display: "flex", gap: 10 }}>
                    {[
                      { value: "normal", label: "Normal", sub: "Pode aguardar", color: "#c8860a" },
                      { value: "alta", label: "🔥 Alta", sub: "Comprar logo", color: "#c0392b" },
                    ].map(p => (
                      <button key={p.value} onClick={() => setPrioridade(p.value)} style={{
                        flex: 1, padding: "11px 10px", borderRadius: 12, cursor: "pointer",
                        border: prioridade === p.value ? `2px solid ${p.color}` : "1px solid rgba(255,255,255,0.08)",
                        background: prioridade === p.value ? `rgba(${p.value === "alta" ? "192,57,43" : "200,134,10"},0.15)` : "rgba(255,255,255,0.03)",
                        color: "#e8d5b0", fontFamily: "'Cormorant Garamond', serif",
                        transition: "all 0.2s",
                      }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{p.label}</div>
                        <div style={{ fontSize: 10, color: "#7a5820", marginTop: 2 }}>{p.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={addItem} style={{
                  padding: "14px", borderRadius: 14, border: "none", cursor: "pointer",
                  background: "linear-gradient(135deg, #c8860a, #f0c040)",
                  color: "#1a0a00", fontSize: 15, fontWeight: 700,
                  fontFamily: "'Cinzel Decorative', serif", letterSpacing: 2, marginTop: 4,
                  boxShadow: "0 4px 20px rgba(200,134,10,0.35)",
                  animation: "pulse-glow 2s ease infinite",
                }}>
                  ✦ Adicionar à Lista ✦
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FAB */}
        <button onClick={() => setShowForm(true)} style={{
          position: "fixed", bottom: 30, right: "50%", transform: "translateX(50%)",
          padding: "14px 32px", borderRadius: 40, border: "none", cursor: "pointer",
          background: "linear-gradient(135deg, #a06010, #c8860a, #f0c040, #c8860a)",
          backgroundSize: "300% auto",
          color: "#1a0a00", fontSize: 14, fontWeight: 700,
          fontFamily: "'Cinzel Decorative', serif", letterSpacing: 2,
          boxShadow: "0 4px 24px rgba(200,134,10,0.5), 0 0 0 1px rgba(200,134,10,0.2)",
          zIndex: 50, animation: "shimmer 3s linear infinite, pulse-glow 2s ease infinite",
          whiteSpace: "nowrap",
        }}>
          ✦ Adicionar Item
        </button>

      </div>
    </>
  );
}
