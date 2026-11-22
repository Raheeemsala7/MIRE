import React from "react";
import { getLocale } from "next-intl/server";
import { Sparkles, ShieldCheck, Truck } from "lucide-react";

export async function ValuePillars() {
  const locale = await getLocale();
  const isRTL = locale === "ar";

  const pillars = [
    {
      icon: Sparkles,
      title: isRTL ? "أقمشة طبيعية منسدلة" : "Natural Fluid Fabrics",
      desc: isRTL
        ? "خامات ناعمة ومسامية تدوم طويلاً"
        : "Breathable, long-lasting natural blends",
    },
    {
      icon: ShieldCheck,
      title: isRTL ? "قصات محتشمة مدروسة" : "Considered Modest Cuts",
      desc: isRTL
        ? "حشمة وراحة وانسيابية دون مساومة"
        : "Contemporary modesty crafted for effortless ease",
    },
    {
      icon: Truck,
      title: isRTL ? "شحن سريع ودفع عند الاستلام" : "Fast Delivery & COD",
      desc: isRTL
        ? "توصيل لكافة المحافظات مع استرجاع ميسر"
        : "Reliable shipping across Egypt with flexible payment",
    },
  ];

  return (
    <section className="py-12 md:py-16 border-b border-border/40 bg-muted/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10">
          {pillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-4 p-4 rounded-2xl border border-border/40 bg-card/50"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                  <Icon className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {p.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {p.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
