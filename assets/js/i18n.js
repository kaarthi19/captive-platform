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
    hero_p:"Click any captive coal site — an industrial park or a standalone plant — to see its energy mix, clean-energy alternatives, grid-connection options, and what each stakeholder must invest. Built on a co-optimized generation & transmission expansion model.",
    hero_cta:'Explore facility evidence', hero_method:'Review the methodology →',
    explore_kick:'Facility explorer', explore_h:'Move from national ambition to facility-level decisions.',
    explore_p:'Filter the fleet, compare transition readiness, and open a facility to examine pathways, costs, and stakeholder investment needs.',
    stake_kick:'Built for decisions', stake_h:'One evidence base, three stakeholder perspectives.',
    stake_ind_h:'Industrial parks', stake_ind_p:'Compare on-site clean energy, grid connection, and hybrid pathways against operating cost and emissions.',
    stake_pln_h:'PLN & public planners', stake_pln_p:'See where transmission investment can unlock credible coal-reduction pathways across industrial corridors.',
    stake_fin_h:'Finance & development partners', stake_fin_p:'Identify investment requirements, readiness constraints, and facilities where further diligence can begin.',
    s1:'captive coal sites mapped', s2:'captive coal operating',
    s3:'PerPres 112/2022 cut, 10 yrs', s4:'of operating capacity in Sulawesi & N. Maluku',
    f_ind:'Industry', f_all:'All', f_region:'Region', f_allreg:'All regions',
    f_status:'Status', f_any:'Any', f_op:'Has operating units', f_pipe:'Has units in the pipeline',
    f_model:'Covered by the model',
    leg_t:'Sector', leg_ni:'Nickel', leg_al:'Aluminium & alumina', leg_ot:'Other sectors',
    leg_pipe:'pipeline only, not yet operating', leg_s:'size = capacity',
    leg_ready:'Transition readiness: pending model results', leg_def:'How we define this →',
    hint:'Click a marker to open its facility card. Site data: Earthwise Institute, Indonesian Power Summary Database (2026).',
    kind_park:'Industrial park', kind_plant:'Standalone plant',
    tbl_h:'All sites', tbl_search:'Search site, owner or province', tbl_count:'sites shown',
    th_site:'Site', th_prov:'Province', th_pipe2:'Pipeline', th_model:'Model', yes:'Yes', no:'Not yet',
    pop_op:'Operating', pop_con:'Under construction', pop_plan:'Planned', pop_owner:'Main owner',
    pop_units:'Coal units', pop_since:'since',
    pop_modeled:'Included in the capacity-expansion model.', pop_unmodeled:'Not yet in the capacity-expansion model.',
    pop_view:'View full analysis',

    /* facility */
    back_map:'Back to map', fac_kick:'Facility analysis',
    fac_path:'Pathway comparison', fac_pathp:'Levelized cost of electricity at current assumptions',
    fac_mix:'Current energy mix', fac_sens:'Coal-price & grid-tariff sensitivity',
    fac_sensp:'Drag the sliders — the cheapest pathway updates live',
    sl_coal:'Coal price', sl_tariff:'Grid tariff', sl_solar:'Solar + storage capex',
    fac_inv:'Investment by stakeholder', th_stake:'Stakeholder', th_act:'Action',
    fac_cost:'Cost breakdown — hybrid pathway',
    fac_profile:'Captive coal on site',
    fac_source:'Unit-level data from the Earthwise Institute Indonesian Power Summary Database (2026).',
    th_start:'Since',
    fac_illus:'Pathway, cost and energy-mix figures below are illustrative. Model results for each site are not loaded yet.',
    fac_modeled:'Included in the capacity-expansion model', fac_nodes:'model nodes',
    fac_unmodeled:'Not yet in the capacity-expansion model: this site was added from the Earthwise database after the last model run.',
    fac_timeline:'Captive coal capacity by start year', fac_facts:'Key facts',
    fac_units:'Coal units', fac_unitsp:'Every captive coal unit recorded at this site, including cancelled, shelved and retired ones.',
    th_unit:'Unit', th_status:'Status', th_owner_direct:'Owner', th_project:'Supports',
    show_all:'Show all units', show_less:'Show fewer units',
    fac_projects:'Industrial projects powered from this site',
    fac_projectsp:'Smelters, refineries and downstream plants linked to this site in the Earthwise extended database.',
    th_projname:'Project', th_product:'Product', th_cap:'Capacity',
    fac_fin:'Financing', fac_finp:"Disclosed loans of three years or longer linked to this site's power units (project finance or capex loans).",
    th_year:'Year', th_financiers:'Financier(s)', th_amount:'USD m', th_type:'Type', th_ref:'Source',
    fin_indirect:'not earmarked for captive coal', fac_srcs:'Sources:', records:'unit records',
    k_location:'Location', k_island:'Island', k_small:'small island', k_coords:'Coordinates', k_exact:'exact', k_approx:'approximate',
    k_commod:'Commodities', k_ownership:'Ownership', k_jv:'joint venture', k_owners:'Ultimate owners', k_countries:'Owner countries',
    k_epc:'EPC contractors', k_china:'Chinese involvement', k_other:'Other power on site', k_aka:'Also known as',
    own_poe:'Private', own_soe:'State-owned', own_mixed:'Mixed', own_public:'Public',
    st_Operating:'Operating', st_Construction:'Construction', st_PreConstruction:'Pre-construction', st_Announced:'Announced',
    st_Cancelled:'Cancelled', st_Shelved:'Shelved', st_Retired:'Retired', st_Closed:'Closed', st_NA:'Unknown',

    /* region */
    reg_kick:'Regional aggregation', reg_h:'Sulawesi corridor',
    reg_sub:'System-wide implications and transmission upgrades if captive parks connect to PLN’s grid',
    rs1:'captive coal operating in region', rs2:'captive coal sites', rs3:'connectable if lines built', rs4:'transmission capex',
    reg_map:'Transmission map', reg_mapp:'Parks, grid hubs and the corridors that would connect them',
    reg_toggle:'Show proposed upgrades', reg_cap:'Operating capacity by site', reg_leg_site:'Captive site (blue = nickel, grey = other)',
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
    hero_p:'Klik lokasi batu bara captive mana pun — kawasan industri atau pembangkit mandiri — untuk melihat bauran energinya, alternatif energi bersih, opsi koneksi jaringan, dan investasi setiap pemangku kepentingan. Dibangun di atas model ekspansi pembangkitan & transmisi.',
    hero_cta:'Jelajahi bukti fasilitas', hero_method:'Tinjau metodologi →',
    explore_kick:'Penjelajah fasilitas', explore_h:'Dari ambisi nasional menuju keputusan tingkat fasilitas.',
    explore_p:'Saring armada, bandingkan kesiapan transisi, dan buka fasilitas untuk menilai jalur, biaya, serta kebutuhan investasi pemangku kepentingan.',
    stake_kick:'Dibangun untuk keputusan', stake_h:'Satu dasar bukti, tiga perspektif pemangku kepentingan.',
    stake_ind_h:'Kawasan industri', stake_ind_p:'Bandingkan energi bersih di lokasi, koneksi jaringan, dan jalur hibrida berdasarkan biaya operasi dan emisi.',
    stake_pln_h:'PLN & perencana publik', stake_pln_p:'Lihat di mana investasi transmisi dapat membuka jalur pengurangan batu bara yang kredibel di koridor industri.',
    stake_fin_h:'Mitra keuangan & pembangunan', stake_fin_p:'Identifikasi kebutuhan investasi, kendala kesiapan, dan fasilitas yang siap untuk kajian lebih lanjut.',
    s1:'lokasi batu bara captive dipetakan', s2:'batu bara captive beroperasi',
    s3:'pengurangan PerPres 112/2022, 10 thn', s4:'kapasitas operasi di Sulawesi & Maluku Utara',
    f_ind:'Industri', f_all:'Semua', f_region:'Wilayah', f_allreg:'Semua wilayah',
    f_status:'Status', f_any:'Semua', f_op:'Ada unit beroperasi', f_pipe:'Ada unit dalam rencana',
    f_model:'Tercakup dalam model',
    leg_t:'Sektor', leg_ni:'Nikel', leg_al:'Aluminium & alumina', leg_ot:'Sektor lain',
    leg_pipe:'hanya rencana, belum beroperasi', leg_s:'ukuran = kapasitas',
    leg_ready:'Kesiapan transisi: menunggu hasil model', leg_def:'Cara kami mendefinisikan ini →',
    hint:'Klik penanda untuk membuka kartu fasilitas. Data lokasi: Earthwise Institute, Indonesian Power Summary Database (2026).',
    kind_park:'Kawasan industri', kind_plant:'Pembangkit mandiri',
    tbl_h:'Semua lokasi', tbl_search:'Cari lokasi, pemilik, atau provinsi', tbl_count:'lokasi ditampilkan',
    th_site:'Lokasi', th_prov:'Provinsi', th_pipe2:'Rencana', th_model:'Model', yes:'Ya', no:'Belum',
    pop_op:'Beroperasi', pop_con:'Dalam konstruksi', pop_plan:'Direncanakan', pop_owner:'Pemilik utama',
    pop_units:'Unit batu bara', pop_since:'sejak',
    pop_modeled:'Termasuk dalam model ekspansi kapasitas.', pop_unmodeled:'Belum termasuk dalam model ekspansi kapasitas.',
    pop_view:'Lihat analisis lengkap',

    back_map:'Kembali ke peta', fac_kick:'Analisis fasilitas',
    fac_path:'Perbandingan jalur', fac_pathp:'Biaya listrik terlevelisasi pada asumsi saat ini',
    fac_mix:'Bauran energi saat ini', fac_sens:'Sensitivitas harga batu bara & tarif jaringan',
    fac_sensp:'Geser slider — jalur termurah diperbarui langsung',
    sl_coal:'Harga batu bara', sl_tariff:'Tarif jaringan', sl_solar:'Capex surya + penyimpanan',
    fac_inv:'Investasi per pemangku kepentingan', th_stake:'Pemangku kepentingan', th_act:'Tindakan',
    fac_cost:'Rincian biaya — jalur hibrida',
    fac_profile:'Batu bara captive di lokasi',
    fac_source:'Data tingkat unit dari Earthwise Institute Indonesian Power Summary Database (2026).',
    th_start:'Sejak',
    fac_illus:'Angka jalur, biaya, dan bauran energi di bawah ini bersifat ilustratif. Hasil model per lokasi belum dimuat.',
    fac_modeled:'Termasuk dalam model ekspansi kapasitas', fac_nodes:'simpul model',
    fac_unmodeled:'Belum termasuk dalam model ekspansi kapasitas: lokasi ini ditambahkan dari basis data Earthwise setelah putaran model terakhir.',
    fac_timeline:'Kapasitas batu bara captive menurut tahun mulai', fac_facts:'Fakta utama',
    fac_units:'Unit batu bara', fac_unitsp:'Semua unit batu bara captive yang tercatat di lokasi ini, termasuk yang dibatalkan, ditunda, dan dipensiunkan.',
    th_unit:'Unit', th_status:'Status', th_owner_direct:'Pemilik', th_project:'Memasok',
    show_all:'Tampilkan semua unit', show_less:'Tampilkan lebih sedikit',
    fac_projects:'Proyek industri yang dipasok dari lokasi ini',
    fac_projectsp:'Smelter, kilang, dan pabrik hilir yang terkait dengan lokasi ini dalam basis data lanjutan Earthwise.',
    th_projname:'Proyek', th_product:'Produk', th_cap:'Kapasitas',
    fac_fin:'Pembiayaan', fac_finp:'Pinjaman bertenor tiga tahun atau lebih yang diungkapkan dan terkait dengan unit pembangkit di lokasi ini (pembiayaan proyek atau pinjaman capex).',
    th_year:'Tahun', th_financiers:'Pemberi pinjaman', th_amount:'USD jt', th_type:'Jenis', th_ref:'Sumber',
    fin_indirect:'tidak khusus untuk batu bara captive', fac_srcs:'Sumber:', records:'catatan unit',
    k_location:'Lokasi', k_island:'Pulau', k_small:'pulau kecil', k_coords:'Koordinat', k_exact:'tepat', k_approx:'perkiraan',
    k_commod:'Komoditas', k_ownership:'Kepemilikan', k_jv:'usaha patungan', k_owners:'Pemilik akhir', k_countries:'Negara pemilik',
    k_epc:'Kontraktor EPC', k_china:'Keterlibatan Tiongkok', k_other:'Sumber listrik lain di lokasi', k_aka:'Nama lain',
    own_poe:'Swasta', own_soe:'BUMN', own_mixed:'Campuran', own_public:'Publik',
    st_Operating:'Beroperasi', st_Construction:'Konstruksi', st_PreConstruction:'Pra-konstruksi', st_Announced:'Diumumkan',
    st_Cancelled:'Dibatalkan', st_Shelved:'Ditunda', st_Retired:'Dipensiunkan', st_Closed:'Ditutup', st_NA:'Tidak diketahui',

    reg_kick:'Agregasi wilayah', reg_h:'Koridor Sulawesi',
    reg_sub:'Implikasi sistem dan peningkatan transmisi jika kawasan captive terhubung ke jaringan PLN',
    rs1:'batu bara captive beroperasi di wilayah', rs2:'lokasi batu bara captive', rs3:'dapat terhubung bila jalur dibangun', rs4:'capex transmisi',
    reg_map:'Peta transmisi', reg_mapp:'Kawasan, simpul jaringan, dan koridor penghubungnya',
    reg_toggle:'Tampilkan peningkatan yang diusulkan', reg_cap:'Kapasitas operasi per lokasi', reg_leg_site:'Lokasi captive (biru = nikel, abu-abu = lainnya)',
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
  document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
    if (d[el.dataset.i18nPh] != null) el.placeholder = d[el.dataset.i18nPh];
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
