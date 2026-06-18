/* Bilingual (EN / Bahasa Indonesia) string table + toggle.
   Any element with data-i18n="key" gets its text swapped. Choice persists in localStorage. */

window.I18N = {
  en: {
    nav_explore:'Explore map', nav_region:'Regions', nav_method:'Methodology', nav_about:'About',
    m_h1:'How the analysis works',
    m_lead:'Each pathway, cost and readiness rating on this platform comes from a generation & transmission capacity-expansion model that co-optimizes industrial facility investments alongside the PLN grid. This page summarizes that method, drawn from the November 2025 report.',
    m_obj:'Research objective', m_approach:'Co-optimization approach', m_path:'Decarbonization pathways',
    m_model:'The optimization model', m_data:'Data sources', m_re:'Renewable resource assessment',
    m_assume:'Key assumptions & sensitivities', m_ready:'Defining transition readiness',
    brand_sub:'Indonesia · Power Transformation Lab',
    foot_rights:'© 2026 Power Transformation Lab · UC San Diego · CC-BY open data',
    foot_req:'Request analysis', foot_work:'Workshops',

    /* home */
    hero_kick:'Open-access · bilingual · facility-level',
    hero_h1:"Decarbonization pathways for Indonesia's captive coal fleet",
    hero_p:"Click any of the 130+ industrial parks to see its energy mix, clean-energy alternatives, grid-connection options, and what each stakeholder must invest. Built on a co-optimized generation & transmission expansion model.",
    s1:'industrial parks mapped', s2:'captive coal capacity',
    s3:'PerPres 112/2022 cut, 10 yrs', s4:'capacity in Sulawesi & N. Maluku',
    f_ind:'Industry', f_all:'All', f_alu:'Aluminum', f_pulp:'Pulp & paper',
    f_region:'Region', f_ready:'Readiness',
    leg_t:'Transition readiness', leg_h:'High', leg_m:'Medium', leg_l:'Low', leg_s:'size = capacity',
    leg_def:'How we define this →',
    hint:'Click a marker to open its facility card · 12 sample parks shown of 130+',
    pop_cap:'Capacity', pop_ei:'Emissions intensity', pop_cost:'Est. transition cost',
    pop_mix:'Energy mix today', pop_coal:'coal', pop_clean:'clean', pop_view:'View full analysis',

    /* facility */
    back_map:'Back to map', fac_kick:'Facility analysis',
    fac_path:'Pathway comparison', fac_pathp:'Levelized cost of electricity at current assumptions',
    fac_mix:'Current energy mix', fac_sens:'Coal-price & grid-tariff sensitivity',
    fac_sensp:'Drag the sliders — the cheapest pathway updates live',
    sl_coal:'Coal price', sl_tariff:'Grid tariff', sl_solar:'Solar + storage capex',
    fac_inv:'Investment by stakeholder', th_stake:'Stakeholder', th_act:'Action',
    fac_cost:'Cost breakdown — hybrid pathway',

    /* region */
    reg_kick:'Regional aggregation', reg_h:'Sulawesi corridor',
    reg_sub:'System-wide implications and transmission upgrades if captive parks connect to PLN’s grid',
    rs1:'captive coal in region', rs2:'major parks', rs3:'connectable if lines built', rs4:'transmission capex',
    reg_map:'Transmission map', reg_mapp:'Parks, grid hubs and the corridors that would connect them',
    reg_toggle:'Show proposed upgrades', reg_cap:'Park capacity & readiness',
    reg_tx:'Transmission upgrades needed', th_corr:'Corridor',

    /* about */
    ab_kick:'About the platform', ab_h:'Bridging modeling and real-world decisions',
    ab_p:'An open-access decision-support tool from the Power Transformation Lab at UC San Diego, translating sector-wide transition studies into facility-specific, investment-ready guidance for park owners, PLN, provincial governments, and financiers.',
    ab_team:'Team', ab_data:'Data & methodology', ab_part:'Partners & stakeholders',
    ab_partp:'Engaged through workshops and bilateral outreach in Jakarta, Bandung & Sulawesi'
  },
  id: {
    nav_explore:'Jelajahi peta', nav_region:'Wilayah', nav_method:'Metodologi', nav_about:'Tentang',
    m_h1:'Cara kerja analisis',
    m_lead:'Setiap jalur, biaya, dan peringkat kesiapan di platform ini berasal dari model ekspansi kapasitas pembangkitan & transmisi yang meng-ko-optimisasi investasi fasilitas industri bersama jaringan PLN. Halaman ini merangkum metode tersebut, berdasarkan laporan November 2025.',
    m_obj:'Tujuan penelitian', m_approach:'Pendekatan ko-optimisasi', m_path:'Jalur dekarbonisasi',
    m_model:'Model optimisasi', m_data:'Sumber data', m_re:'Penilaian sumber daya terbarukan',
    m_assume:'Asumsi utama & sensitivitas', m_ready:'Mendefinisikan kesiapan transisi',
    brand_sub:'Indonesia · Power Transformation Lab',
    foot_rights:'© 2026 Power Transformation Lab · UC San Diego · data terbuka CC-BY',
    foot_req:'Minta analisis', foot_work:'Lokakarya',

    hero_kick:'Akses terbuka · dwibahasa · tingkat fasilitas',
    hero_h1:'Jalur dekarbonisasi untuk armada batu bara captive Indonesia',
    hero_p:'Klik salah satu dari 130+ kawasan industri untuk melihat bauran energinya, alternatif energi bersih, opsi koneksi jaringan, dan investasi setiap pemangku kepentingan. Dibangun di atas model ekspansi pembangkitan & transmisi.',
    s1:'kawasan industri dipetakan', s2:'kapasitas batu bara captive',
    s3:'pengurangan PerPres 112/2022, 10 thn', s4:'kapasitas di Sulawesi & Maluku Utara',
    f_ind:'Industri', f_all:'Semua', f_alu:'Aluminium', f_pulp:'Pulp & kertas',
    f_region:'Wilayah', f_ready:'Kesiapan',
    leg_t:'Kesiapan transisi', leg_h:'Tinggi', leg_m:'Sedang', leg_l:'Rendah', leg_s:'ukuran = kapasitas',
    leg_def:'Cara kami mendefinisikan ini →',
    hint:'Klik penanda untuk membuka kartu fasilitas · 12 dari 130+ ditampilkan',
    pop_cap:'Kapasitas', pop_ei:'Intensitas emisi', pop_cost:'Perk. biaya transisi',
    pop_mix:'Bauran energi saat ini', pop_coal:'batu bara', pop_clean:'bersih', pop_view:'Lihat analisis lengkap',

    back_map:'Kembali ke peta', fac_kick:'Analisis fasilitas',
    fac_path:'Perbandingan jalur', fac_pathp:'Biaya listrik terlevelisasi pada asumsi saat ini',
    fac_mix:'Bauran energi saat ini', fac_sens:'Sensitivitas harga batu bara & tarif jaringan',
    fac_sensp:'Geser slider — jalur termurah diperbarui langsung',
    sl_coal:'Harga batu bara', sl_tariff:'Tarif jaringan', sl_solar:'Capex surya + penyimpanan',
    fac_inv:'Investasi per pemangku kepentingan', th_stake:'Pemangku kepentingan', th_act:'Tindakan',
    fac_cost:'Rincian biaya — jalur hibrida',

    reg_kick:'Agregasi wilayah', reg_h:'Koridor Sulawesi',
    reg_sub:'Implikasi sistem dan peningkatan transmisi jika kawasan captive terhubung ke jaringan PLN',
    rs1:'batu bara captive di wilayah', rs2:'kawasan utama', rs3:'dapat terhubung bila jalur dibangun', rs4:'capex transmisi',
    reg_map:'Peta transmisi', reg_mapp:'Kawasan, simpul jaringan, dan koridor penghubungnya',
    reg_toggle:'Tampilkan peningkatan yang diusulkan', reg_cap:'Kapasitas & kesiapan kawasan',
    reg_tx:'Peningkatan transmisi yang dibutuhkan', th_corr:'Koridor',

    ab_kick:'Tentang platform', ab_h:'Menjembatani pemodelan dan keputusan nyata',
    ab_p:'Alat pendukung keputusan akses terbuka dari Power Transformation Lab di UC San Diego, menerjemahkan studi transisi sektoral menjadi panduan siap-investasi tingkat fasilitas bagi pemilik kawasan, PLN, pemerintah provinsi, dan pemodal.',
    ab_team:'Tim', ab_data:'Data & metodologi', ab_part:'Mitra & pemangku kepentingan',
    ab_partp:'Terlibat melalui lokakarya dan pertemuan bilateral di Jakarta, Bandung & Sulawesi'
  }
};

window.applyLang = function (lang) {
  var d = window.I18N[lang] || window.I18N.en;
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    if (d[el.dataset.i18n] != null) el.textContent = d[el.dataset.i18n];
  });
  document.documentElement.lang = lang;
  try { localStorage.setItem('cp-lang', lang); } catch (e) {}
  document.querySelectorAll('.lang button').forEach(function (b) {
    b.classList.toggle('on', b.dataset.lang === lang);
  });
  window.CP_LANG = lang;
  if (typeof window.onLangChange === 'function') window.onLangChange(lang);
};

window.initLang = function () {
  var saved = 'en';
  try { saved = localStorage.getItem('cp-lang') || 'en'; } catch (e) {}
  document.querySelectorAll('.lang button').forEach(function (b) {
    b.addEventListener('click', function () { window.applyLang(b.dataset.lang); });
  });
  window.applyLang(saved);
};
