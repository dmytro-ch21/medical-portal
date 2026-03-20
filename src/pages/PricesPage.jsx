import { useState, useEffect } from "react";
import { content as contentApi } from "@/api/index.js";

export default function PricesPage() {
  const [prices, setPrices] = useState(null);

  useEffect(() => { contentApi.get("prices").then(setPrices); }, []);

  if (!prices) return <div className="text-sm text-muted py-8 text-center">Загрузка...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-1">Прайс-лист</h1>
      <p className="text-sm text-muted mb-6">Стартовые цены — финальная стоимость уточняется после консультации</p>

      {(prices.sections || []).map((section, si) => (
        <div key={si} className="bg-white border border-portal-border rounded-xl px-5 py-4 mb-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-accent mb-3">{section.title}</div>
          {section.items.map((item, i) => (
            <div key={i} className={`flex justify-between items-center py-2.5 ${i < section.items.length - 1 ? "border-b border-portal-border" : ""}`}>
              <span className="text-sm">{item.name}</span>
              <span className="text-sm font-bold text-accent">{item.price}</span>
            </div>
          ))}
        </div>
      ))}

      {prices.note && (
        <div className="bg-accent-light border border-portal-border rounded-xl px-5 py-3.5 mb-4">
          <p className="text-sm font-semibold text-accent-dark leading-relaxed">{prices.note}</p>
        </div>
      )}

      {prices.financing && (
        <div className="bg-white border border-portal-border rounded-xl px-5 py-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-accent mb-2">Рассрочка — Cherry</div>
          <p className="text-sm text-[#555] leading-relaxed">{prices.financing}</p>
        </div>
      )}
    </div>
  );
}
