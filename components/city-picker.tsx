'use client';
import {useState} from 'react';
import {Check,ChevronsUpDown} from 'lucide-react';
import {Popover,PopoverContent,PopoverTrigger} from '@/components/ui/popover';
import {Command,CommandEmpty,CommandGroup,CommandInput,CommandItem,CommandList} from '@/components/ui/command';
import {cityDirectory,popularCities,cityAliases,citySearchScore,type City} from '@/lib/cities';

export default function CityPicker({value,onChange,label,allowAll=false}:{value:string;onChange:(value:string)=>void;label:string;allowAll?:boolean}){
 const [open,setOpen]=useState(false);
 function choose(city:string){onChange(city);setOpen(false);}
 function item(city:City){return <CommandItem key={city.code} value={city.name} keywords={[city.kazakh,city.region,...(cityAliases[city.name]??[])]} onSelect={()=>choose(city.name)}><span className="city-option-label"><strong>{city.name}</strong><small>{city.region}</small></span>{value===city.name&&<Check size={17} aria-hidden="true"/>}</CommandItem>;}
 return <Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><button type="button" className="city-select-trigger" role="combobox" aria-label={label} aria-expanded={open}><span>{value}</span><ChevronsUpDown size={15} aria-hidden="true"/></button></PopoverTrigger><PopoverContent align="start" className="city-select-content" aria-label="Выбор города"><Command filter={citySearchScore}><CommandInput aria-label="Поиск города" placeholder="Введите название города…" maxLength={80}/><CommandList aria-label="Города Казахстана"><CommandEmpty>Город не найден. Попробуйте другое название.</CommandEmpty>{allowAll&&<CommandGroup><CommandItem value="Все города" onSelect={()=>choose('Все города')}>Все города{value==='Все города'&&<Check size={17} aria-hidden="true"/>}</CommandItem></CommandGroup>}<CommandGroup heading="Популярные города">{popularCities.map(name=>cityDirectory.find(city=>city.name===name)!).map(item)}</CommandGroup><CommandGroup heading="Все города · по алфавиту">{cityDirectory.filter(city=>!popularCities.includes(city.name)).map(item)}</CommandGroup></CommandList></Command></PopoverContent></Popover>;
}
