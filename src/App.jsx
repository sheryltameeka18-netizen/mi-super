import { useEffect, useMemo, useState } from "react";
import {
  Apple,
  ArrowRight,
  Beef,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Coffee,
  CupSoda,
  Egg,
  Home,
  Leaf,
  ListChecks,
  Menu,
  Minus,
  Milk,
  Package,
  PartyPopper,
  Pencil,
  Plus,
  Repeat2,
  Search,
  Settings2,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  SprayCan,
  Trash2,
  X,
} from "lucide-react";

import { supabase } from "./supabaseClient";
import "./App.css";

const categories = [
  { name: "Frutas y verduras", icon: Apple, color: "green" },
  { name: "Lácteos", icon: Milk, color: "blue" },
  { name: "Carnes", icon: Beef, color: "red" },
  { name: "Panadería", icon: Package, color: "orange" },
  { name: "Bebidas", icon: CupSoda, color: "purple" },
  { name: "Limpieza", icon: SprayCan, color: "yellow" },
];

const suggestions = [
  { name: "Leche", icon: Milk, category: "Lácteos" },
  { name: "Pan", icon: Package, category: "Panadería" },
  { name: "Huevos", icon: Egg, category: "Lácteos" },
  { name: "Arroz", icon: Leaf, category: "Almacén" },
  { name: "Café", icon: Coffee, category: "Bebidas" },
  { name: "Papel higiénico", icon: Package, category: "Limpieza" },
];

function getVisual(name) {
  const value = String(name || "").toLowerCase();

  if (
    value.includes("leche") ||
    value.includes("queso") ||
    value.includes("yogur") ||
    value.includes("manteca")
  ) {
    return Milk;
  }

  if (
    value.includes("huevo") ||
    value.includes("pollo") ||
    value.includes("carne") ||
    value.includes("pescado")
  ) {
    return Beef;
  }

  if (
    value.includes("manzana") ||
    value.includes("banana") ||
    value.includes("plátano") ||
    value.includes("platano") ||
    value.includes("tomate") ||
    value.includes("lechuga") ||
    value.includes("fruta") ||
    value.includes("verdura")
  ) {
    return Apple;
  }

  if (
    value.includes("pan") ||
    value.includes("galleta") ||
    value.includes("factura")
  ) {
    return Package;
  }

  if (
    value.includes("café") ||
    value.includes("cafe") ||
    value.includes("té") ||
    value.includes("te")
  ) {
    return Coffee;
  }

  if (
    value.includes("agua") ||
    value.includes("jugo") ||
    value.includes("gaseosa") ||
    value.includes("bebida")
  ) {
    return CupSoda;
  }

  if (
    value.includes("jabón") ||
    value.includes("jabon") ||
    value.includes("detergente") ||
    value.includes("limpieza") ||
    value.includes("papel")
  ) {
    return SprayCan;
  }

  return Package;
}

