import React, { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, ArrowUpRight, CalendarDays, CheckCircle2,
  ChevronDown, CircleHelp, ClipboardList, Clock3, Command, FileText,
  LayoutDashboard, LogOut, Menu, Plus, RefreshCw, ShieldCheck,
  Users, X
} from "lucide-react";
import { supabase, supabaseConfigured } from "./supabase";

const EVENT_DATE = "2026-12-19T15:00:00+07:00";

const fmtDate = (v) =>
  v
    ? new Date(`${v}T00:00:00`).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      })
    : "—";

const today = () => new Date().toISOString().slice(0, 10);

const statusLabels = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  done: "Done"
};

const priorityLabels = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical"
};

function daysUntil(date) {
  const target = new Date(date).getTime();
  const now = Date.now();

  return Math.max(
    0,
    Math.floor((target - now) / 86400000)
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("overview");
  const [mobileNav, setMobileNav] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!supabaseConfigured) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      if (!session?.user) { setProfile(null); setLoading(false); return; }
      setLoading(true);
      const { data, error: e } = await supabase.from("profiles")
        .select("id, full_name, role, division_id, division:divisions!profiles_division_id_fkey(id, code, name)")
        .eq("id", session.user.id).single();
      if (!active) return;
      if (e) setError(`Gagal memuat profil: ${e.message}`);
      setProfile(data || null);
      setLoading(false);
    }
    loadProfile();
    return () => { active = false; };
  }, [session]);

  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(""), 3200); };

  if (!supabaseConfigured) return <SetupScreen />;
  if (loading) return <div className="loading-screen"><div className="loader" />Memuat CEOPHORIA Command Center…</div>;
  if (!session) return <Login onError={setError} />;
  if (!profile) return <div className="loading-screen"><div className="notice"><ShieldCheck size={22}/><h2>Profil belum tersedia</h2><p>Akun berhasil login, tetapi profilnya belum ditemukan di tabel <code>profiles</code>. Periksa trigger dan pemetaan akun di Supabase.</p><button className="btn primary" onClick={() => supabase.auth.signOut()}>Keluar</button></div></div>;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Command size={22}/></div>
          <div><strong>CEOPHORIA</strong><span>COMMAND CENTER</span></div>
          <button className="icon-btn mobile-close" onClick={() => setMobileNav(false)}><X size={18}/></button>
        </div>
        <div className="workspace-label">EVENT OPERATIONS</div>
        <nav>
          <NavItem icon={<LayoutDashboard size={18}/>} label="Overview" active={page==="overview"} onClick={()=>{setPage("overview");setMobileNav(false)}}/>
          <NavItem icon={<ClipboardList size={18}/>} label="Task Management" active={page==="tasks"} onClick={()=>{setPage("tasks");setMobileNav(false)}}/>
          <NavItem icon={<Users size={18}/>} label="Divisions" active={page==="divisions"} onClick={()=>{setPage("divisions");setMobileNav(false)}}/>
          <NavItem icon={<CalendarDays size={18}/>} label="Timeline & Milestones" active={page==="timeline"} onClick={()=>{setPage("timeline");setMobileNav(false)}}/>
          <NavItem icon={<Activity size={18}/>} label="Activity Feed" active={page==="activity"} onClick={()=>{setPage("activity");setMobileNav(false)}}/>
          <NavItem icon={<FileText size={18}/>} label="Daily Briefing" active={page==="briefing"} onClick={()=>{setPage("briefing");setMobileNav(false)}}/>
          <NavItem icon={<AlertTriangle size={18}/>} label="Issues & Risks" active={page==="issues"} onClick={()=>{setPage("issues");setMobileNav(false)}}/>
        </nav>
        <div className="sidebar-bottom">
          <div className="event-chip"><span className="pulse-dot"/><div><b>CEOPHORIA 2026</b><small>19 December 2026</small></div></div>
          <div className="user-card">
            <div className="avatar">{(profile.full_name || "U").slice(0,1).toUpperCase()}</div>
            <div className="user-meta"><b>{profile.full_name}</b><small>{profile.role === "super_admin" ? "Super Admin" : profile.division?.name || "Coordinator"}</small></div>
            <button className="icon-btn" title="Keluar" onClick={() => supabase.auth.signOut()}><LogOut size={17}/></button>
          </div>
        </div>
      </aside>
      {mobileNav && <div className="scrim" onClick={()=>setMobileNav(false)}/>}
      <main className="main-area">
        <header className="topbar">
          <button className="icon-btn mobile-menu" onClick={()=>setMobileNav(true)}><Menu size={20}/></button>
          <div className="breadcrumb">Central Event Organizer <span>/</span> <b>{pageTitle(page)}</b></div>
          <div className="topbar-right"><span className="live-indicator"><i/> LIVE DATA</span><button className="icon-btn" onClick={()=>window.location.reload()} title="Refresh"><RefreshCw size={17}/></button></div>
        </header>
        {error && <div className="error-banner">{error}<button onClick={()=>setError("")}><X size={16}/></button></div>}
        <div className="content">
          {page === "overview" && <Overview profile={profile} notify={notify}/>}
          {page === "tasks" && <Tasks profile={profile} notify={notify}/>}
          {page === "divisions" && <Divisions profile={profile}/>}
          {page === "timeline" && <Timeline profile={profile}/>}
          {page === "activity" && <ActivityPage profile={profile}/>}
          {page === "briefing" && <Briefing profile={profile} notify={notify}/>}
          {page === "issues" && <Issues profile={profile} notify={notify}/>}
        </div>
        <footer className="footer">CENTRAL EVENT ORGANIZER <span>•</span> CEOPHORIA COMMAND CENTER <span>•</span> V1.0</footer>
      </main>
      {toast && <div className="toast"><CheckCircle2 size={17}/>{toast}</div>}
    </div>
  );
}

