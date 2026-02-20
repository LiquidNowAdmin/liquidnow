"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface Product {
  id: string;
  name: string;
  type: string;
  min_volume: number;
  max_volume: number;
  min_term_months: number;
  max_term_months: number;
  interest_rate_from: number;
  interest_rate_to: number;
  is_active: boolean;
  providers: { name: string } | null;
}

function formatVolume(v: number) {
  return v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`;
}

export default function ProdukteListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const supabase = createClient();
    const { data } = await supabase
      .from("products")
      .select("*, providers(name)")
      .order("created_at", { ascending: false });

    setProducts((data as Product[]) ?? []);
    setLoading(false);
  }

  async function toggleActive(product: Product) {
    const supabase = createClient();
    await supabase
      .from("products")
      .update({ is_active: !product.is_active })
      .eq("id", product.id);

    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, is_active: !p.is_active } : p
      )
    );
  }

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Produkte</h1>
        <Link href="/admin/produkte/neu" className="btn btn-primary btn-md">
          <Plus className="h-4 w-4 inline-block mr-1" />
          Neues Produkt
        </Link>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Produkt</th>
              <th>Anbieter</th>
              <th>Typ</th>
              <th>Volumen</th>
              <th>Laufzeit</th>
              <th>Zins</th>
              <th>Status</th>
              <th>Aktiv</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center text-subtle py-8">
                  Laden...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <div className="admin-empty">
                    <p className="admin-empty-title">Keine Produkte</p>
                    <p>Erstellen Sie das erste Produkt.</p>
                  </div>
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id}>
                  <td className="font-semibold">{product.name}</td>
                  <td className="text-subtle">
                    {product.providers?.name ?? "–"}
                  </td>
                  <td>
                    <span className="offer-provider-type-badge">
                      {product.type === "credit_line"
                        ? "Kreditlinie"
                        : product.type === "term_loan"
                          ? "Laufzeitkredit"
                          : product.type === "both"
                            ? "Kredit + Linie"
                            : product.type ?? "–"}
                    </span>
                  </td>
                  <td className="text-sm">
                    {formatVolume(product.min_volume)} –{" "}
                    {formatVolume(product.max_volume)} EUR
                  </td>
                  <td className="text-sm">
                    {product.min_term_months} – {product.max_term_months} Mon.
                  </td>
                  <td className="text-sm">
                    {product.interest_rate_from}% –{" "}
                    {product.interest_rate_to}%
                  </td>
                  <td>
                    <span
                      className={`admin-status ${product.is_active ? "admin-status-active" : "admin-status-inactive"}`}
                    >
                      {product.is_active ? "Aktiv" : "Inaktiv"}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => toggleActive(product)}
                      className={`admin-toggle ${product.is_active ? "admin-toggle-active" : ""}`}
                    >
                      <span className="admin-toggle-knob" />
                    </button>
                  </td>
                  <td>
                    <Link
                      href={`/admin/produkte/bearbeiten?id=${product.id}`}
                      className="btn btn-secondary btn-md"
                    >
                      Bearbeiten
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
