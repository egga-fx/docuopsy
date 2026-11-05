# Audit kesiapan production Docuopsy — 5 November 2026

**Keputusan: NO-GO. Belum siap dirilis sebagai production, dan jangan push riwayat saat ini sebelum kredensial dibersihkan serta diganti.**

**Implementation integrity: FAIL untuk penerimaan production.** Identitas studio dokumen, preview tersanitasi, dan struktur editor konsisten dengan produk; tetapi klaim crash-safe, dual-theme, PDF, dan status penyimpanan belum sesuai perilaku implementasi. Kelulusan unit test bukan bukti penerimaan alur pengguna.

Audit menggunakan skill Impeccable 4.8.0, konteks PRODUCT.md/DESIGN.md, PRD, inspeksi frontend/Rust, detector, quality gates, dan empat reproduksi perilaku. Tidak ada perbaikan kode aplikasi atau push yang dilakukan oleh auditor ini. Berkas audit, probe, dashboard, dan memori merupakan hasil pekerjaan ini.

Snapshot awal: `264ee69`, dengan perubahan `src/index.css` yang sudah ada. Selama audit, aktivitas lain membuat commit `5ad56a0` lalu `05e0937`, serta memasukkan sebagian artefak audit yang sedang dikerjakan. Perubahan editor terakhir diperiksa ulang: probe sinkronisasi Undo sekarang PASS, tiga probe lain tetap FAIL. Lokasi temuan mengacu pada source saat ditemukan kecuali dinyatakan diperbarui. Ini bukan sertifikasi installer dari commit yang dibekukan.

Pada penutupan audit terdapat pula perubahan working tree `AIPalette.tsx` dari aktivitas lain (tinggi dialog menjadi 82vh, batas 620px, dan perbaikan flex/overflow). Perubahan ini ditinjau sebagai diff, belum diuji secara visual atau gesture; catatan tinggi tetap 560px di bawah hanya berlaku pada snapshot awal. Build ulang working tree berhasil: JS 1,316.12 kB, gzip 443.41 kB; frontend suite tetap 26/26 dan TypeScript exit 0. Temuan lifecycle AI, fokus, dan tema tidak tertutup oleh perubahan layout tersebut.

## Audit Health Score

| Dimensi | Skor /4 | Bukti utama |
|---|---:|---|
| Accessibility | 1 | Dua teks footer di bawah AA; navigasi tab/splitter dan fokus dialog belum lengkap |
| Performance | 2 | CodeMirror tervirtualisasi, tetapi bundle tunggal 1,315.29 kB dan pemrosesan penuh setiap edit |
| Theming | 1 | CSS semantic tokens ada, tetapi mayoritas chrome memakai warna Tailwind dark literal |
| Responsive design | 2 | Shell desktop fleksibel; splitter hanya mouse; perubahan layout dialog terbaru belum diverifikasi visual/zoom/touch |
| Implementation integrity | 2 | Produk memiliki identitas, tetapi state editor/draf serta status keselamatan tidak konsisten |
| **Total** | **8/20** | **Poor — major work needed** |

Skor adalah penilaian teknis berdasarkan cakupan terbatas ini, bukan skor keamanan atau sertifikasi WCAG. Responsive dinilai terhadap aplikasi Windows desktop (minimum 800×600), bukan kewajiban mendukung ponsel.

**15 kelompok temuan masih terbuka: 4 P0, 8 P1, 3 P2, 0 P3; 1 temuan tambahan sudah tertutup oleh commit lain dan diverifikasi ulang.** P0 mencakup penghalang publikasi rahasia dan risiko hilangnya pekerjaan; P1 perlu diselesaikan sebelum release; P2 merupakan penguatan berikutnya.

## Bukti pengujian