function SetupScreen() {
  return <div className="login-wrap"><div className="login-card"><div className="brand-mark large"><Command size={26}/></div><p className="eyebrow">CONFIGURATION REQUIRED</p><h1>Hubungkan Supabase</h1><p>Buat file <code>.env</code> dari <code>.env.example</code>, lalu isi Project URL dan Publishable Key Supabase.</p><div className="setup-code">VITE_SUPABASE_URL=…<br/>VITE_SUPABASE_PUBLISHABLE_KEY=…</div><p className="muted">Jangan gunakan Secret Key atau service_role key di frontend.</p></div></div>;
}

function Login({ onError }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setBusy(true); onError("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) onError(error.message);
    setBusy(false);
  }
  return <div className="login-wrap"><div className="login-card">
    <div className="login-brand"><div className="brand-mark large"><Command size={26}/></div><div><b>CEOPHORIA</b><span>COMMAND CENTER</span></div></div>
    <p className="eyebrow">EVENT OPERATIONS MANAGEMENT</p><h1>Masuk ke Command Center</h1><p className="muted">Gunakan akun Super Admin atau akun koordinator divisi.</p>
    <form onSubmit={submit} className="form-stack"><label>Email<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="nama@ceophoria.com"/></label><label>Password<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Masukkan password"/></label><button className="btn primary full" disabled={busy}>{busy ? "Memproses…" : "Masuk"}</button></form>
    <p className="login-foot">Akses terbatas untuk tim operasional CEOPHORIA.</p>
  </div></div>;
}

function NavItem({icon,label,active,onClick}) { return <button className={`nav-item ${active?"active":""}`} onClick={onClick}>{icon}<span>{label}</span>{active&&<span className="nav-active"/>}</button>; }
function pageTitle(p) { return ({overview:"Overview",tasks:"Task Management",divisions:"Divisions",timeline:"Timeline & Milestones",activity:"Activity Feed",briefing:"Daily Briefing",issues:"Issues & Risks"})[p] || "Overview"; }
function PageHeading({eyebrow,title,description,action}) { return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="muted">{description}</p></div>{action}</div>; }
function StatCard({label,value,sub,icon,accent}) { return <div className="stat-card"><div className={`stat-icon ${accent||""}`}>{icon}</div><div className="stat-copy"><span>{label}</span><strong>{value}</strong><small>{sub}</small></div></div>; }
function Empty({text="Belum ada data."}) { return <div className="empty-state"><CircleHelp size={22}/><span>{text}</span></div>; }
function LoadingLine() { return <div className="loading-line"><span/></div>; }

