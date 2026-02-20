"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface Provider {
  id: string;
  name: string;
  type: string;
  logo_url: string | null;
  website: string | null;
  is_active: boolean;
  created_at: string;
}

export default function AnbieterListPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProviders();
  }, []);

  async function fetchProviders() {
    const supabase = createClient();
    const { data } = await supabase
      .from("providers")
      .select("*")
      .order("name");

    setProviders(data ?? []);
    setLoading(false);
  }

  async function toggleActive(provider: Provider) {
    const supabase = createClient();
    await supabase
      .from("providers")
      .update({ is_active: !provider.is_active })
      .eq("id", provider.id);

    setProviders((prev) =>
      prev.map((p) =>
        p.id === provider.id ? { ...p, is_active: !p.is_active } : p
      )
    );
  }

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Anbieter</h1>
        <Link href="/admin/anbieter/neu" className="btn btn-primary btn-md">
          <Plus className="h-4 w-4 inline-block mr-1" />
          Neuer Anbieter
        </Link>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Logo</th>
              <th>Name</th>
              <th>Typ</th>
              <th>Website</th>
              <th>Status</th>
              <th>Aktiv</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center text-subtle py-8">
                  Laden...
                </td>
              </tr>
            ) : providers.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="admin-empty">
                    <p className="admin-empty-title">Keine Anbieter</p>
                    <p>Erstellen Sie den ersten Anbieter.</p>
                  </div>
                </td>
              </tr>
            ) : (
              providers.map((provider) => (
                <tr key={provider.id}>
                  <td>
                    <div className="offer-provider-logo">
                      {provider.logo_url ? (
                        <Image
                          src={provider.logo_url}
                          alt={provider.name}
                          width={40}
                          height={40}
                        />
                      ) : (
                        provider.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                  </td>
                  <td className="font-semibold">{provider.name}</td>
                  <td>
                    <span
                      className={`offer-provider-type-badge ${provider.type === "fintech" ? "offer-provider-type-badge-fintech" : ""}`}
                    >
                      {provider.type ?? "–"}
                    </span>
                  </td>
                  <td className="text-subtle text-sm">
                    {provider.website ?? "–"}
                  </td>
                  <td>
                    <span
                      className={`admin-status ${provider.is_active ? "admin-status-active" : "admin-status-inactive"}`}
                    >
                      {provider.is_active ? "Aktiv" : "Inaktiv"}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => toggleActive(provider)}
                      className={`admin-toggle ${provider.is_active ? "admin-toggle-active" : ""}`}
                    >
                      <span className="admin-toggle-knob" />
                    </button>
                  </td>
                  <td>
                    <Link
                      href={`/admin/anbieter/bearbeiten?id=${provider.id}`}
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