function App() {
  const [session, setSession] = useState(null);
  const [lists, setLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);

  const [newListName, setNewListName] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState("unidad");

  const [search, setSearch] = useState("");
  const [showNewList, setShowNewList] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activeSection, setActiveSection] = useState("inicio");

  useEffect(() => {
    let mounted = true;

    async function start() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(session);
      setLoading(false);
    }

    start();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session?.user) {
      loadLists();
    } else {
      setLists([]);
      setSelectedList(null);
      setItems([]);
    }
  }, [session]);

  useEffect(() => {
    if (selectedList?.id) {
      loadItems(selectedList.id);
    } else {
      setItems([]);
    }
  }, [selectedList]);

  async function loadLists() {
    const { data, error } = await supabase
      .from("lists")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    const safeLists = Array.isArray(data) ? data : [];

    setLists(safeLists);

    if (safeLists.length > 0) {
      setSelectedList((current) => {
        if (current) {
          const exists = safeLists.find((list) => list.id === current.id);
          if (exists) return exists;
        }

        return safeLists[0];
      });
    } else {
      setSelectedList(null);
    }
  }

  async function loadItems(listId) {
    setLoadingItems(true);

    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("list_id", listId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      setItems([]);
      setLoadingItems(false);
      return;
    }

    setItems(Array.isArray(data) ? data : []);
    setLoadingItems(false);
  }

  async function createList(e) {
    e.preventDefault();

    const name = newListName.trim();

    if (!name || !session?.user) return;

    const { data, error } = await supabase
      .from("lists")
      .insert([
        {
          name,
          user_id: session.user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error(error);
      alert("No se pudo crear la lista.");
      return;
    }

    setNewListName("");
    setShowNewList(false);

    setLists((current) => [data, ...current]);
    setSelectedList(data);
    setActiveSection("listas");
  }

  async function deleteList(listId) {
    if (!listId) return;

    const confirmed = window.confirm(
      "¿Quieres eliminar esta lista? También se eliminarán sus productos."
    );

    if (!confirmed) return;

    const { error: itemsError } = await supabase
      .from("items")
      .delete()
      .eq("list_id", listId);

    if (itemsError) {
      console.error(itemsError);
      return;
    }

    const { error } = await supabase
      .from("lists")
      .delete()
      .eq("id", listId);

    if (error) {
      console.error(error);
      return;
    }

    const remaining = lists.filter((list) => list.id !== listId);

    setLists(remaining);
    setSelectedList(remaining[0] || null);
    setItems([]);
  }

  async function addItem(e) {
    e?.preventDefault();

    const name = newItemName.trim();

    if (!name || !selectedList?.id) return;

    const quantity = Math.max(1, Number(newItemQuantity) || 1);
    const unit = newItemUnit || "unidad";

    const { data, error } = await supabase
      .from("items")
      .insert([
        {
          name,
          have: false,
          list_id: selectedList.id,
          quantity,
          unit,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error(error);
      alert("No se pudo agregar el producto.");
      return;
    }

    setItems((current) => [...current, data]);
    setNewItemName("");
    setNewItemQuantity(1);
    setNewItemUnit("unidad");
  }

  async function addSuggestion(product) {
    if (!selectedList?.id) return;

    const alreadyExists = items.some(
      (item) => item.name.toLowerCase() === product.name.toLowerCase()
    );

    if (alreadyExists) {
      return;
    }

    const { data, error } = await supabase
      .from("items")
      .insert([
        {
          name: product.name,
          have: false,
          list_id: selectedList.id,
          quantity: 1,
          unit: "unidad",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error(error);
      return;
    }

    setItems((current) => [...current, data]);
  }

  async function toggleItem(item) {
    const { error } = await supabase
      .from("items")
      .update({ have: !item.have })
      .eq("id", item.id);

    if (error) {
      console.error(error);
      return;
    }

    setItems((current) =>
      current.map((currentItem) =>
        currentItem.id === item.id
          ? { ...currentItem, have: !item.have }
          : currentItem
      )
    );
  }

  async function changeQuantity(item, amount) {
    const currentQuantity = Number(item.quantity) || 1;
    const nextQuantity = Math.max(1, currentQuantity + amount);

    const { error } = await supabase
      .from("items")
      .update({ quantity: nextQuantity })
      .eq("id", item.id);

    if (error) {
      console.error(error);
      return;
    }

    setItems((current) =>
      current.map((currentItem) =>
        currentItem.id === item.id
          ? { ...currentItem, quantity: nextQuantity }
          : currentItem
      )
    );
  }

  async function deleteItem(itemId) {
    const { error } = await supabase
      .from("items")
      .delete()
      .eq("id", itemId);

    if (error) {
      console.error(error);
      return;
    }

    setItems((current) => current.filter((item) => item.id !== itemId));
  }

  async function signIn() {
    const email = window.prompt("Escribe tu correo:");

    if (!email) return;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Revisa tu correo para entrar a Mi Súper.");
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  const safeItems = Array.isArray(items) ? items : [];
  const safeLists = Array.isArray(lists) ? lists : [];

  const boughtCount = safeItems.filter((item) => item.have).length;
  const totalCount = safeItems.length;

  const progress =
    totalCount > 0 ? Math.round((boughtCount / totalCount) * 100) : 0;

  const filteredItems = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return safeItems;

    return safeItems.filter((item) =>
      String(item.name || "").toLowerCase().includes(value)
    );
  }, [safeItems, search]);

  const frequentProducts = useMemo(() => {
    const names = new Set();

    safeItems.forEach((item) => {
      if (item.name) names.add(item.name);
    });

    suggestions.forEach((item) => {
      if (names.size < 8) names.add(item.name);
    });

    return Array.from(names).slice(0, 8);
  }, [safeItems]);

  function scrollTo(id) {
    setActiveSection(id);

    const element = document.getElementById(id);

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }

    setShowMobileMenu(false);
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">
          <ShoppingCart size={28} />
        </div>
        <strong>Mi Súper</strong>
        <span>Cargando tu espacio...</span>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="auth-page">
        <div className="auth-background-shape shape-one" />
        <div className="auth-background-shape shape-two" />

        <div className="auth-card">
          <div className="auth-logo">
            <ShoppingCart size={30} />
          </div>

          <span className="eyebrow">ORGANIZA TU COMPRA</span>

          <h1>
            Tu compra,
            <br />
            <span>organizada.</span>
          </h1>

          <p>
            Crea listas, organiza tus productos y marca lo que ya compraste.
            Todo en un solo lugar.
          </p>

          <button className="primary-button auth-button" onClick={signIn}>
            Entrar a Mi Súper
            <ArrowRight size={18} />
          </button>

          <div className="auth-note">
            <CheckCircle2 size={16} />
            <span>Simple, rápido y pensado para tu día a día.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="navbar">
        <div className="nav-inner">
          <button
            className="brand"
            onClick={() => scrollTo("inicio")}
            aria-label="Ir al inicio"
          >
            <span className="brand-icon">
              <ShoppingCart size={21} />
            </span>
            <span>
              <strong>Mi Súper</strong>
              <small>Tu compra, organizada.</small>
            </span>
          </button>

          <nav className={`nav-links ${showMobileMenu ? "open" : ""}`}>
            <button
              className={activeSection === "inicio" ? "active" : ""}
              onClick={() => scrollTo("inicio")}
            >
              Inicio
            </button>

            <button
              className={activeSection === "listas" ? "active" : ""}
              onClick={() => scrollTo("listas")}
            >
              Mis listas
            </button>

            <button
              className={activeSection === "comprar" ? "active" : ""}
              onClick={() => scrollTo("comprar")}
            >
              Compra
            </button>

            <button
              className={activeSection === "como-funciona" ? "active" : ""}
              onClick={() => scrollTo("como-funciona")}
            >
              Cómo funciona
            </button>
          </nav>

          <div className="nav-actions">
            <button className="icon-button" title="Notificaciones">
              <Bell size={19} />
            </button>

            <button className="profile-button" onClick={signOut}>
              <span className="profile-avatar">
                {session.user.email?.charAt(0).toUpperCase() || "U"}
              </span>
              <span className="profile-email">
                {session.user.email?.split("@")[0]}
              </span>
            </button>

            <button
              className="mobile-menu-button"
              onClick={() => setShowMobileMenu((value) => !value)}
            >
              {showMobileMenu ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero" id="inicio">
          <div className="hero-grid">
            <div className="hero-copy">
              <span className="eyebrow">
                <Sparkles size={15} />
                ORGANIZA • PLANIFICA • COMPRA
              </span>

              <h1>
                Tu compra,
                <br />
                <span>mucho más simple.</span>
              </h1>

              <p className="hero-description">
                Crea tus listas de compras, agrega productos, controla
                cantidades y marca lo que ya compraste mientras recorres el
                supermercado.
              </p>

              <div className="hero-buttons">
                <button
                  className="primary-button"
                  onClick={() => {
                    setShowNewList(true);
                    scrollTo("listas");
                  }}
                >
                  Crear una lista
                  <ArrowRight size={18} />
                </button>

                <button
                  className="secondary-button"
                  onClick={() => scrollTo("como-funciona")}
                >
                  Ver cómo funciona
                </button>
              </div>

              <div className="hero-trust">
                <div className="trust-item">
                  <CheckCircle2 size={17} />
                  <span>Listas organizadas</span>
                </div>

                <div className="trust-item">
                  <CheckCircle2 size={17} />
                  <span>Progreso en tiempo real</span>
                </div>
              </div>
            </div>

            <div className="hero-visual">
              <div className="hero-glow" />

              <div className="hero-dashboard">
                <div className="dashboard-top">
                  <div>
                    <span>LISTA ACTUAL</span>
                    <h3>
                      {selectedList?.name || "Mi compra"}
                    </h3>
                  </div>

                  <div className="dashboard-calendar">
                    <CalendarDays size={19} />
                  </div>
                </div>

                <div className="dashboard-progress">
                  <div className="progress-label">
                    <span>Progreso</span>
                    <strong>{progress}%</strong>
                  </div>

                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <small>
                    {boughtCount} de {totalCount} productos comprados
                  </small>
                </div>

                <div className="dashboard-products">
                  {(safeItems.length > 0
                    ? safeItems.slice(0, 4)
                    : [
                        { id: 1, name: "Leche", quantity: 2, unit: "litros" },
                        { id: 2, name: "Huevos", quantity: 12, unit: "unidades" },
                        { id: 3, name: "Café", quantity: 1, unit: "paquete" },
                        { id: 4, name: "Manzanas", quantity: 6, unit: "unidades" },
                      ]
                  ).map((item, index) => {
                    const Icon = getVisual(item.name);

                    return (
                      <div
                        className={`dashboard-product ${
                          item.have ? "done" : ""
                        }`}
                        key={item.id || index}
                      >
                        <span className="product-check">
                          {item.have ? <Check size={14} /> : ""}
                        </span>

                        <span className="product-icon">
                          <Icon size={17} />
                        </span>

                        <span className="product-name">
                          {item.name}
                        </span>

                        <span className="product-quantity">
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="floating-card floating-card-top">
                <div className="floating-icon green-bg">
                  <Check size={18} />
                </div>
                <div>
                  <strong>Producto comprado</strong>
                  <span>Leche • 2 litros</span>
                </div>
              </div>

              <div className="floating-card floating-card-bottom">
                <div className="floating-icon purple-bg">
                  <ListChecks size={18} />
                </div>
                <div>
                  <strong>Lista organizada</strong>
                  <span>12 productos</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="intro-section">
          <div className="intro-grid">
            <div className="intro-label">
              <span className="eyebrow">¿QUÉ ES MI SÚPER?</span>
            </div>

            <div className="intro-content">
              <h2>
                No somos un supermercado.
                <br />
                <span>Somos tu forma de organizarlo.</span>
              </h2>

              <p>
                Mi Súper es una herramienta para planificar tus compras antes
                de salir de casa y llevar el control mientras compras.
              </p>

              <div className="intro-features">
                <div>
                  <ShoppingBag size={20} />
                  <span>Planifica</span>
                </div>

                <div>
                  <ListChecks size={20} />
                  <span>Organiza</span>
                </div>

                <div>
                  <CheckCircle2 size={20} />
                  <span>Marca</span>
                </div>

                <div>
                  <Repeat2 size={20} />
                  <span>Repite</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="stats-section">
          <div className="stat-card">
            <span className="stat-number">{safeLists.length}</span>
            <span className="stat-label">listas creadas</span>
          </div>

          <div className="stat-card">
            <span className="stat-number">{totalCount}</span>
            <span className="stat-label">productos actuales</span>
          </div>

          <div className="stat-card">
            <span className="stat-number">{boughtCount}</span>
            <span className="stat-label">productos comprados</span>
          </div>

          <div className="stat-card">
            <span className="stat-number">{progress}%</span>
            <span className="stat-label">progreso actual</span>
          </div>
        </section>

        <section className="section" id="como-funciona">
          <div className="section-heading">
            <div>
              <span className="eyebrow">CÓMO FUNCIONA</span>
              <h2>De la lista al supermercado.</h2>
            </div>

            <p>
              Todo lo que necesitas para preparar y completar tus compras sin
              complicaciones.
            </p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <div className="step-icon">
                <Pencil size={23} />
              </div>
              <h3>Crea tu lista</h3>
              <p>
                Dale un nombre a tu compra: mensual, semanal, limpieza,
                cumpleaños o lo que necesites.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">02</div>
              <div className="step-icon">
                <ShoppingBag size={23} />
              </div>
              <h3>Agrega productos</h3>
              <p>
                Añade productos con cantidad y unidad para saber exactamente
                qué necesitas.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">03</div>
              <div className="step-icon">
                <CheckCircle2 size={23} />
              </div>
              <h3>Marca mientras compras</h3>
              <p>
                A medida que encuentras cada producto, márcalo y mira cómo
                avanza tu compra.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">04</div>
              <div className="step-icon">
                <Repeat2 size={23} />
              </div>
              <h3>Repite fácilmente</h3>
              <p>
                Guarda tus listas para poder volver a utilizarlas en futuras
                compras.
              </p>
            </div>
          </div>
        </section>

        <section className="section categories-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">ORGANIZA POR CATEGORÍA</span>
              <h2>Todo tiene su lugar.</h2>
            </div>
          </div>

          <div className="categories-grid">
            {categories.map((category) => {
              const Icon = category.icon;

              return (
                <div
                  className={`category-card category-${category.color}`}
                  key={category.name}
                >
                  <div className="category-icon">
                    <Icon size={25} />
                  </div>

                  <div>
                    <h3>{category.name}</h3>
                    <span>Organiza tus productos</span>
                  </div>

                  <ChevronRight size={19} />
                </div>
              );
            })}
          </div>
        </section>

        <section className="section lists-section" id="listas">
          <div className="section-heading lists-heading">
            <div>
              <span className="eyebrow">TUS LISTAS</span>
              <h2>Organiza cada compra.</h2>
            </div>

            <button
              className="primary-button small"
              onClick={() => setShowNewList(true)}
            >
              <Plus size={18} />
              Nueva lista
            </button>
          </div>

          {showNewList && (
            <form className="new-list-card" onSubmit={createList}>
              <div>
                <span className="eyebrow">NUEVA LISTA</span>
                <h3>¿Qué vas a comprar?</h3>
              </div>

              <div className="new-list-form">
                <input
                  autoFocus
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="Ej. Compra de octubre"
                />

                <button className="primary-button" type="submit">
                  Crear lista
                  <ArrowRight size={18} />
                </button>

                <button
                  className="close-button"
                  type="button"
                  onClick={() => setShowNewList(false)}
                >
                  <X size={20} />
                </button>
              </div>
            </form>
          )}

          {safeLists.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <ListChecks size={32} />
              </div>

              <h3>Aún no tienes listas</h3>

              <p>
                Crea tu primera lista y empieza a organizar tu próxima compra.
              </p>

              <button
                className="primary-button"
                onClick={() => setShowNewList(true)}
              >
                Crear mi primera lista
                <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <div className="lists-grid">
              {safeLists.map((list) => {
                const active = selectedList?.id === list.id;

                return (
                  <div
                    className={`list-card ${active ? "selected" : ""}`}
                    key={list.id}
                  >
                    <button
                      className="list-card-main"
                      onClick={() => {
                        setSelectedList(list);
                        setActiveSection("comprar");
                        setTimeout(() => scrollTo("comprar"), 50);
                      }}
                    >
                      <div className="list-card-icon">
                        <ShoppingBag size={23} />
                      </div>

                      <div className="list-card-content">
                        <span className="list-card-label">
                          {active ? "LISTA ACTIVA" : "LISTA"}
                        </span>

                        <h3>{list.name}</h3>

                        <span>
                          {active
                            ? `${totalCount} productos`
                            : "Abrir lista"}
                        </span>
                      </div>

                      <ChevronRight size={20} />
                    </button>

                    <button
                      className="list-delete"
                      title="Eliminar lista"
                      onClick={() => deleteList(list.id)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="shopping-section" id="comprar">
          <div className="shopping-container">
            <div className="shopping-header">
              <div>
                <span className="eyebrow">MODO COMPRA</span>

                <h2>
                  {selectedList?.name || "Selecciona una lista"}
                </h2>

                {selectedList && (
                  <p>
                    Marca cada producto cuando ya esté en tu carrito.
                  </p>
                )}
              </div>

              {selectedList && (
                <div className="shopping-progress-card">
                  <div className="shopping-progress-number">
                    {progress}%
                  </div>

                  <div>
                    <strong>
                      {boughtCount} de {totalCount}
                    </strong>
                    <span>productos comprados</span>
                  </div>
                </div>
              )}
            </div>

            {!selectedList ? (
              <div className="shopping-empty">
                <div className="shopping-empty-icon">
                  <ShoppingCart size={35} />
                </div>

                <h3>Selecciona una lista para comenzar</h3>

                <p>
                  Elige una de tus listas o crea una nueva para empezar.
                </p>

                <button
                  className="primary-button"
                  onClick={() => scrollTo("listas")}
                >
                  Ver mis listas
                  <ArrowRight size={18} />
                </button>
              </div>
            ) : (
              <div className="shopping-layout">
                <div className="shopping-main">
                  <form className="add-product-card" onSubmit={addItem}>
                    <div className="add-product-icon">
                      <Plus size={22} />
                    </div>

                    <div className="add-product-fields">
                      <input
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="¿Qué necesitas comprar?"
                      />

                      <div className="quantity-fields">
                        <input
                          type="number"
                          min="1"
                          value={newItemQuantity}
                          onChange={(e) =>
                            setNewItemQuantity(e.target.value)
                          }
                        />

                        <select
                          value={newItemUnit}
                          onChange={(e) => setNewItemUnit(e.target.value)}
                        >
                          <option value="unidad">unidad</option>
                          <option value="unidades">unidades</option>
                          <option value="kg">kg</option>
                          <option value="g">g</option>
                          <option value="litro">litro</option>
                          <option value="litros">litros</option>
                          <option value="paquete">paquete</option>
                          <option value="paquetes">paquetes</option>
                          <option value="botella">botella</option>
                          <option value="botellas">botellas</option>
                        </select>
                      </div>
                    </div>

                    <button className="primary-button" type="submit">
                      Agregar
                      <Plus size={17} />
                    </button>
                  </form>

                  <div className="shopping-toolbar">
                    <div className="search-box">
                      <Search size={18} />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar en esta lista..."
                      />

                      {search && (
                        <button onClick={() => setSearch("")}>
                          <X size={16} />
                        </button>
                      )}
                    </div>

                    <span className="product-count">
                      {filteredItems.length} productos
                    </span>
                  </div>

                  {loadingItems ? (
                    <div className="products-loading">
                      <div className="mini-spinner" />
                      Cargando productos...
                    </div>
                  ) : filteredItems.length === 0 ? (
                    <div className="products-empty">
                      <div className="products-empty-icon">
                        <ShoppingBag size={30} />
                      </div>

                      <h3>
                        {search
                          ? "No encontramos ese producto"
                          : "Tu lista está vacía"}
                      </h3>

                      <p>
                        {search
                          ? "Prueba con otro nombre."
                          : "Agrega tu primer producto arriba."}
                      </p>
                    </div>
                  ) : (
                    <div className="shopping-products">
                      {filteredItems.map((item) => {
                        const Icon = getVisual(item.name);

                        return (
                          <div
                            className={`shopping-product ${
                              item.have ? "completed" : ""
                            }`}
                            key={item.id}
                          >
                            <button
                              className={`check-product ${
                                item.have ? "checked" : ""
                              }`}
                              onClick={() => toggleItem(item)}
                              title={
                                item.have
                                  ? "Marcar como pendiente"
                                  : "Marcar como comprado"
                              }
                            >
                              {item.have && <Check size={16} />}
                            </button>

                            <div className="shopping-product-icon">
                              <Icon size={21} />
                            </div>

                            <div className="shopping-product-info">
                              <strong>{item.name}</strong>

                              <span>
                                {item.quantity} {item.unit}
                              </span>
                            </div>

                            <div className="quantity-control">
                              <button
                                onClick={() => changeQuantity(item, -1)}
                                disabled={Number(item.quantity) <= 1}
                              >
                                <Minus size={15} />
                              </button>

                              <span>{item.quantity}</span>

                              <button
                                onClick={() => changeQuantity(item, 1)}
                              >
                                <Plus size={15} />
                              </button>
                            </div>

                            <button
                              className="delete-product"
                              onClick={() => deleteItem(item.id)}
                              title="Eliminar producto"
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <aside className="shopping-sidebar">
                  <div className="sidebar-card">
                    <div className="sidebar-title">
                      <Sparkles size={18} />
                      <h3>Ideas para tu lista</h3>
                    </div>

                    <p>
                      Agrega productos frecuentes con un solo clic.
                    </p>

                    <div className="suggestion-list">
                      {suggestions.map((suggestion) => {
                        const Icon = suggestion.icon;

                        const exists = safeItems.some(
                          (item) =>
                            item.name.toLowerCase() ===
                            suggestion.name.toLowerCase()
                        );

                        return (
                          <button
                            className={`suggestion-item ${
                              exists ? "exists" : ""
                            }`}
                            key={suggestion.name}
                            onClick={() => addSuggestion(suggestion)}
                            disabled={exists}
                          >
                            <span className="suggestion-icon">
                              <Icon size={17} />
                            </span>

                            <span>
                              <strong>{suggestion.name}</strong>
                              <small>{suggestion.category}</small>
                            </span>

                            {exists ? (
                              <Check size={17} />
                            ) : (
                              <Plus size={17} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="sidebar-card">
                    <div className="sidebar-title">
                      <Settings2 size={18} />
                      <h3>Resumen</h3>
                    </div>

                    <div className="summary-row">
                      <span>Total</span>
                      <strong>{totalCount}</strong>
                    </div>

                    <div className="summary-row">
                      <span>Comprados</span>
                      <strong>{boughtCount}</strong>
                    </div>

                    <div className="summary-row">
                      <span>Pendientes</span>
                      <strong>{totalCount - boughtCount}</strong>
                    </div>

                    <div className="sidebar-progress">
                      <div
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    {progress === 100 && totalCount > 0 && (
                      <div className="completion-message">
                        <PartyPopper size={19} />
                        <span>¡Compra completada!</span>
                      </div>
                    )}
                  </div>
                </aside>
              </div>
            )}
          </div>
        </section>

        <section className="section frequent-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">TUS PRODUCTOS</span>
              <h2>Lo que compras frecuentemente.</h2>
            </div>

            <p>
              Mi Súper puede ayudarte a tener a mano los productos que más
              utilizas.
            </p>
          </div>

          <div className="frequent-grid">
            {frequentProducts.map((name) => {
              const Icon = getVisual(name);

              return (
                <div className="frequent-card" key={name}>
                  <div className="frequent-icon">
                    <Icon size={20} />
                  </div>

                  <span>{name}</span>

                  <ChevronRight size={17} />
                </div>
              );
            })}
          </div>
        </section>

        <section className="integration-section">
          <div className="integration-inner">
            <div className="integration-copy">
              <span className="eyebrow light">PENSADO PARA CRECER</span>

              <h2>
                Tu lista hoy.
                <br />
                Más posibilidades mañana.
              </h2>

              <p>
                Mi Súper está pensado para evolucionar con nuevas funciones,
                como productos frecuentes, listas recurrentes, historial y
                futuras integraciones con servicios externos.
              </p>

              <div className="integration-points">
                <div>
                  <CheckCircle2 size={18} />
                  <span>Historial de compras</span>
                </div>

                <div>
                  <CheckCircle2 size={18} />
                  <span>Listas recurrentes</span>
                </div>

                <div>
                  <CheckCircle2 size={18} />
                  <span>Productos frecuentes</span>
                </div>
              </div>
            </div>

            <div className="integration-visual">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />

              <div className="integration-center">
                <ShoppingCart size={42} />
                <strong>Mi Súper</strong>
              </div>

              <div className="orbit-node node-one">
                <ListChecks size={20} />
              </div>

              <div className="orbit-node node-two">
                <Repeat2 size={20} />
              </div>

              <div className="orbit-node node-three">
                <ShoppingBag size={20} />
              </div>
            </div>
          </div>
        </section>

        <section className="final-cta">
          <div>
            <span className="eyebrow">EMPIEZA HOY</span>
            <h2>Tu próxima compra puede ser mucho más simple.</h2>
            <p>
              Crea una lista, agrega lo que necesitas y deja que Mi Súper
              organice el resto.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() => {
              setShowNewList(true);
              scrollTo("listas");
            }}
          >
            Crear mi lista
            <ArrowRight size={18} />
          </button>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="brand">
              <span className="brand-icon">
                <ShoppingCart size={20} />
              </span>

              <span>
                <strong>Mi Súper</strong>
                <small>Tu compra, organizada.</small>
              </span>
            </div>

            <p>
              Una forma sencilla de planificar, organizar y completar tus
              compras.
            </p>
          </div>

          <div className="footer-column">
            <span>PRODUCTO</span>
            <button onClick={() => scrollTo("listas")}>Mis listas</button>
            <button onClick={() => scrollTo("comprar")}>Modo compra</button>
            <button onClick={() => scrollTo("como-funciona")}>
              Cómo funciona
            </button>
          </div>

          <div className="footer-column">
            <span>CUENTA</span>
            <button onClick={signOut}>Cerrar sesión</button>
            <button onClick={() => scrollTo("inicio")}>Inicio</button>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 Mi Súper</span>
          <span>Organiza → planifica → compra → marca → repite.</span>
        </div>
      </footer>
    </div>
  );
}

export default App;