function useData(profile) {
  const [data,setData] = useState({tasks:[],divisions:[],activities:[],issues:[],milestones:[]});
  const [busy,setBusy] = useState(true);
  const [err,setErr] = useState("");
  async function refresh() {
    if (!profile) return;
    setBusy(true); setErr("");
    const [t,d,a,i,m] = await Promise.all([
      supabase.from("tasks").select("*, division:divisions!tasks_primary_division_id_fkey(id,code,name)").order("deadline",{ascending:true}),
      supabase.from("divisions").select("*").order("name"),
      supabase.from("activity_logs").select("*, profile:profiles!activity_logs_user_id_fkey(full_name), task:tasks!activity_logs_task_id_fkey(title)").order("created_at",{ascending:false}).limit(12),
      supabase.from("issues").select("*, division:divisions!issues_division_id_fkey(name)").order("created_at",{ascending:false}).limit(50),
      supabase.from("milestones").select("*, division:divisions!milestones_division_id_fkey(name)").order("deadline",{ascending:true})
    ]);
    const firstError = [t,d,a,i,m].find(x=>x.error)?.error;
    if (firstError) setErr(firstError.message);
    setData({tasks:t.data||[],divisions:d.data||[],activities:a.data||[],issues:i.data||[],milestones:m.data||[]});
    setBusy(false);
  }
  useEffect(()=>{refresh()},[profile?.id]);
  return {...data,busy,err,refresh};
}

function Overview({profile,notify}) {
  const data = useData(profile);
  const tasks = data.tasks;
  const done = tasks.filter(t=>t.status==="done").length;
  const overdue = tasks.filter(t=>t.status!=="done" && t.deadline && t.deadline < today()).length;
  const critical = tasks.filter(t=>t.status!=="done" && t.priority==="critical").length;
  const pct = tasks.length ? Math.round(done/tasks.length*100) : 0;
  const dLeft = daysUntil(EVENT_DATE);
  return <>
    <PageHeading eyebrow="EVENT CONTROL / 19 DECEMBER 2026" title="Overview" description={`Selamat datang, ${profile.full_name}. Berikut ringkasan operasional CEOPHORIA.`} action={<span className="countdown-pill"><Clock3 size={16}/><b>{dLeft}</b> hari menuju acara</span>}/>
    {data.err && <div className="error-banner inline">{data.err}</div>}
    <div className="stats-grid">
      <StatCard label="Total pekerjaan" value={tasks.length} sub="Seluruh tugas yang dapat Anda akses" icon={<ClipboardList size={19}/>}/>
      <StatCard label="Selesai" value={done} sub={`${pct}% dari total pekerjaan`} icon={<CheckCircle2 size={19}/>} accent="green"/>
      <StatCard label="Terlambat" value={overdue} sub="Melewati deadline" icon={<Clock3 size={19}/>} accent="orange"/>
      <StatCard label="Prioritas kritis" value={critical} sub="Belum berstatus selesai" icon={<AlertTriangle size={19}/>} accent="red"/>
    </div>
    <div className="overview-grid">
      <section className="panel readiness-panel"><div className="panel-heading"><div><p className="eyebrow">OPERATIONAL READINESS</p><h2>Penyelesaian pekerjaan</h2></div><span className="panel-tag">TASK COMPLETION</span></div>
        <div className="readiness-number">{pct}<small>%</small></div><div className="progress-track large"><span style={{width:`${pct}%`}}/></div><p className="muted small">{done} dari {tasks.length} pekerjaan telah selesai.</p>
        <div className="mini-breakdown"><span><i className="dot done"/>Selesai <b>{done}</b></span><span><i className="dot progress"/>Berjalan <b>{tasks.filter(t=>t.status==="in_progress").length}</b></span><span><i className="dot review"/>Review <b>{tasks.filter(t=>t.status==="review").length}</b></span><span><i className="dot todo"/>Belum mulai <b>{tasks.filter(t=>["backlog","todo"].includes(t.status)).length}</b></span></div>
      </section>
      <section className="panel"><div className="panel-heading"><div><p className="eyebrow">ATTENTION REQUIRED</p><h2>Pekerjaan perlu perhatian</h2></div><AlertTriangle size={19} className="muted-icon"/></div>
        {data.busy?<LoadingLine/>:([...tasks.filter(t=>t.status!=="done"&&(t.priority==="critical"||(t.deadline&&t.deadline<today())))].slice(0,5).length ? tasks.filter(t=>t.status!=="done"&&(t.priority==="critical"||(t.deadline&&t.deadline<today()))).slice(0,5).map(t=><div className="attention-row" key={t.id}><div><b>{t.title}</b><small>{t.division?.name||"Divisi"} · {t.deadline?`Deadline ${fmtDate(t.deadline)}`:"Tanpa deadline"}</small></div><span className={`priority ${t.priority}`}>{priorityLabels[t.priority]}</span></div>):<Empty text="Tidak ada tugas kritis atau terlambat."/>)}
      </section>
    </div>
    <div className="section-heading"><div><p className="eyebrow">DIVISION OVERVIEW</p><h2>Progres per divisi</h2></div></div>
    {data.busy?<LoadingLine/>:<div className="division-grid">{data.divisions.map(d=>{const list=tasks.filter(t=>t.primary_division_id===d.id);const n=list.length;const p=n?Math.round(list.filter(t=>t.status==="done").length/n*100):0;return <div className="division-card" key={d.id}><div className="division-top"><span className="division-code">{d.code}</span><span className="division-count">{n} tugas</span></div><b>{d.name}</b><div className="progress-track"><span style={{width:`${p}%`}}/></div><div className="division-foot"><span>{p}% selesai</span><span>{list.filter(t=>t.status==="done").length}/{n}</span></div></div>})}</div>}
    <div className="section-heading"><div><p className="eyebrow">LATEST UPDATES</p><h2>Aktivitas terbaru</h2></div></div>
    <ActivityList items={data.activities} busy={data.busy}/>
  </>;
}

