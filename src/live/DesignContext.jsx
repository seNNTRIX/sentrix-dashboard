import { createContext, useContext } from 'react';
export const DesignContext=createContext(null);
export const useDesign=()=>useContext(DesignContext);