| Pemeriksaan | Hasil |
|---|---|
| `bun run test` | PASS: 26 tes, 12 berkas |
| `cargo test --manifest-path src-tauri/Cargo.toml` | PASS: 15 tes setelah pengulangan dengan izin lokal yang sesuai |
| `cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings` | PASS, exit 0 pada pengulangan |
| `bun run tsc --noEmit` | PASS, exit 0 diverifikasi terpisah |
| `bun run build` | PASS; warning chunk >500 kB; JS 1,315.29 kB / gzip 443.14 kB |
| `bun run test --config docs/audits/probes.config.ts` | Awalnya 4/4 FAIL; setelah `05e0937`: **3 FAIL / 1 PASS**, bukan setup error |
| Impeccable source detector | 1 warning + 44 advisory; ditinjau, bukan semuanya cacat |
| Impeccable rendered detector | Dua kegagalan kontras yang sama di 1280×800 dan 800×600 |
| `bun audit --json` | 4 advisory unik pada 3 nama paket dev/transitif; termasuk 2 advisory critical Tinypool |
| Rust advisory scan | Belum berjalan: `cargo audit` tidak tersedia |

Percobaan awal Bun gagal membaca cwd di lingkungan terbatas. Tiga tes Rust awal gagal PermissionDenied saat operasi berkas temporer; pengulangan normal berhasil. Probe audit sempat gagal saat setup karena `globals` belum diaktifkan; konfigurasi diperbaiki lalu empat kegagalan perilaku berikut direproduksi. Probe berada di luar pola suite reguler agar audit tidak mengubah hasil suite lama secara terselubung.

Artefak: [hasil probe awal](./2026-11-05-probe-results.txt), [hasil probe terbaru pada 05e0937](./2026-11-05-probe-results-latest.txt), [kode reproduksi](./production-probes.test.tsx), [detector source](./2026-11-05-impeccable-source.json), [render 1280×800](./2026-11-05-impeccable-rendered.json), [render 800×600](./2026-11-05-impeccable-min-window.json), [advisory dependensi](./2026-11-05-bun-audit.json).

## Temuan terprioritas

### 01 — [P0] Kredensial API tertanam dan ada dalam riwayat Git

- **Lokasi:** `src-tauri/src/services/ai.rs:10`, pemakaian fallback di sekitar baris 103; `AGENTS.md:87`, `GEMINI.md:44`, `INFRA.md:23`, PRD baris 59, implementation plan, dan fixture logging.
- **Kategori:** Security / implementation integrity.
- **Bukti:** `DEFAULT_DEV_API_KEY` digunakan ketika environment tidak tersedia, tanpa pembatasan build debug. Pencarian nilai yang sama menemukan source dan dokumen tracked; pencarian perubahan Git menemukan introduksi pada `f705fb9`. Nilai sengaja tidak disalin ke laporan ini. Validitas/balance kunci tidak diuji.
- **Dampak:** Push membagikan rahasia melalui source/history; build dapat membawa fallback di executable. Menghapus hanya baris terbaru tidak membersihkan commit sebelumnya.
- **Rekomendasi:** Ganti/revoke kunci di provider, hilangkan fallback dan contoh rahasia nyata, sediakan konfigurasi runtime dengan error jelas bila kosong, bersihkan seluruh history yang akan dipublikasikan dan lakukan secret scan ulang. Penulisan ulang history harus dikoordinasikan dengan pemilik repo.
- **Tindak lanjut:** `$impeccable harden` untuk alur konfigurasi/error; remediasi kredensial dan Git harus dilakukan juga di backend/repository.

### 02 — [RESOLVED; semula P0] Undo dapat membuat file tersimpan berbeda dari teks yang terlihat

**Pembaruan:** Commit `05e0937` dari aktivitas lain menghilangkan closure lama. Probe yang sama diuji ulang dan PASS. Temuan ini dipertahankan sebagai jejak audit, bukan blocker aktif; tidak dihitung dalam 15 temuan terbuka.

- **Lokasi:** `src/components/EditorPane.tsx:36–40`; `src/App.tsx:82`.
- **Kategori:** Implementation integrity / data integrity.
- **Bukti:** Listener membandingkan teks baru dengan `activeTab.content` dari closure saat mount. Probe: teks `original` → `original changed` → Undo. Editor kembali `original`, store tetap `original changed`.
- **Dampak:** Preview, draf, dan Save mengambil store sehingga dapat menyimpan teks yang baru saja dibatalkan pengguna.
- **Rekomendasi:** Sinkronkan setiap perubahan dokumen ke state terbaru; hindari perbandingan dengan snapshot mount; tambahkan tes Undo → Save/preview/draft.
- **Tindak lanjut:** `$impeccable harden`.