function Tasks({profile,notify}) {
  const data=useData(profile);
  const [filter,setFilter]=useState("all");
  const [showForm,setShowForm]=useState(false);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({title:"",description:"",primary_division_id:profile.role==="super_admin"?"":profile.division_id||"",pic_name:"",priority:"medium",status:"backlog",progress:0,start_date:today(),deadline:""});
  const isAdmin=profile.role==="super_admin";
  const visibleTasks=data.tasks.filter(t=>filter==="all"||t.status===filter);
  async function createTask(e) {
    e.preventDefault();setSaving(true);
    const payload={...form,deadline:form.deadline||null,start_date:form.start_date||null,created_by:profile.id,progress:Number(form.progress)};
    if(!payload.primary_division_id) { notify("Pilih divisi penanggung jawab.");setSaving(false);return; }
    const {error}=await supabase.from("tasks").insert(payload);
    setSaving(false);
    if(error){notify(`Gagal membuat tugas: ${error.message}`);return;}
    setShowForm(false);setForm({title:"",description:"",primary_division_id:profile.division_id||"",pic_name:"",priority:"medium",status:"backlog",progress:0,start_date:today(),deadline:""});
    notify("Pekerjaan berhasil dibuat.");data.refresh();
  }
  async function updateTask(id,changes) {
    const {error}=await supabase.from("tasks").update(changes).eq("id",id);
    if(error)notify(`Gagal memperbarui: ${error.message}`);else{notify("Pekerjaan diperbarui.");data.refresh();}
  }
  return <>
    <PageHeading eyebrow="WORK CONTROL" title="Task Management" description="Kelola pekerjaan, PIC, prioritas, dan progres operasional." action={<button className="btn primary" onClick={()=>setShowForm(!showForm)}><Plus size={17}/> Tambah pekerjaan</button>}/>
    {data.err&&<div className="error-banner inline">{data.err}</div>}
    {showForm&&<section className="panel form-panel"><div className="panel-heading"><h2>Buat pekerjaan baru</h2><button className="icon-btn" onClick={()=>setShowForm(false)}><X size={18}/></button></div>
      <form className="task-form" onSubmit={createTask}>
        <label className="span-2">Nama pekerjaan<input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Contoh: Finalisasi layout venue"/></label>
        <label className="span-2">Deskripsi<textarea rows="2" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
        {isAdmin&&<label>Divisi penanggung jawab<select required value={form.primary_division_id} onChange={e=>setForm({...form,primary_division_id:e.target.value})}><option value="">Pilih divisi</option>{data.divisions.map(d=><option value={d.id} key={d.id}>{d.name}</option>)}</select></label>}
        <label>Nama PIC<input value={form.pic_name} onChange={e=>setForm({...form,pic_name:e.target.value})} placeholder="Nama anggota tim"/></label>
        <label>Prioritas<select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>{Object.entries(priorityLabels).map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label>
        <label>Status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>{Object.entries(statusLabels).map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label>
        <label>Tanggal mulai<input type="date" value={form.start_date} onChange={e=>setForm({...form,start_date:e.target.value})}/></label>
        <label>Deadline<input type="date" value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})}/></label>
        <div className="span-2 form-actions"><button className="btn primary" disabled={saving}>{saving?"Menyimpan…":"Simpan pekerjaan"}</button><button type="button" className="btn secondary" onClick={()=>setShowForm(false)}>Batal</button></div>
      </form>
    </section>}
    <div className="toolbar"><div className="filter-pills">{[["all","Semua"],["backlog","Backlog"],["todo","To Do"],["in_progress","In Progress"],["review","Review"],["done","Done"]].map(([v,l])=><button key={v} className={filter===v?"selected":""} onClick={()=>setFilter(v)}>{l}</button>)}</div><span className="muted small">{visibleTasks.length} pekerjaan</span></div>
    <section className="panel table-panel">{data.busy?<LoadingLine/>:visibleTasks.length===0?<Empty text="Belum ada pekerjaan pada filter ini."/>:
      <div className="table-scroll"><table><thead><tr><th>Pekerjaan</th><th>Divisi</th><th>PIC</th><th>Prioritas</th><th>Deadline</th><th>Status</th><th>Progres</th></tr></thead><tbody>{visibleTasks.map(t=><tr key={t.id}><td><b>{t.title}</b><small className="table-sub">{t.description||"—"}</small></td><td>{t.division?.name||"—"}</td><td>{t.pic_name||"—"}</td><td><span className={`priority ${t.priority}`}>{priorityLabels[t.priority]}</span></td><td>{fmtDate(t.deadline)}{t.status!=="done"&&t.deadline<today()&&<small className="overdue-label">Terlambat</small>}</td><td><select className="inline-select" value={t.status} disabled={!isAdmin&&t.primary_division_id!==profile.division_id} onChange={e=>updateTask(t.id,{status:e.target.value,completed_at:e.target.value==="done"?new Date().toISOString():null,progress:e.target.value==="done"?100:t.progress})}>{Object.entries(statusLabels).map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></td><td><div className="progress-edit"><input type="range" min="0" max="100" step="5" value={t.progress} disabled={!isAdmin&&t.primary_division_id!==profile.division_id} onChange={e=>updateTask(t.id,{progress:Number(e.target.value)})}/><b>{t.progress}%</b></div></td></tr>)}</tbody></table></div>}
    </section>
  </>;
}

