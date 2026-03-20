import { useState, useEffect } from "react";
import { content as contentApi } from "@/api/index.js";

export default function ClinicPage() {
  const [clinic, setClinic] = useState(null);

  useEffect(() => { contentApi.get("clinic").then(setClinic); }, []);

  if (!clinic) return <div className="text-sm text-muted py-8 text-center">Загрузка...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-1">Клиника</h1>
      <p className="text-sm text-muted mb-6">Информация о клинике, врачах и имплантах</p>

      {/* Address */}
      <div className="bg-accent-light border border-portal-border rounded-xl px-5 py-4 mb-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-accent mb-2">Адрес</div>
        <div className="text-[15px] font-bold mb-0.5">{clinic.name}</div>
        <div className="text-sm text-[#555]">{clinic.address}</div>
        <div className="flex gap-4 mt-3">
          {clinic.instagram && <a href={clinic.instagram} target="_blank" rel="noreferrer" className="text-accent font-semibold text-sm hover:underline">Instagram</a>}
          {clinic.website && <a href={clinic.website} target="_blank" rel="noreferrer" className="text-accent font-semibold text-sm hover:underline">Сайт</a>}
        </div>
      </div>

      {/* Implants */}
      {clinic.implants && (
        <div className="bg-white border border-portal-border rounded-xl px-5 py-3.5 mb-6 flex items-center gap-3">
          <span className="text-xl">💎</span>
          <span className="text-sm text-[#444]">Импланты: <strong>{clinic.implants}</strong></span>
        </div>
      )}

      {/* Doctors */}
      {clinic.doctors && clinic.doctors.length > 0 && (
        <>
          <div className="text-[10px] font-bold uppercase tracking-widest text-accent mb-3">Врачи</div>
          <div className="flex flex-col gap-3">
            {clinic.doctors.map((doc, i) => (
              <div key={i} className="bg-white border border-portal-border rounded-xl px-5 py-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-[15px] font-bold mb-0.5">{doc.name}</div>
                    <div className="text-xs text-accent font-semibold">{doc.spec}</div>
                  </div>
                  <span className="text-2xl">👨‍⚕️</span>
                </div>
                <p className="text-sm text-[#555] leading-relaxed">{doc.desc}</p>
                {doc.link && (
                  <a href={doc.link} target="_blank" rel="noreferrer" className="text-accent font-semibold text-sm hover:underline mt-2 inline-block">
                    Профиль →
                  </a>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