### 03 — [P0] Pemulihan session membuka file tersimpan sebagai buffer kosong

- **Lokasi:** `src/store/tabStore.ts:227–237`; `src/App.tsx:35–48`.
- **Kategori:** Implementation integrity / recovery.
- **Bukti:** `restoreSession` mengisi semua `content` dengan string kosong. Boot hanya memuat draft, tidak membaca `filePath` untuk tab clean. Commit `05e0937` menambah sinkronisasi store ke EditorView, tetapi tidak menambahkan pembacaan file clean dari disk.
- **Dampak:** File clean muncul kosong setelah restart; menekan Save dapat menimpa file asli dengan string kosong. Kekurangan sinkronisasi draft ke view yang ditemukan pada snapshot awal telah diubah oleh commit terakhir; perlu acceptance restart terpadu.
- **Rekomendasi:** Hydrate clean file dari disk dan dirty file dari draft sebelum mengaktifkan editor/Save; tangani draft kosong secara eksplisit, validasi schema, dan sinkronkan pemulihan asinkron ke editor. Uji restart sungguhan untuk clean/dirty/missing file.
- **Tindak lanjut:** `$impeccable harden`.

### 04 — [P0] Timer draf global membatalkan penyimpanan tab lain

- **Lokasi:** `src/store/tabStore.ts:26`, `167–170`.
- **Kategori:** Implementation integrity / recovery.
- **Bukti reproduksi:** Edit tab A; 100 ms kemudian edit B; tunggu 500 ms. Hanya `saveDraft('b', ...)` dipanggil. Probe pertama gagal karena A tidak pernah disimpan.
- **Dampak:** Pekerjaan pada tab sebelumnya dapat hilang saat crash walaupun waktu debounce telah lewat. Session masih bisa mencatat A sebagai dirty tanpa konten drafnya.
- **Rekomendasi:** Timer/antrean per tab dengan urutan revisi yang jelas; flush yang benar pada lifecycle aplikasi; uji beberapa tab serta write yang bertumpuk.
- **Tindak lanjut:** `$impeccable harden`.

### 05 — [P0] Menutup tab dirty menghapus satu-satunya draf tanpa pilihan simpan

- **Lokasi:** `src/store/tabStore.ts:100–142`; `src/components/TabBar.tsx:30`, `88`.
- **Kategori:** Implementation integrity / destructive interaction.
- **Bukti reproduksi:** `closeTab` langsung mengeluarkan tab dari session dan memanggil `removeDraft`, termasuk tab terakhir. Probe keempat mengonfirmasi pemanggilan hapus pada draf dirty.
- **Dampak:** Klik X atau Ctrl+W dapat menghilangkan pekerjaan yang belum tersimpan tanpa pemulihan yang tersedia.
- **Rekomendasi:** Alur Save / Discard / Cancel, atau pemulihan closed-tab yang benar-benar persisten; jangan hapus draf sebelum keputusan pengguna. Uji tab terakhir dan Save yang gagal.
- **Tindak lanjut:** `$impeccable harden`.

### 06 — [P1] Tema/tab/layout mereset riwayat editor dan posisi baca

- **Lokasi:** `src/components/EditorPane.tsx:31–88` pada `05e0937`; `src/components/LayoutManager.tsx:149`.
- **Kategori:** Implementation integrity / UX.
- **Bukti reproduksi:** Setelah edit lalu mengganti tema, `undo(view)` menghasilkan false. Effect menghancurkan view lalu membuat EditorState baru pada perubahan ID/tema; unmount FullPreview juga membuang editor. Cursor/scroll yang disimpan tidak diterapkan saat pembuatan state, dan tidak ada listener scroll di komponen.
- **Dampak:** Pergantian tema atau tab memutus pekerjaan edit dan menghilangkan jalur Undo; posisi pembacaan tidak pulih sesuai kontrak.
- **Rekomendasi:** Simpan EditorState per tab, reconfigure tema, pulihkan cursor/scroll, dan bersihkan referensi view pada unmount. Uji tab → kembali, tema, preview → editor.
- **Tindak lanjut:** `$impeccable harden`.

