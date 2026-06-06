import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-8xl font-bold text-primary/20">404</div>

        <h1 className="text-2xl font-bold text-foreground">
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-muted-foreground">
          Halaman yang Anda cari tidak ditemukan atau sudah dipindahkan.
          Periksa kembali URL atau kembali ke dashboard.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