function Divisions({profile}) {
  const data=useData(profile);
  return <><PageHeading eyebrow="TEAM STRUCTURE" title="Divisions" description="Pantau distribusi dan penyelesaian pekerjaan pada sembilan divisi."/>
    {data.busy?<LoadingLine/>:<div className="division-grid large-grid">{data.divisions.map(d=>{const list=data.tasks.filter(t=>t.primary_division_id===d.id);const done=list.filter(t=>t.status==="done").length;const pct=list.length?Math.round(done/list.length*100):0;return <div className="division-card" key={d.id}><div className="division-top"><span className="division-code">{d.code}</span><span className="division-count">{list.length} tugas</span></div><h3>{d.name}</h3><div className="progress-track"><span style={{width:`${pct}%`}}/></div><div className="division-foot"><span>{done} selesai</span><b>{pct}%</b></div><div className="division-stats"><span>{list.filter(t=>t.status==="in_progress").length} berjalan</span><span>{list.filter(t=>t.status!=="done"&&t.deadline&&t.deadline<today()).length} terlambat</span></div></div>})}</div>}
  </>;
}

function Timeline({profile}) {
  const data=useData(profile);
  return <><PageHeading eyebrow="SCHEDULE CONTROL" title="Timeline & Milestones" description="Pantau tenggat pekerjaan dan target penting menuju hari pelaksanaan."/>
    <section className="panel"><div className="panel-heading"><h2>Milestone acara</h2><span className="panel-tag">{data.milestones.length} milestone</span></div>{data.busy?<LoadingLine/>:data.milestones.length===0?<Empty text="Belum ada milestone. Milestone dapat ditambahkan oleh Super Admin melalui database."/>:data.milestones.map(m=><div className="timeline-row" key={m.id}><div className="timeline-date">{fmtDate(m.deadline)}</div><div className="timeline-marker"/><div className="timeline-copy"><b>{m.title}</b><small>{m.description||m.division?.name||"Milestone CEOPHORIA"}</small></div><span className={`status-badge ${m.status}`}>{m.status}</span></div>)}</section>
    <section className="panel"><div className="panel-heading"><h2>Deadline pekerjaan</h2><span className="panel-tag">{data.tasks.length} pekerjaan</span></div>{data.busy?<LoadingLine/>:data.tasks.filter(t=>t.deadline).length===0?<Empty text="Belum ada deadline pekerjaan."/>:data.tasks.filter(t=>t.deadline).map(t=><div className="deadline-row" key={t.id}><div><b>{t.title}</b><small>{t.division?.name||"Divisi"} · {t.pic_name||"PIC belum ditentukan"}</small></div><span className={t.status==="done"?"muted":t.deadline<today()?"overdue-label":""}>{fmtDate(t.deadline)}</span></div>)}</section>
  </>;
}