### 07 — [P1] Jalur PDF lokal belum kompatibel dengan model keamanan aplikasi

- **Lokasi:** `src/App.tsx:89–100`; `src-tauri/src/services/fs.rs:70–73`; `src/components/PdfViewer.tsx:6`, `36–42`; `src-tauri/tauri.conf.json:29`.
- **Kategori:** Implementation integrity / offline support.
- **Bukti source:** Semua Open terlebih dahulu memakai `read_to_string`, termasuk PDF biner (akan gagal untuk byte bukan UTF-8). Viewer membentuk URL `file://` dan memuat worker dari CDN; CSP tidak mengizinkan CDN tersebut maupun koneksi file. Tidak ada jalur byte IPC/asset scope yang dikonfigurasi. Cleanup tidak menghancurkan loading task/document PDF.
- **Dampak:** Fitur inti PDF dapat gagal sebelum tab dibuat, diblokir pada webview, dan tidak mandiri saat offline; perpindahan dokumen dapat mempertahankan resource worker.
- **Rekomendasi:** Pisahkan deteksi PDF sebelum text read, baca byte melalui IPC yang dibatasi, bundle worker lokal, destroy task/doc saat pindah, lalu uji PDF biner offline pada installer WebView2 sebenarnya.
- **Tindak lanjut:** `$impeccable harden`. Kegagalan native belum direproduksi melalui installer pada audit ini; temuan didasarkan pada jalur source dan kebijakan yang eksplisit.

### 08 — [P1] Status cached/saved tidak mengikuti keberhasilan dan revisi penyimpanan

- **Lokasi:** `src/store/tabStore.ts:49`, `169`, `210–224`; `src/App.tsx:60–85`, `181`.
- **Kategori:** Implementation integrity / error UX.
- **Bukti:** Kegagalan draft/session diabaikan dengan catch kosong. `Draft Cached (Unsaved)` bergantung hanya pada `isDirty`, bahkan sebelum timer berjalan. Save menunggu I/O lalu `markClean` tanpa memeriksa apakah pengguna telah mengedit lagi selama menunggu. Open/Save error hanya masuk console.
- **Dampak:** Pengguna mendapat kesan pekerjaan aman padahal write gagal; perubahan lebih baru bisa ditandai clean dan draft dihapus meskipun belum berada di disk.
- **Rekomendasi:** Status pending/saved/error berbasis acknowledgement per revisi; pertahankan dirty bila buffer berubah; tampilkan retry/error yang dapat diakses; urutkan pending draft terhadap save/close.
- **Tindak lanjut:** `$impeccable harden`, `$impeccable clarify`.

### 09 — [P1] Canonicalization belum membentuk batas izin file

- **Lokasi:** `src-tauri/src/services/fs.rs:7–44`; `src-tauri/src/commands/fs.rs:6–15`.
- **Kategori:** Security / implementation integrity.
- **Bukti:** `..` ditolak tetapi hasil canonicalization tidak dibandingkan dengan direktori/path yang diizinkan. Command menerima path absolut arbitrary; hasil native picker tidak diregistrasi sebagai izin. Parent yang belum ada bahkan dikembalikan tanpa canonicalization.
- **Dampak:** Kebijakan containment yang dijanjikan tidak diterapkan. Jika renderer disalahgunakan, tidak ada pembatas service yang menahan read/write pada file lain yang dapat diakses proses. Ini bukan klaim bahwa eksploit XSS aktif sudah ditemukan.
- **Rekomendasi:** Kebijakan izin berbasis file/direktori yang dipilih pengguna dan root internal; verifikasi canonical target setelah resolusi link/reparse point, serta uji symlink/junction dan pergantian path saat operasi.
- **Tindak lanjut:** `$impeccable harden` dengan remediasi Rust dan tes keamanan.

### 10 — [P1] Tema terang menghasilkan foreground terang/gelap yang tidak berpasangan

