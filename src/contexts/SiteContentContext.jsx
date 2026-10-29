import React,{createContext,useContext,useEffect,useState} from 'react';
import {apiClient} from '../config/api';
const SiteContentContext=createContext({});
export const useSiteContent=()=>useContext(SiteContentContext);
export function SiteContentProvider({children}){
 const [content,setContent]=useState({});
 useEffect(()=>{let active=true;const refresh=()=>apiClient.content.getPublic().then(data=>{if(active)setContent(data);}).catch(()=>{/* Bundled text remains available when optional content cannot load. */});refresh();window.addEventListener('pipesan-content-updated',refresh);return()=>{active=false;window.removeEventListener('pipesan-content-updated',refresh);};},[]);
 return <SiteContentContext.Provider value={content}>{children}</SiteContentContext.Provider>;
}
