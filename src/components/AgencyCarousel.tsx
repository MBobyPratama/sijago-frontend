import Image from "next/image";
import "./agency-carousel.css";

const agencies = [
  { name: "Dinas PUPR Kota Bogor", jurisdiction: "Jalan kota", logo: "/images/instansi/logo_pupr.svg" },
  { name: "Dinas Bina Marga Jawa Barat", jurisdiction: "Jalan provinsi", logo: "/images/instansi/logo_dinas_bina_marga_jawa_barat.svg" },
  { name: "BBPJN DKI Jakarta–Jawa Barat", jurisdiction: "Jalan nasional", logo: "/images/instansi/logo_bbpjn_dki_jawa_barat.svg" },
];

export function AgencyCarousel() {
  return <section className="agency-carousel" aria-labelledby="agency-carousel-heading">
    <div className="pm-container">
      <div className="agency-carousel-heading"><h2 id="agency-carousel-heading">Instansi sesuai kewenangan jalan</h2><p>Penanganan laporan mengikuti kewenangan ruas jalan.</p></div>
      <div className="agency-carousel-window">
        <div className="agency-carousel-track">
          {[false, true].map(duplicate => <ul key={String(duplicate)} className="agency-carousel-group" aria-hidden={duplicate || undefined}>
            {agencies.map(agency => <li key={agency.logo} className="agency-carousel-item">
              <div className="agency-carousel-logo"><Image src={agency.logo} alt="" width={160} height={88} /></div>
              <div><p className="agency-carousel-name">{agency.name}</p><p className="agency-carousel-jurisdiction">{agency.jurisdiction}</p></div>
            </li>)}
          </ul>)}
        </div>
      </div>
    </div>
  </section>;
}