- **Lokasi:** `tailwind.config.js:11–46`; `src/index.css:5–27`; `src/components/AIPalette.tsx:272`, `418`; `src/components/TabBar.tsx:49`; `src/components/LayoutManager.tsx:71`.
- **Kategori:** Theming / accessibility.
- **Bukti source:** `data-theme` mengganti CSS variables, tetapi `bg-slate-shell`, `bg-obsidian`, `text-parchment` tetap literal dark. Markdown AI memakai `.prose-docuopsy` dengan foreground variable: dalam light mode ink menjadi `#12161F` di panel yang tetap `#111722` (rasio kalkulasi sekitar 1:1).
- **Dampak:** Chrome tidak mengikuti tema; respons AI pada tema terang berpotensi nyaris tak terbaca. Verifikasi screenshot light theme masih diperlukan.
- **Rekomendasi:** Petakan utility warna ke semantic variables dengan dukungan opacity, lalu uji semua overlay, code preview, PDF controls, error, dan teks AI pada kedua tema.
- **Tindak lanjut:** `$impeccable harden`, `$impeccable colorize`.

### 11 — [P1] Kontras dan interaksi keyboard belum memenuhi baseline aksesibilitas

- **Lokasi:** `src/App.tsx:194–200`; `src/components/TabBar.tsx:63–92`; `src/components/LayoutManager.tsx:162–167`; `src/components/AIPalette.tsx:268–272`, `494–510`; `src/index.css`.
- **Kategori:** Accessibility / responsive interaction.
- **Bukti rendered:** Footer AI `#7C5CFC` di `#111722` = **4.1:1**, keycap di `#18202F` = **3.7:1**, di bawah 4.5:1 untuk teks kecil; ditemukan pada kedua viewport.
- **Bukti source:** Tab berupa div tanpa tabIndex/keyboard selection; tombol close opacity 0 hanya muncul melalui hover. Splitter hanya mouse, tidak focusable atau keyboard-adjustable. Dialog modal tidak mengisolasi/trap/restore fokus; Escape hanya pada input yang dinonaktifkan selama streaming. Prompt tidak punya label eksplisit. Tidak ada reduced-motion alternative untuk pulse/spin/smooth-scroll.
- **Dampak/standar:** Hambatan untuk keyboard, low vision, dan pengguna sensitif gerakan; kegagalan kontras WCAG 1.4.3 terukur, masalah 2.1.1/2.4.7/4.1.2 perlu dilengkapi pengujian assistive technology. Tidak menyimpulkan semua target <44 px otomatis gagal AA.
- **Rekomendasi:** Token kontras yang lolos AA, roving tabs dan visible focus, splitter pointer+keyboard, modal fokus/Escape lintas elemen, label prompt, reduced motion. Uji desktop pada 200% text/zoom; dialog 560 px tetap perlu max-height relatif viewport. Gesture touch/pen belum disimulasikan.
- **Tindak lanjut:** `$impeccable harden`, `$impeccable adapt`.

### 12 — [P1] Lifecycle stream AI tidak aman terhadap tutup/buka dan gagal membedakan percakapan

- **Lokasi:** `src/components/AIPalette.tsx:136–198`, `228–239`; `src-tauri/src/services/ai.rs:132–143`, `207–243`.
- **Kategori:** Implementation integrity.
- **Bukti source:** Listener dilepas saat palette ditutup, request backend tidak dibatalkan; `isStreaming` tidak direset pada close atau penyelesaian invoke yang sukses. Buka kembali sesudah final event terlewat dapat meninggalkan input disabled. Event tidak difilter dengan `streamId`. Backend hanya menerima prompt saat ini dan context dokumen, bukan riwayat messages, meski UI tampak sebagai chat multi-turn. Error stream diikuti final completed event.
- **Dampak:** Chat dapat macet, output event salah tercampur, dan pertanyaan lanjutan kehilangan konteks percakapan.
- **Rekomendasi:** State per stream, cancellation/finalization yang terjamin, listener dengan cleanup aman, filter ID, model percakapan yang eksplisit; uji close/reopen, disconnect, late event, dan timeout memakai mock server.
- **Tindak lanjut:** `$impeccable harden`.

### 13 — [P2] Jalur performa belum dibuktikan untuk dokumen besar