function ActivityList({items,busy}) {
  if(busy)return <LoadingLine/>;
  if(!items.length)return <Empty text="Belum ada aktivitas tercatat."/>;
  return <div className="activity-list">{items.map(a=><div className="activity-row" key={a.id}><div className="activity-icon"><Activity size={16}/></div><div><b>{a.profile?.full_name||"Anggota tim"}</b><p>{a.action==="task_created"?"membuat pekerjaan":a.action==="task_updated"?"memperbarui pekerjaan":a.action}</p><small>{a.task?.title||"Aktivitas pekerjaan"} · {new Date(a.created_at).toLocaleString("id-ID")}</small></div></div>)}</div>;
}
function ActivityPage({profile}) {
  const data=useData(profile);
  return <><PageHeading eyebrow="TEAM UPDATES" title="Activity Feed" description="Riwayat perubahan dan aktivitas pekerjaan yang dapat Anda akses."/><section className="panel">{data.busy?<LoadingLine/>:<ActivityList items={data.activities} busy={false}/>}</section></>;
}

function Briefing({profile,notify}) {
  const [form,setForm]=useState({completed_today:"",ongoing_work:"",obstacles:"",next_target:""});
  const [busy,setBusy]=useState(false);
  const data=useData(profile);
  async function submit(e){e.preventDefault();setBusy(true);const {error}=await supabase.from("daily_briefings").insert({...form,division_id:profile.division_id,user_id:profile.id,report_date:today()});setBusy(false);if(error)notify(`Gagal mengirim briefing: ${error.message}`);else{notify("Daily briefing berhasil dikirim.");setForm({completed_today:"",ongoing_work:"",obstacles:"",next_target:""});data.refresh();}}
  return <><PageHeading eyebrow="DAILY OPERATIONS" title="Daily Briefing" description="Catat hasil kerja, pekerjaan berjalan, kendala, dan target berikutnya."/>
    <section className="panel form-panel"><form className="form-stack" onSubmit={submit}><label>Pekerjaan yang selesai hari ini<textarea required rows="3" value={form.completed_today} onChange={e=>setForm({...form,completed_today:e.target.value})}/></label><label>Pekerjaan yang sedang berjalan<textarea rows="3" value={form.ongoing_work} onChange={e=>setForm({...form,ongoing_work:e.target.value})}/></label><label>Kendala yang dihadapi<textarea rows="3" value={form.obstacles} onChange={e=>setForm({...form,obstacles:e.target.value})}/></label><label>Target berikutnya<textarea rows="3" value={form.next_target} onChange={e=>setForm({...form,next_target:e.target.value})}/></label><button className="btn primary" disabled={busy}>{busy?"Mengirim…":"Kirim daily briefing"}</button></form></section>
    <section className="panel"><div className="panel-heading"><h2>Briefing terbaru</h2></div>{data.busy?<LoadingLine/>:<BriefingList divisionId={profile.division_id} isAdmin={profile.role==="super_admin"}/>}</section>
  </>;
}
function BriefingList({divisionId,isAdmin}) {
  const [items,setItems]=useState([]);
  useEffect(()=>{let q=supabase.from("daily_briefings").select("*, division:divisions!daily_briefings_division_id_fkey(name), profile:profiles!daily_briefings_user_id_fkey(full_name)").order("created_at",{ascending:false}).limit(20);if(!isAdmin)q=q.eq("division_id",divisionId);q.then(({data})=>setItems(data||[]));},[divisionId,isAdmin]);
  if(!items.length)return <Empty text="Belum ada briefing." />;
  return items.map(x=><div className="briefing-item" key={x.id}><div className="briefing-head"><b>{x.division?.name||"Divisi"}</b><small>{fmtDate(x.report_date)} · {x.profile?.full_name||"Koordinator"}</small></div><p><b>Selesai:</b> {x.completed_today}</p>{x.ongoing_work&&<p><b>Berjalan:</b> {x.ongoing_work}</p>}{x.obstacles&&<p><b>Kendala:</b> {x.obstacles}</p>}{x.next_target&&<p><b>Target:</b> {x.next_target}</p>}</div>);
}

