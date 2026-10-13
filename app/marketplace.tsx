'use client';
import {useState,useEffect,useRef} from 'react';
import SearchTools from './search-tools';
import {MapPin,Search,Heart,Plus,Star,HardHat,Layers,Clock,Users,ShieldCheck,SlidersHorizontal,ArrowRight,X,Check} from 'lucide-react';
import {usePathname} from 'next/navigation';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {cities,specialties,money,type Profile} from '@/lib/data';
export function Picker({value,onChange,options,label}:{value:string;onChange:(v:string)=>void;options:string[];label:string}){return <Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label}><SelectValue/></SelectTrigger><SelectContent>{options.map(x=><SelectItem key={x} value={x}>{/^\d+$/.test(x)?`До ${money(Number(x))} ₸`:x}</SelectItem>)}</SelectContent></Select>;}
export function Header(){
  const cabinet=usePathname()==='/cabinet';
  return <><a href="#main-content" className="skip-link">Перейти к содержимому</a><header className="header"><div className="shell header-inner">
    <a className="brand" href="/" aria-label="Бригадир — главная"><span className="brand-icon"><HardHat size={24}/></span>бригадир<span className="brand-period">.</span></a>
    <nav aria-label="Основная навигация"><a className={!cabinet?'active':''} href="/#catalog" aria-current={!cabinet?'page':undefined}>Найти бригаду</a><a href="/#how-it-works">Как выбрать</a><a className={cabinet?'active':''} href="/cabinet" aria-current={cabinet?'page':undefined}>Кабинет бригады</a></nav>
    <div className="header-actions"><span className="region"><MapPin size={16}/>Казахстан</span><a className="button dark" href="/cabinet"><Plus size={17}/>{cabinet?'Мой профиль':'Я бригадир'}</a></div>
  </div></header></>;
}
export default function Marketplace({initialProfiles}:{initialProfiles:Profile[]}){
const [city,setCity]=useState('Все города'),[specialty,setSpecialty]=useState('Любой ремонт'),[query,setQuery]=useState(''),[max,setMax]=useState('Любой бюджет'),[sort,setSort]=useState('Сначала новые'),[saved,setSaved]=useState<string[]>([]),[favorites,setFavorites]=useState(false),[filtersOpen,setFiltersOpen]=useState(false);
const [savedReady,setSavedReady]=useState(false);
const filterButton=useRef<HTMLButtonElement>(null);
useEffect(()=>{try{const value=JSON.parse(localStorage.getItem('brigadir:favorites:v1')||'[]');if(Array.isArray(value))setSaved([...new Set(value.filter((id):id is string=>typeof id==='string'&&id.length<=100))].slice(0,200));}catch{/* Keep favorites in memory when browser storage is unavailable. */}setSavedReady(true);},[]);
useEffect(()=>{if(savedReady)try{localStorage.setItem('brigadir:favorites:v1',JSON.stringify(saved));}catch{/* Private browsing can disallow storage. */}},[saved,savedReady]);
const reset=()=>{setCity('Все города');setSpecialty('Любой ремонт');setMax('Любой бюджет');setQuery('');setFavorites(false);};
const scrollToCatalog=()=>document.getElementById('catalog')?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
const filters=[...(city!=='Все города'?[{label:city,clear:()=>setCity('Все города')}]:[]),...(specialty!=='Любой ремонт'?[{label:specialty,clear:()=>setSpecialty('Любой ремонт')}]:[]),...(max!=='Любой бюджет'?[{label:`До ${money(Number(max))} ₸/м²`,clear:()=>setMax('Любой бюджет')}]:[]),...(query.trim()?[{label:`Поиск: ${query.trim()}`,clear:()=>setQuery('')}]:[])];
let list=initialProfiles.filter(p=>(city==='Все города'||p.city===city)&&(specialty==='Любой ремонт'||p.specialty===specialty)&&(`${p.name} ${p.description} ${p.specialty}`.toLowerCase().includes(query.trim().toLowerCase()))&&(max==='Любой бюджет'||p.price<=Number(max))&&(!favorites||saved.includes(p.id)));
if(sort==='Сначала дешевле')list=[...list].sort((a,b)=>a.price-b.price);if(sort==='По рейтингу')list=[...list].sort((a,b)=>(b.rating??0)-(a.rating??0));
const filterFields=<>
  <div className="filter-field"><p>Максимальная цена работ</p><Picker value={max} onChange={setMax} options={['Любой бюджет','20000','30000','40000']} label="Максимальная цена за м²"/><p className="filter-note">Цена за 1 м², не за весь ремонт. Материалы — отдельно.</p></div>
  <div className="filter-divider"/><p className="filter-heading">Вид ремонта</p>
  <div className="filter-links">{['Любой ремонт',...specialties].map(s=><button className={specialty===s?'chosen':''} aria-pressed={specialty===s} key={s} onClick={()=>setSpecialty(s)}><span className="radio" aria-hidden="true">{specialty===s&&<span/>}</span>{s}</button>)}</div>
  <button className="reset" onClick={reset}>Сбросить все условия</button>
</>;
return <>
  <SearchTools profiles={initialProfiles} onSearch={(c,q,s)=>{setCity(c);setQuery(q);setSpecialty(s);setFavorites(false);setMax('Любой бюджет');scrollToCatalog();}}/>
  <Header/>
  <main className="shell" id="main-content" tabIndex={-1}>
    <div className="breadcrumb">Главная <span>/</span> Поиск ремонтной бригады</div>
    <section className="intro"><div><p className="eyebrow">РЕМОНТ КВАРТИР, ДОМОВ И ОФИСОВ</p><h1>Найдите бригаду<br/><span>для вашего ремонта.</span></h1><p>Выберите город и вид работ. Сравните портфолио и цены, затем свяжитесь с подходящей бригадой.</p><a href="/cabinet" className="contractor-link">Вы бригадир? Разместите свою бригаду <ArrowRight size={16}/></a></div><div className="intro-image"><img src="/images/living.jpg" alt="Светлая современная гостиная"/><span className="image-label"><Layers size={16}/>Сначала посмотрите работы — потом выбирайте</span></div></section>
    <form className="searchbar clear-search" aria-label="Поиск бригады" onSubmit={e=>{e.preventDefault();scrollToCatalog();}}>
      <div className="search-field city-field"><span className="search-caption">Где нужен ремонт?</span><div className="city-picker"><MapPin size={20}/><Picker value={city} onChange={setCity} options={['Все города',...cities]} label="Город"/></div></div>
      <div className="search-field query-field"><label className="search-caption" htmlFor="brigade-search">Название или вид работ</label><div className="search-input"><Search size={20}/><input id="brigade-search" aria-label="Поиск бригады" maxLength={100} placeholder="Например, ремонт кухни" value={query} onChange={e=>setQuery(e.target.value)}/></div></div>
      <button type="submit" className="button orange">Показать бригады <ArrowRight size={17}/></button>
    </form>
    <div className="category-field"><span className="search-caption">Какие работы нужны?</span><div className="categories" aria-label="Вид работ">{['Любой ремонт',...specialties].map(s=><button key={s} aria-pressed={specialty===s} className={specialty===s?'selected':''} onClick={()=>setSpecialty(s)}>{s==='Любой ремонт'?<Layers size={16}/>:null}{s}</button>)}</div></div>
    <section id="catalog" className="catalog" aria-label="Каталог бригад">
      <aside className="filters"><h2><SlidersHorizontal size={18}/>Уточнить поиск</h2>{filterFields}<div className="trust-note"><ShieldCheck size={25}/><h3>Перед началом работ</h3><p>Уточните смету, сроки и условия договора.</p><a href="#how-it-works">Как выбрать бригаду <ArrowRight size={14}/></a></div></aside>
      <div className="results">
        <div className="results-top"><div><h2>{favorites?'Избранные бригады':'Бригады и компании'}</h2><span aria-live="polite">Найдено: {list.length}</span></div><div className="sort-field"><span className="search-caption">Порядок показа</span><Picker value={sort} onChange={setSort} options={['Сначала новые','Сначала дешевле','По рейтингу']} label="Сортировка"/></div></div>
        <p className="results-hint">{favorites?'Избранное сохраняется в этом браузере. Откройте профиль, чтобы посмотреть работы и контакты.':'Откройте «Работы и контакты», чтобы посмотреть проекты и связаться с бригадой.'}</p>
        <div className="catalog-toolbar"><div className="catalog-switch" aria-label="Раздел каталога"><button aria-pressed={!favorites} className={!favorites?'selected':''} onClick={()=>setFavorites(false)}>Все бригады</button><button aria-pressed={favorites} className={favorites?'selected':''} onClick={()=>setFavorites(true)}><Heart size={15}/>Избранное <span>{saved.length}</span></button></div><button ref={filterButton} className="mobile-filter-button" aria-expanded={filtersOpen} onClick={()=>setFiltersOpen(true)}><SlidersHorizontal size={17}/>Фильтры{filters.length>0&&<span>{filters.length}</span>}</button></div>
        {filters.length>0&&<div className="applied-filters" aria-label="Выбранные условия поиска">{filters.map(f=><button key={f.label} onClick={f.clear} aria-label={`Убрать условие: ${f.label}`} title={f.label}>{f.label}<X size={14}/></button>)}<button className="clear-all" onClick={reset}>Сбросить всё</button></div>}
        <div className="demo-notice"><span>Демо</span>Примеры оформления: работы, цены и оценки условные. Это не проверенные исполнители.</div>
        <div className="cards">{list.map((p,i)=><article className="card" key={p.id} style={{animationDelay:`${Math.min(i,8)*70}ms`}}>
          <div className="card-image"><a href={`/brigady/${p.id}`} aria-label={`Посмотреть работы ${p.name}`}><img src={p.projects[0]?.image||'/images/living.jpg'} alt={p.projects[0]?.title||p.name} loading={i<2?'eager':'lazy'}/></a><span className="photo-tag">{p.demo?'Демо-профиль':'Портфолио'}</span><button className={'save '+(saved.includes(p.id)?'is-saved':'')} aria-pressed={saved.includes(p.id)} aria-label={`${saved.includes(p.id)?'Убрать из избранного':'Добавить в избранное'}: ${p.name}`} title={saved.includes(p.id)?'В избранном':'Сохранить в избранное'} onClick={()=>setSaved(previous=>previous.includes(p.id)?previous.filter(s=>s!==p.id):[...previous,p.id])}><Heart size={20} fill={saved.includes(p.id)?'currentColor':'none'}/></button><span className="project-label">{p.projects[0]?.title}</span></div>
          <div className="card-body"><div className="card-location"><MapPin size={14}/>{p.city}<span>{p.specialty}</span></div><div className="card-title"><a href={`/brigady/${p.id}`}><h3>{p.name}</h3></a>{p.rating&&<span className="rating" title={p.demo?'Пример рейтинга, не подтверждённые отзывы':'Рейтинг'}><Star size={15} fill="currentColor"/>{p.rating.toFixed(1)}<small>({p.reviewCount})</small></span>}</div><div className="card-facts"><span><Clock size={14}/>{p.experience} лет опыта</span><span><Users size={14}/>{p.team} человек</span></div><div className="card-bottom"><div><span className="price-caption">Стоимость работ</span><div className="price">от {money(p.price)} ₸<small>/ м²</small></div></div><a className="profile-link" href={`/brigady/${p.id}`}>Работы и контакты <ArrowRight size={15}/></a></div></div>
        </article>)}</div>
        {!list.length&&<div className="empty"><Search size={35}/><h3>{favorites&&!saved.length?'Вы пока не сохранили ни одной бригады':favorites?'В избранном нет бригад с такими условиями':'По этим условиям бригад пока нет'}</h3><p>{favorites&&!saved.length?'Нажмите на сердечко на карточке, чтобы добавить бригаду в избранное.':'Уберите одно из условий выше или сбросьте фильтры.'}</p><button className="button dark" onClick={reset}>{favorites&&!saved.length?'Перейти к бригадам':'Показать все бригады'}</button></div>}
      </div>
    </section>
    <section className="how-it-works" id="how-it-works" aria-labelledby="how-title"><div><p className="eyebrow">С ЧЕГО НАЧАТЬ</p><h2 id="how-title">Как выбрать бригаду</h2><p>Три шага от поиска до первого разговора.</p></div><ol><li><span>1</span><div><h3>Укажите город и работы</h3><p>Выберите вид ремонта и подходящую цену за м².</p></div></li><li><span>2</span><div><h3>Сравните бригады</h3><p>Откройте профили, посмотрите проекты, опыт и информацию об отзывах.</p></div></li><li><span>3</span><div><h3>Обсудите ремонт</h3><p>Позвоните по номеру в профиле. Уточните смету и сроки, заключите договор.</p></div></li></ol><a className="button orange" href="#catalog">Начать поиск <ArrowRight size={16}/></a></section>
  </main>
  <footer className="shell footer"><a className="brand" href="/">бригадир.</a><span>Ремонт начинается с доверия.</span><a href="/cabinet">Разместить свою бригаду</a><span>© 2026 Бригадир</span></footer>
  <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}><DialogContent className="filter-dialog" onCloseAutoFocus={event=>{event.preventDefault();filterButton.current?.focus();}}><DialogTitle>Уточнить поиск</DialogTitle><DialogDescription>Условия применяются сразу. Цена указана за 1 м² работ, без материалов.</DialogDescription>{filterFields}<button className="button orange" onClick={()=>{setFiltersOpen(false);scrollToCatalog();}}><Check size={17}/>Показать результаты ({list.length})</button></DialogContent></Dialog>
</>;
}