- **Lokasi:** `src/components/EditorPane.tsx:38`; `src/components/MarkdownPreview.tsx:25–28`; `src/components/AIPalette.tsx:401–420`; `src-tauri/src/services/fs.rs:49–73`.
- **Kategori:** Performance.
- **Bukti:** JS utama 1,315.29 kB minified; PDF diimpor eager. Setiap edit membentuk seluruh string dokumen dan merender/sanitasi seluruh Markdown. Seluruh respons AI lama diparse ulang setiap chunk. Fungsi async Rust memanggil filesystem sinkron. Atomic write memakai `flush`, tanpa bukti durability power-loss (`sync_all` dan uji restart/power interruption).
- **Dampak:** Risiko input lag, memori tinggi, dan blocking worker pada file besar; klaim <1.5 detik/60 FPS/power-loss safety belum dibuktikan. Tidak ada angka benchmark yang dikarang dari source.
- **Rekomendasi:** Lazy-load PDF/preview, jadwalkan render dengan bounded work, memoize pesan, pindahkan blocking I/O, ukur startup/typing/scroll/RSS pada 50k baris dan PDF besar serta validasi durability sesuai target Windows.
- **Tindak lanjut:** `$impeccable optimize`.

### 14 — [P2] Infrastruktur logging ada tetapi tidak aktif di entrypoint

- **Lokasi:** `src-tauri/src/main.rs:4–6`, `src-tauri/src/lib.rs:38`; `src-tauri/src/logging.rs:39`; `src-tauri/src/services/ai.rs:76`, `175`.
- **Kategori:** Implementation integrity / observability.
- **Bukti:** Tidak ada pemanggilan `init_tracing()` pada entrypoint/setup; WorkerGuard tidak dipertahankan. Helper redaction hanya dipakai command logging, bukan semua tracing event. AI error body/raw malformed payload dapat masuk tracing jika subscriber diaktifkan nanti.
- **Dampak:** Dukungan insiden/crash tidak memperoleh rolling log sebagaimana dijanjikan; sekadar mengaktifkan logger belum menjamin privasi data.
- **Rekomendasi:** Inisialisasi subscriber sekali dan simpan guard sepanjang aplikasi; hanya log metadata untuk AI; implementasikan retention dan tes sink aktual, bukan hanya helper redaction.
- **Tindak lanjut:** `$impeccable harden` dengan pekerjaan Rust.

### 15 — [P1] Dependensi pengujian memiliki advisory keamanan yang belum ditangani