function Issues({profile,notify}) {
  const [items,setItems]=useState([]);
  const [divisions,setDivisions]=useState([]);
  const [form,setForm]=useState({title:"",description:"",severity:"medium",division_id:profile.division_id||""});
  const [show,setShow]=useState(false);
  const [busy,setBusy]=useState(false);
  async function load(){let q=supabase.from("issues").select("*, divisions:division_id(name)").order("created_at",{ascending:false});const [{data},{data:d}]=await Promise.all([q,supabase.from("divisions").select("*").order("name")]);setItems(data||[]);setDivisions(d||[]);}
  useEffect(()=>{load()},[]);
  async function submit(e){e.preventDefault();if(!form.division_id){notify("Pilih divisi untuk isu ini.");return;}setBusy(true);const {error}=await supabase.from("issues").insert({...form,created_by:profile.id});setBusy(false);if(error)notify(`Gagal menyimpan isu: ${error.message}`);else{notify("Isu berhasil dicatat.");setShow(false);setForm({title:"",description:"",severity:"medium",division_id:profile.division_id||""});load();}}
  async function update(id,status){const {error}=await supabase.from("issues").update({status,updated_at:new Date().toISOString()}).eq("id",id);if(error)notify(error.message);else load();}
  return <><PageHeading eyebrow="RISK & ISSUE CONTROL" title="Issues & Risks" description="Catat kendala operasional dan pantau tindak lanjutnya." action={<button className="btn primary" onClick={()=>setShow(!show)}><Plus size={17}/> Catat isu</button>}/>
    {show&&<section className="panel form-panel"><form className="task-form" onSubmit={submit}><label className="span-2">Judul isu<input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label><label className="span-2">Deskripsi<textarea rows="3" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>{profile.role==="super_admin"&&<label>Divisi<select value={form.division_id} onChange={e=>setForm({...form,division_id:e.target.value})}><option value="">Pilih divisi</option>{divisions.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></label>}<label>Severity<select value={form.severity} onChange={e=>setForm({...form,severity:e.target.value})}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></label><div className="span-2 form-actions"><button className="btn primary" disabled={busy}>Simpan isu</button><button type="button" className="btn secondary" onClick={()=>setShow(false)}>Batal</button></div></form></section>}
    <section className="panel table-panel">{!items.length?<Empty text="Belum ada isu atau risiko tercatat."/>:<div className="table-scroll"><table><thead><tr><th>Isu</th><th>Divisi</th><th>Severity</th><th>Status</th><th>Dibuat</th></tr></thead><tbody>{items.map(i=><tr key={i.id}><td><b>{i.title}</b><small className="table-sub">{i.description}</small></td><td>{i.division?.name||"—"}</td><td><span className={`priority ${i.severity}`}>{priorityLabels[i.severity]}</span></td><td><select className="inline-select" value={i.status} onChange={e=>update(i.id,e.target.value)}><option value="open">Open</option><option value="in_progress">In Progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></td><td>{new Date(i.created_at).toLocaleDateString("id-ID")}</td></tr>)}</tbody></table></div>}</section>
  </>;
}

export default App;
