import { Circle, Document, Font, Page, pdf, Rect, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import type { Dictionary } from "@/i18n/dictionaries/fr";
import type { Plan } from "@/lib/plan";
import type { Kind } from "@/lib/simulation";

type P = Dictionary["plan"];

export type PdfData = {
  p: P;
  slogan: string;
  methodName: string;
  methodDescription: string;
  income: string;
  date: string;
  money: (minor: number) => string;
  duration: (months: number) => string;
  rows: { label: string; kind: Kind; pct: number; amount: number; children: { label: string; pct: number; amount: number }[] }[];
  plan: Plan;
  tips: string[];
};

// Un PDF n'a pas les variables CSS du site : palette du thème clair de la charte (docs/brand-guidelines.md).
const C = {
  ink: "#0E1110", muted: "#5E6662", line: "#E4E7E5", sunken: "#F3F5F4", tint: "#E6FCEF",
  brand: "#2EF07F", brandInk: "#067A39", gold: "#C9A26B", goldInk: "#86652C", warning: "#995A00", white: "#FFFFFF",
};
const KIND: Record<Kind, string> = {
  need: "#2F6FB3", want: "#86652C", save: "#067A39", save2: "#C0562F", give: "#A3477A", learn: "#7A5AA8",
};
const RISK = { short: 1, medium: 2, long: 3 } as const;

let fonts = false;
function registerFonts() {
  if (fonts) return;
  fonts = true;
  const src = (f: string) => `${location.origin}/fonts/${f}.woff`;
  Font.register({ family: "Syne", fonts: [{ src: src("syne-latin-600-normal"), fontWeight: 600 }, { src: src("syne-latin-700-normal"), fontWeight: 700 }] });
  Font.register({
    family: "Instrument",
    fonts: [{ src: src("instrument-sans-latin-400-normal"), fontWeight: 400 }, { src: src("instrument-sans-latin-600-normal"), fontWeight: 600 }],
  });
  Font.registerHyphenationCallback((w) => [w]);
}

// Espaces fines insécables des nombres français : absentes des polices, remplacées par des espaces normales.
const clean = (s: string) => s.replace(/[  ]/g, " ");
const fill = (s: string, v: Record<string, string | number>) => clean(s.replace(/\{(\w+)\}/g, (m, k: string) => (k in v ? String(v[k]) : m)));

const s = StyleSheet.create({
  page: { fontFamily: "Instrument", fontSize: 10.5, color: C.ink, paddingTop: 36, paddingBottom: 60, paddingHorizontal: 40, lineHeight: 1.45 },
  brandRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 26 },
  brand: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandName: { fontFamily: "Syne", fontWeight: 700, fontSize: 15 },
  date: { color: C.muted, fontSize: 9.5 },
  hero: { backgroundColor: C.ink, borderRadius: 16, padding: 24, color: C.white, marginBottom: 22, position: "relative", overflow: "hidden" },
  title: { fontFamily: "Syne", fontWeight: 700, fontSize: 28, lineHeight: 1.1 },
  subtitle: { marginTop: 6, fontSize: 11, color: "#C9D2CD" },
  keys: { flexDirection: "row", gap: 10, marginTop: 20 },
  key: { flex: 1, borderRadius: 10, padding: 12, backgroundColor: "#1B201D" },
  keyBrand: { flex: 1, borderRadius: 10, padding: 12, backgroundColor: C.brand, color: C.ink },
  keyLabel: { fontSize: 8.5, opacity: 0.8 },
  keyValue: { fontFamily: "Syne", fontWeight: 700, fontSize: 15, marginTop: 4 },
  h2: { fontFamily: "Syne", fontWeight: 700, fontSize: 16, marginBottom: 10 },
  section: { marginBottom: 20 },
  bar: { flexDirection: "row", height: 14, borderRadius: 7, overflow: "hidden", marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: C.line },
  dot: { width: 9, height: 9, borderRadius: 3, marginRight: 8 },
  cellLabel: { flex: 1, fontWeight: 600 },
  cellPct: { width: 50, textAlign: "right", color: C.muted },
  cellAmount: { width: 110, textAlign: "right", fontWeight: 600 },
  child: { flexDirection: "row", paddingVertical: 3, paddingLeft: 17 },
  th: { flexDirection: "row", paddingBottom: 5, borderBottomWidth: 1, borderBottomColor: C.ink, fontSize: 8.5, color: C.muted },
  cards: { flexDirection: "row", gap: 10 },
  card: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: C.line, padding: 14 },
  cardLocked: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: C.line, borderStyle: "dashed", backgroundColor: C.sunken, padding: 14 },
  h3: { fontWeight: 600, fontSize: 12, marginBottom: 4 },
  small: { fontSize: 9, color: C.muted },
  gauge: { height: 8, borderRadius: 4, backgroundColor: C.sunken, marginVertical: 8, overflow: "hidden" },
  note: { backgroundColor: C.tint, borderRadius: 10, padding: 12, marginBottom: 14 },
  tip: { flexDirection: "row", gap: 8, marginBottom: 8 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.brand, marginTop: 5 },
  stepNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.ink, color: C.brand, textAlign: "center", fontWeight: 600, paddingTop: 4, fontSize: 10 },
  footer: { position: "absolute", bottom: 24, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", fontSize: 8.5, color: C.muted, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 8 },
  disclaimer: { borderRadius: 10, borderWidth: 1, borderColor: C.line, padding: 12, fontSize: 9, color: C.muted, marginTop: 6 },
});

