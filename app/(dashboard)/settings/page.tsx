import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Pengaturan | Workshop Management",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  if ((session.user as any)?.role !== "SUPERADMIN") {
    redirect("/");
  }

  const [commissions, employeeCount, serviceCount] = await Promise.all([
    prisma.serviceCommission.findMany({
      include: { service: true },
      orderBy: { service: { name: "asc" } },
    }),
    prisma.employee.count({ where: { isActive: true } }),
    prisma.service.count({ where: { isActive: true } }),
  ]);

  const expenseCategories = [
    "Operasional",
    "Listrik",
    "Air",
    "Alat",
    "Maintenance",
    "Konsumsi",
    "Transport",
    "Pembelian Barang",
    "Lainnya",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Pengaturan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Konfigurasi dasar dan informasi operasional bengkel.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* PROFIL BENGKEL */}
        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-5 sm:p-6">
            <h3 className="font-semibold text-foreground">Profil Bengkel</h3>
            <p className="mt-1 text-xs text-muted-foreground">Konfigurasi lokal MVP.</p>
          </div>
          <div className="p-5 sm:p-6 space-y-4">
            {[
              { label: "Nama Bengkel", value: "Workshop Kita" },
              { label: "Alamat", value: "Jl. Otomotif Raya No. 1" },
              { label: "Nomor Telepon", value: "0812-3456-7890" },
              { label: "Email", value: "hello@workshopkita.com" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                <span className="text-sm font-medium text-foreground sm:w-36 sm:shrink-0">{item.label}</span>
                <span className="text-sm text-muted-foreground">{item.value}</span>
              </div>
            ))}
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
              <span className="text-sm font-medium text-foreground sm:w-36 sm:shrink-0">Footer Struk</span>
              <span className="text-sm italic text-muted-foreground">
                &ldquo;Terima kasih telah mempercayakan kendaraan Anda kepada kami.&rdquo;
              </span>
            </div>
          </div>
        </div>

        {/* INFORMASI SISTEM */}
        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-5 sm:p-6">
            <h3 className="font-semibold text-foreground">Informasi Sistem</h3>
            <p className="mt-1 text-xs text-muted-foreground">Status aplikasi saat ini.</p>
          </div>
          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Versi</span>
              <Badge variant="outline">MVP 1.0.0</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Stack</span>
              <span className="text-sm text-muted-foreground">Next.js 15, Prisma, PostgreSQL</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Database</span>
              <Badge variant="success">Connected</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Karyawan Aktif</span>
              <span className="text-sm font-bold text-foreground">{employeeCount} Orang</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Layanan Aktif</span>
              <span className="text-sm font-bold text-foreground">{serviceCount} Layanan</span>
            </div>
          </div>
        </div>

        {/* METODE PEMBAYARAN */}
        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-5 sm:p-6">
            <h3 className="font-semibold text-foreground">Metode Pembayaran</h3>
            <p className="mt-1 text-xs text-muted-foreground">Metode pembayaran yang diakui oleh sistem.</p>
          </div>
          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap gap-2">
              <Badge variant="default" className="px-3 py-1.5 text-sm">CASH</Badge>
              <Badge variant="default" className="px-3 py-1.5 text-sm">TRANSFER</Badge>
              <Badge variant="default" className="px-3 py-1.5 text-sm">QRIS</Badge>
            </div>
          </div>
        </div>

        {/* KATEGORI PENGELUARAN */}
        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-5 sm:p-6">
            <h3 className="font-semibold text-foreground">Kategori Pengeluaran</h3>
            <p className="mt-1 text-xs text-muted-foreground">Rekomendasi kategori baku.</p>
          </div>
          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap gap-2">
              {expenseCategories.map((cat) => (
                <Badge key={cat} variant="outline" className="px-2.5 py-1 font-normal">
                  {cat}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* ATURAN KOMISI CUCI */}
        <div className="rounded-2xl border border-border bg-card shadow-sm md:col-span-2">
          <div className="border-b border-border p-5 sm:p-6">
            <h3 className="font-semibold text-foreground">Aturan Komisi Cuci</h3>
            <p className="mt-1 text-xs text-muted-foreground">Persentase komisi otomatis untuk Pencuci Mobil / Hybrid.</p>
          </div>
          <div className="p-5 sm:p-6">
            {commissions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Belum ada aturan komisi cuci.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left font-medium text-muted-foreground">Layanan Cuci</th>
                      <th className="px-6 py-3 text-left font-medium text-muted-foreground">Harga</th>
                      <th className="px-6 py-3 text-right font-medium text-muted-foreground">Komisi (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map((c) => (
                      <tr key={c.id} className="border-b border-border transition-colors hover:bg-muted/50 last:border-0">
                        <td className="px-6 py-3.5 font-medium text-foreground">
                          {c.service.name}
                        </td>
                        <td className="px-6 py-3.5 text-muted-foreground">
                          Rp {Number(c.service.price).toLocaleString("id-ID")}
                        </td>
                        <td className="px-6 py-3.5 text-right font-semibold text-success">
                          {Number(c.commissionRate)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