- **Lokasi:** `bun.lock:369`, `671`, `703`; `package.json` devDependencies.
- **Kategori:** Security / release tooling.
- **Bukti:** Lock memasang Vitest/mocker 3.2.7 dan Tinypool 1.1.1. Bun audit melaporkan empat advisory unik (satu muncul pada dua paket). Dua advisory Tinypool diberi critical oleh database; isu prototype-pollution gadget memerlukan kondisi eksploit yang relevan, bukan bukti app desktop otomatis bisa dieksploitasi. [Tinypool worker options](https://github.com/advisories/GHSA-5gmw-xhrv-c9v3), [Tinypool run options](https://github.com/advisories/GHSA-85c8-ppgw-ccpr), [Vitest mock redirect](https://github.com/advisories/GHSA-82fw-gwwq-j7x9).
- **Dampak:** Risiko pada toolchain developer/CI. Paket ini dev dependency; jangan menyatakan temuan tersebut sebagai RCE runtime aplikasi tanpa bukti jalur bundling/exposure.
- **Rekomendasi:** Upgrade rangkaian test tooling secara kompatibel sampai semua advisory terkait tertangani, regenerate lock dan jalankan ulang suite; jangan expose test server ke jaringan tak tepercaya. Lengkapi scan Rust dan license inventory.
- **Tindak lanjut:** `$impeccable harden` dengan pembaruan dependency.

### 16 — [P2] Penerimaan release belum reproducible atau setara installer

- **Lokasi:** `.gitignore:10`; tidak ada workflow tracked di `.github`; `TODOS.md` dan `docs/memory/brain-map.md` berisi klaim historis completed.
- **Kategori:** Implementation integrity / delivery.
- **Bukti:** `Cargo.lock` diabaikan dan tidak tracked; tidak ditemukan CI workflow. Pengujian PDF/AI/editor mayoritas mengecek mount/controls/parser, bukan alur native terpadu. Frontend build tidak sama dengan build+install paket Windows.
- **Dampak:** Mesin lain dapat resolve Rust dependencies berbeda; regresi inti bisa lolos semua tes yang ada. Status dashboard lama memberi keyakinan berlebihan.
- **Rekomendasi:** Commit lock aplikasi, CI empat gate + build installer + audit dependencies/secrets, acceptance nyata save/reopen/crash/PDF offline/AI failure. Verifikasi lisensi transitif dan lifecycle install/update/uninstall sebelum release.
- **Tindak lanjut:** `$impeccable harden`, lalu `$impeccable audit`.

## Penilaian hasil detector dan pola sistemik

- Source detector melaporkan 42 advisory font-size dan 2 radius. Beberapa 11 px chip memang disebut dalam DESIGN.md body walaupun tidak ada pada ramp frontmatter: jangan menghitung semuanya sebagai pelanggaran. Teks 9–10 px perlu review keterbacaan, bukan penggantian mekanis.
- Warning `side-tab` pada `src/index.css:179` adalah border blockquote semantik, **false positive**, bukan kartu dekoratif yang harus dihapus.
- Dua warning rendered footer adalah temuan kontras terverifikasi. Detector dijalankan pada preview Vite Chromium, dark initial state, dengan viewport emulasi 1280×800 dan 800×600. Tidak menjalankan gesture touch.
- Pola utama: state keselamatan berdasarkan asumsi, lifecycle async belum teruji, token semantic dan literal bercampur, serta tes mount memberi cakupan yang terlalu dangkal untuk klaim recovery.

## Hal yang sudah baik

- Markdown dokumen dan respons AI disanitasi DOMPurify sebelum masuk DOM; tes XSS dasar lolos.
- CodeMirror menyediakan viewport rendering; preview dokumen memiliki reading measure 70ch.
- Tempfile berada di filesystem target sebelum atomic replacement; traversal `..` eksplisit ditolak.
- IPC wrapper TypeScript dan model Rust jelas; theme palette, tabular numbers, ikon berlabel, serta tes reguler merupakan fondasi yang berguna.

## Batas cakupan dan acceptance berikutnya

Browser UI control gagal (timeout dan transport closed). Detector browser berhasil setelah pengulangan dengan izin lokal, tetapi tidak ada inspeksi screenshot langsung, light-theme render, screen reader, physical touch, atau desktop WebView2/CDP. Tidak ada screenshot/golden yang tersedia di berkas tracked. Tidak ada live request AI berbayar, pengujian kunci, dokumen pengguna, installer release, OS signing, runtime crash/power loss, atau benchmark startup/memori. Audit lisensi lengkap dan advisory Rust juga belum dilakukan. Hasil di atas tidak boleh dibaca sebagai kelulusan aspek-aspek tersebut.

Urutan kerja yang disarankan:

1. **[P0/P1] `$impeccable harden`**: kredensial dan workflow editor/save/recovery/PDF/AI, dilengkapi perubahan backend dan test failure-path.
2. **[P1] `$impeccable adapt`**: keyboard, focus, splitter, skala teks, dan modal pada viewport desktop minimum.
3. **[P1] `$impeccable colorize`**: semantic token parity dan kontras kedua tema.
4. **[P1] `$impeccable clarify`**: status cached/saved/error berdasarkan hasil nyata.
5. **[P2] `$impeccable optimize`**: bundle, rendering dokumen besar, PDF cleanup, dan I/O.
6. **`$impeccable audit`**: ulangi audit pada commit release yang dibekukan dan installer yang sama.
7. **`$impeccable polish`**: finishing setelah blocker dan acceptance selesai.

Perintah tersebut bisa diminta satu per satu, sekaligus, atau dalam urutan yang dipilih. Jalankan ulang `$impeccable audit` setelah perbaikan untuk menilai perubahan skor dan menutup temuan dengan bukti.