function Logo({ size = 26 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Rect width={64} height={64} rx={14} fill={C.ink} />
      <Rect x={13} y={38} width={8} height={10} rx={1.5} fill={C.brand} />
      <Rect x={24} y={31} width={8} height={17} rx={1.5} fill={C.brand} />
      <Rect x={35} y={24} width={8} height={24} rx={1.5} fill={C.brand} />
      <Circle cx={47} cy={14} r={7} fill={C.gold} />
      <Rect x={6} y={49} width={52} height={3} fill={C.sunken} />
    </Svg>
  );
}

function Footer({ d }: { d: PdfData }) {
  return (
    <View style={s.footer} fixed>
      <Text>soon finance · {clean(d.slogan)}</Text>
      <Text render={({ pageNumber, totalPages }) => fill(d.p.docPage, { n: pageNumber, total: totalPages })} />
    </View>
  );
}

function PlanDocument({ d }: { d: PdfData }) {
  const { p, plan, money } = d;
  const e = plan.emergency;
  const top = Math.max(...plan.projection.map((x) => x.total), 1);
  const step = { debt: p.stepDebt, emergency: p.stepEmergency, invest: p.stepInvest }[plan.step];
  const status = e.months === 0 ? p.emergencyDone : e.months === null ? p.emergencyNever : fill(p.emergencyMonths, { n: e.months });
  const total = d.rows.reduce((a, r) => a + r.pct, 0) || 1;
  return (
    <Document title={p.docTitle} author="Soon Finance" creator="Soon Finance">
      <Page size="A4" style={s.page}>
        <View style={s.brandRow}>
          <View style={s.brand}><Logo /><Text style={s.brandName}>soon finance</Text></View>
          <Text style={s.date}>{fill(p.docFor, { date: d.date })}</Text>
        </View>

        <View style={s.hero}>
          <Svg width={220} height={110} viewBox="0 0 220 110" style={{ position: "absolute", right: -10, bottom: 0 }}>
            <Circle cx={150} cy={110} r={92} fill={C.gold} fillOpacity={0.12} />
            <Circle cx={150} cy={110} r={70} fill={C.gold} fillOpacity={0.22} />
            <Circle cx={150} cy={110} r={48} fill={C.gold} />
            <Rect x={0} y={108} width={220} height={2} fill={C.white} fillOpacity={0.6} />
          </Svg>
          <Text style={s.title}>{p.docTitle}</Text>
          <Text style={s.subtitle}>{clean(d.methodName)} · {clean(d.methodDescription)}</Text>
          <View style={s.keys}>
            <View style={s.key}><Text style={s.keyLabel}>{p.docIncome}</Text><Text style={s.keyValue}>{clean(d.income)}</Text></View>
            <View style={s.keyBrand}><Text style={s.keyLabel}>{p.docSaving}</Text><Text style={s.keyValue}>{clean(money(plan.saving))}</Text></View>
            <View style={s.key}><Text style={s.keyLabel}>{p.docYear}</Text><Text style={s.keyValue}>{clean(money(plan.yearly))}</Text></View>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.h2}>{p.docAllocation}</Text>
          <View style={s.bar}>
            {d.rows.map((r, i) => <View key={i} style={{ width: `${(r.pct / total) * 100}%`, backgroundColor: KIND[r.kind] }} />)}
          </View>
          <View style={s.th}>
            <Text style={{ flex: 1 }}>{p.docEnvelope}</Text>
            <Text style={s.cellPct}>{p.docShare}</Text>
            <Text style={{ width: 110, textAlign: "right" }}>{p.docAmount}</Text>
          </View>
          {d.rows.map((r, i) => (
            <View key={i} wrap={false}>
              <View style={s.row}>
                <View style={[s.dot, { backgroundColor: KIND[r.kind] }]} />
                <Text style={s.cellLabel}>{clean(r.label)}</Text>
                <Text style={s.cellPct}>{r.pct} %</Text>
                <Text style={s.cellAmount}>{clean(money(r.amount))}</Text>
              </View>
              {r.children.map((c, j) => (
                <View key={j} style={s.child}>
                  <Text style={{ flex: 1, color: C.muted }}>{clean(c.label)}</Text>
                  <Text style={[s.cellPct, { fontSize: 9 }]}>{c.pct} %</Text>
                  <Text style={{ width: 110, textAlign: "right", color: C.muted }}>{clean(money(c.amount))}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        <View style={s.section} wrap={false}>
          <Text style={s.h2}>{p.savingTitle}</Text>
          <View style={s.cards}>
            <View style={s.card}>
              <Text style={s.h3}>{p.emergencyTitle}</Text>
              <Text>{fill(p.emergencyText, { min: money(e.min), max: money(e.max) })}</Text>
              <View style={s.gauge}>
                <View style={{ height: 8, width: `${e.min > 0 ? Math.min(100, (e.have / e.min) * 100) : 100}%`, backgroundColor: C.brand }} />
              </View>
              <Text style={s.small}>{fill(p.emergencyHave, { amount: money(e.have) })}</Text>
              <Text style={{ fontWeight: 600, marginTop: 4 }}>{clean(status)}</Text>
              {e.estimated && <Text style={[s.small, { marginTop: 4 }]}>{p.emergencyEstimated}</Text>}
            </View>
            <View style={s.card}>
              <Text style={s.h3}>{p.projectionTitle}</Text>
              <View style={{ flexDirection: "row", alignItems: "flex-end", height: 96, gap: 8, marginTop: 6 }}>
                {plan.projection.map((x) => (
                  <View key={x.months} style={{ flex: 1, alignItems: "center", justifyContent: "flex-end", height: 96 }}>
                    <Text style={{ fontSize: 7.5, fontWeight: 600, marginBottom: 3 }}>{clean(money(x.total))}</Text>
                    <View style={{ width: "100%", height: Math.max(3, (x.total / top) * 64), backgroundColor: C.brand, borderTopLeftRadius: 5, borderTopRightRadius: 5 }} />
                  </View>
                ))}
              </View>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                {plan.projection.map((x) => <Text key={x.months} style={[s.small, { flex: 1, textAlign: "center" }]}>{clean(d.duration(x.months))}</Text>)}
              </View>
              <Text style={[s.small, { marginTop: 6 }]}>{p.projectionNote}</Text>
            </View>
          </View>
        </View>
        <Footer d={d} />
      </Page>

      <Page size="A4" style={s.page}>
        <View style={s.brandRow}>
          <View style={s.brand}><Logo size={20} /><Text style={[s.brandName, { fontSize: 12 }]}>soon finance</Text></View>
          <Text style={s.date}>{p.docTitle}</Text>
        </View>

        <View style={s.section}>
          <Text style={s.h2}>{p.investTitle}</Text>
          <Text style={{ color: C.muted, marginBottom: 10 }}>{p.investLead}</Text>
          <View style={s.note}><Text style={{ fontWeight: 600 }}>{step}</Text></View>
          <View style={s.cards}>
            {plan.invest.map(({ horizon, ready }) => (
              <View key={horizon} style={ready ? s.card : s.cardLocked}>
                <Text style={s.h3}>{p.horizonName[horizon]}</Text>
                <Text style={[s.small, { marginBottom: 6 }]}>{p.horizonWhen[horizon]}</Text>
                <Text style={{ fontSize: 9.5 }}>{p.horizonWhat[horizon]}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 }}>
                  <Text style={s.small}>{p.risk} : {p.riskLevel[horizon]}</Text>
                  {[1, 2, 3].map((n) => (
                    <View key={n} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: n <= RISK[horizon] ? C.gold : C.line }} />
                  ))}
                </View>
                {!ready && <Text style={{ marginTop: 6, fontSize: 9, fontWeight: 600, color: C.warning }}>{p.locked}</Text>}
              </View>
            ))}
          </View>
        </View>

        {d.tips.length > 0 && (
          <View style={s.section}>
            <Text style={s.h2}>{p.docTips}</Text>
            {d.tips.map((tip, i) => (
              <View key={i} style={s.tip} wrap={false}>
                <View style={s.bullet} />
                <Text style={{ flex: 1 }}>{clean(tip)}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={s.section} wrap={false}>
          <Text style={s.h2}>{p.docNext}</Text>
          {[p.docNext1, p.docNext2, p.docNext3].map((text, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <Text style={s.stepNum}>{i + 1}</Text>
              <Text style={{ flex: 1 }}>{text}</Text>
            </View>
          ))}
        </View>

        <Text style={s.disclaimer}>{p.docDisclaimer}</Text>
        <Footer d={d} />
      </Page>
    </Document>
  );
}

export async function buildPlanPdf(d: PdfData): Promise<Blob> {
  registerFonts();
  return pdf(<PlanDocument d={d} />).toBlob();
}
