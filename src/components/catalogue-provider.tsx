"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { setClientCatalogue } from "@/lib/client-catalogue";
import { products, type MaisonProduct } from "@/data/products";
const CatalogueContext = createContext<MaisonProduct[]>(products);
export function CatalogueProvider({ children }: { children: React.ReactNode }) {
  const [catalogue, setCatalogue] = useState<MaisonProduct[]>(products);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/catalogue", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((rows: MaisonProduct[]) => {
        setClientCatalogue(rows);
        setCatalogue([...rows]);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  return (
    <CatalogueContext.Provider value={catalogue}>
      {children}
    </CatalogueContext.Provider>
  );
}
export function useCatalogue() {
  return useContext(CatalogueContext);
}
