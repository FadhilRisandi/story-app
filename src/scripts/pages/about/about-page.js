export default class AboutPage {
  async render() {
    return `
      <section class="page-section">
        <div class="page-header">
          <div>
            <p class="eyebrow">Tentang Storyyy</p>
            <h1 class="text-4xl sm:text-5xl font-bold leading-tight">Peta kecil untuk cerita yang pernah singgah</h1>
          </div>
          <a href="#/" class="btn btn-secondary w-fit">Back</a>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-6 items-stretch">
          <aside class="card p-6 sm:p-8 justify-between">
            <div class="flex flex-col gap-5">
              <img
                src="${import.meta.env.BASE_URL}images/logo-story.png"
                alt="Storyyy"
                class="h-20 w-20 rounded-base border-2 border-border object-cover bg-white"
              />
              <div>
                <p class="eyebrow">Dibuat untuk submission</p>
                <h2 class="text-3xl font-bold leading-tight">Bukan sekadar daftar cerita.</h2>
              </div>
              <p class="text-muted leading-7">
                Storyyy menggabungkan foto, tulisan pendek, dan titik lokasi agar setiap momen punya konteks tempat.
                Cerita terasa lebih hidup ketika pembaca tahu dari sudut kota mana cerita itu muncul.
              </p>
            </div>
            <a href="#/add-story" class="btn btn-primary w-fit mt-6">Tambah Cerita</a>
          </aside>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <article class="card p-6">
              <p class="text-5xl font-bold text-main">01</p>
              <h2 class="text-2xl font-bold">Berbasis lokasi</h2>
              <p class="text-muted leading-7">
                Setiap cerita dapat ditautkan ke koordinat, lalu ditampilkan sebagai marker di peta interaktif.
              </p>
            </article>
            <article class="card p-6">
              <p class="text-5xl font-bold text-main">02</p>
              <h2 class="text-2xl font-bold">Ringan dibaca</h2>
              <p class="text-muted leading-7">
                Tampilan dibuat sederhana supaya pengguna bisa cepat menelusuri cerita, gambar, tanggal, dan tempat.
              </p>
            </article>
            <article class="card p-6">
              <p class="text-5xl font-bold text-main">03</p>
              <h2 class="text-2xl font-bold">Mudah dibagikan</h2>
              <p class="text-muted leading-7">
                Pengguna dapat mengunggah foto atau memakai kamera langsung ketika membuat cerita baru.
              </p>
            </article>
            <article class="card p-6">
              <p class="text-5xl font-bold text-main">04</p>
              <h2 class="text-2xl font-bold">Aksesibel</h2>
              <p class="text-muted leading-7">
                Struktur halaman memakai elemen semantik, label input, teks alternatif gambar, dan skip to content.
              </p>
            </article>
          </div>
        </div>

        <section class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
          <div class="card p-5">
            <p class="eyebrow">Stack</p>
            <p class="text-xl font-bold">Vite, JavaScript, Leaflet</p>
          </div>
          <div class="card p-5">
            <p class="eyebrow">Arsitektur</p>
            <p class="text-xl font-bold">SPA dengan pola MVP</p>
          </div>
          <div class="card p-5">
            <p class="eyebrow">Data</p>
            <p class="text-xl font-bold">Dicoding Story API</p>
          </div>
        </section>
      </section>
    `;
  }

  async afterRender() {
  }
}
