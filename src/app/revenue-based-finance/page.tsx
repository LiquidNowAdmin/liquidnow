import type { Metadata } from "next";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import RBFCalculator from "@/components/RBFCalculator";

export const metadata: Metadata = {
  title:
    "Revenue-Based Finance: Was es kostet, wann es passt | LiqiNow Ratgeber",
  description:
    "Fundierter Ratgeber zu Revenue-Based Finance: Mechanik, Kostenrechner, Vergleich mit Kredit & Kontokorrent, ehrliche Einordnung. F\u00fcr Unternehmer, die informierte Entscheidungen treffen.",
};

export default function RevenueBasedFinancePage() {
  return (
    <>
      <Navigation />

      <main>
        {/* ═══════════════════════════════════════
            HERO
        ═══════════════════════════════════════ */}
        <section className="pt-32 pb-12 md:pt-40 md:pb-16">
          <div className="rbf-article">
            <AnimateOnScroll>
              <p className="rbf-eyebrow mb-6">
                Ratgeber &middot; Finanzierung
              </p>
            </AnimateOnScroll>

            <AnimateOnScroll delay={0.1}>
              <h1 className="rbf-headline">
                Revenue-Based Finance: Was es kostet, wann es passt &ndash; und
                wie Sie Fehler vermeiden
              </h1>
            </AnimateOnScroll>

            <AnimateOnScroll delay={0.15}>
              <p className="rbf-subtitle mt-6 max-w-2xl">
                Eine fundierte Einordnung f&uuml;r Unternehmer, die
                umsatzbasierte Finanzierung in Betracht ziehen &ndash; jenseits
                von Marketing-Versprechen.
              </p>
            </AnimateOnScroll>

            <AnimateOnScroll delay={0.2}>
              <div className="rbf-meta mt-8">
                <span>Aktualisiert Februar 2026</span>
                <span className="rbf-meta-divider" />
                <span>8 Min. Lesezeit</span>
              </div>
            </AnimateOnScroll>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            EDITORIAL INTRO
        ═══════════════════════════════════════ */}
        <section className="rbf-section">
          <div className="rbf-article rbf-prose">
            <AnimateOnScroll>
              <p>
                Umsatzbasierte Finanzierung &ndash; im englischen Sprachraum als
                Revenue-Based Finance bekannt, in der Praxis oft als{" "}
                <strong>Merchant Cash Advance</strong> oder{" "}
                <strong>Sales-Based Financing</strong> umgesetzt &ndash;
                funktioniert nach einem einfachen Prinzip: Sie erhalten sofort
                Kapital und zahlen es automatisch als festen Anteil Ihrer
                Ums&auml;tze zur&uuml;ck, bis ein vorher fixierter
                Gesamtbetrag erreicht ist.
              </p>
            </AnimateOnScroll>

            <AnimateOnScroll>
              <p>
                Das Modell unterscheidet sich grundlegend von klassischer
                Kreditfinanzierung. Statt fester monatlicher Raten und laufender
                Zinsen zahlen Sie eine <strong>einmalige, fixe Geb&uuml;hr</strong>
                . Die R&uuml;ckzahlung erfolgt umsatzproportional &ndash; bei
                hohem Umsatz schneller, bei niedrigem Umsatz langsamer. Genau
                das macht das Modell f&uuml;r bestimmte Szenarien attraktiv
                &ndash; und f&uuml;r andere riskant.
              </p>
            </AnimateOnScroll>

            <AnimateOnScroll>
              <p>
                Dieser Ratgeber ordnet Revenue-Based Finance sachlich ein: Wie
                die Mechanik funktioniert, was es tats&auml;chlich kostet, wann
                es passt &ndash; und wann Sie besser die Finger davon lassen.
              </p>
            </AnimateOnScroll>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            WIE DIE MECHANIK FUNKTIONIERT
        ═══════════════════════════════════════ */}
        <section className="rbf-section rbf-warm-bg">
          <div className="rbf-article">
            <AnimateOnScroll>
              <h2 className="rbf-h2">Wie die Mechanik funktioniert</h2>
            </AnimateOnScroll>

            <div className="rbf-prose">
              <AnimateOnScroll>
                <p>
                  Der Ablauf ist bewusst einfach gehalten: Ein Anbieter
                  pr&uuml;ft Ihre Umsatzdaten &ndash; oft automatisiert
                  &uuml;ber Open-Banking-Schnittstellen oder direkt aus
                  Plattform-/POS-Systemen. Auf Basis Ihrer Umsatzhistorie und
                  Performance wird ein Finanzierungsangebot erstellt.
                </p>
              </AnimateOnScroll>

              <AnimateOnScroll>
                <p>
                  Stimmen Sie zu, erhalten Sie den vereinbarten Betrag
                  ausgezahlt &ndash; typischerweise innerhalb von 24 bis
                  48&nbsp;Stunden. Ab diesem Zeitpunkt flie&szlig;t ein
                  festgelegter Prozentsatz Ihres Umsatzes automatisch an den
                  Anbieter zur&uuml;ck. Dieser sogenannte{" "}
                  <strong>Holdback</strong> (oft zwischen 5 und 20&nbsp;%) wird
                  t&auml;glich, w&ouml;chentlich oder transaktionsbasiert
                  eingezogen &ndash; je nach Anbieter und Modell.
                </p>
              </AnimateOnScroll>

              <AnimateOnScroll>
                <p>
                  Die R&uuml;ckzahlung endet, sobald der Gesamtbetrag
                  &ndash; also Auszahlung plus fixe Geb&uuml;hr &ndash;
                  vollst&auml;ndig getilgt ist. Es gibt keinen laufenden
                  Zins. Die Gesamtkosten stehen von Anfang an fest.
                </p>
              </AnimateOnScroll>
            </div>

            <AnimateOnScroll>
              <div className="rbf-pullquote">
                Der entscheidende Unterschied: Bei hohem Umsatz zahlen Sie
                schneller zur&uuml;ck. Bei niedrigem Umsatz sinkt die
                R&uuml;ckzahlung automatisch &ndash; die Rate passt sich Ihrem
                Gesch&auml;ft an, nicht umgekehrt.
              </div>
            </AnimateOnScroll>

            <div className="rbf-prose">
              <AnimateOnScroll>
                <p>
                  Wichtig: &bdquo;Kein Zins&ldquo; hei&szlig;t nicht
                  &bdquo;billig&ldquo;. Die fixe Geb&uuml;hr bleibt konstant,
                  unabh&auml;ngig davon, wie schnell Sie zur&uuml;ckzahlen.
                  Wer schnell tilgt, zahlt effektiv einen h&ouml;heren
                  Jahreszins. Wer langsam tilgt, einen niedrigeren &ndash;
                  aber &uuml;ber l&auml;ngere Zeit.
                </p>
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            WAS ES WIRKLICH KOSTET
        ═══════════════════════════════════════ */}
        <section className="rbf-section">
          <div className="rbf-article">
            <AnimateOnScroll>
              <h2 className="rbf-h2">Was es wirklich kostet</h2>
            </AnimateOnScroll>

            <div className="rbf-prose">
              <AnimateOnScroll>
                <p>
                  Die Kostenstruktur von Revenue-Based Finance ist auf den
                  ersten Blick einfach: Eine fixe Geb&uuml;hr von
                  beispielsweise 8&nbsp;% auf den Auszahlungsbetrag. Bei
                  50.000&nbsp;&euro; Auszahlung betr&auml;gt die
                  Gesamtr&uuml;ckzahlung also 54.000&nbsp;&euro;.
                </p>
              </AnimateOnScroll>

              <AnimateOnScroll>
                <p>
                  Entscheidend ist jedoch, was diese 8&nbsp;% in effektiven
                  Jahreskosten bedeuten &ndash; und das h&auml;ngt vollst&auml;ndig
                  davon ab, <strong>wie schnell Sie zur&uuml;ckzahlen</strong>.
                  Die beiden Kennzahlen, die Sie kennen m&uuml;ssen:
                </p>
              </AnimateOnScroll>

              <AnimateOnScroll>
                <ul className="list-none space-y-3 my-6">
                  <li className="flex gap-3">
                    <span className="font-heading font-600 text-dark shrink-0">1.</span>
                    <span>
                      <strong>Payback-Multiple</strong> = R&uuml;ckzahlungsbetrag
                      &divide; Auszahlung (z.&nbsp;B. 1,08&times;). Sagt Ihnen
                      auf einen Blick, wie viel Sie insgesamt f&uuml;r jeden
                      geliehenen Euro zur&uuml;ckzahlen.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-heading font-600 text-dark shrink-0">2.</span>
                    <span>
                      <strong>Implizite APR</strong> (effektive Jahreskosten)
                      &ndash; ber&uuml;cksichtigt, dass die R&uuml;ckzahlung
                      &uuml;ber Monate verteilt erfolgt und Sie das Kapital
                      nicht &uuml;ber die gesamte Laufzeit nutzen.
                    </span>
                  </li>
                </ul>
              </AnimateOnScroll>

              <AnimateOnScroll>
                <p>
                  Der folgende Rechner zeigt den Zusammenhang konkret. Bewegen
                  Sie die Regler und beobachten Sie, wie sich
                  R&uuml;ckzahlungsdauer und effektive Kosten ver&auml;ndern:
                </p>
              </AnimateOnScroll>
            </div>
          </div>

          {/* Calculator - slightly wider */}
          <div className="rbf-article-wide mt-8">
            <AnimateOnScroll>
              <div className="rbf-callout">
                <RBFCalculator />
              </div>
            </AnimateOnScroll>
          </div>

          <div className="rbf-article rbf-prose mt-8">
            <AnimateOnScroll>
              <p>
                Die Rechnung verdeutlicht ein Paradox: Unternehmen mit
                h&ouml;herem Umsatz zahlen schneller zur&uuml;ck &ndash;
                haben aber effektiv h&ouml;here Jahreskosten, weil die
                Geb&uuml;hr fix bleibt. Bei 80.000&nbsp;&euro; Monatsumsatz
                und 50.000&nbsp;&euro; Auszahlung liegt die implizite APR bei
                rund 27&nbsp;%. Bei 20.000&nbsp;&euro; Monatsumsatz sinkt sie
                auf etwa 7&nbsp;%.
              </p>
            </AnimateOnScroll>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            ABGRENZUNG
        ═══════════════════════════════════════ */}
        <section className="rbf-section rbf-warm-bg">
          <div className="rbf-article">
            <AnimateOnScroll>
              <h2 className="rbf-h2">
                Abgrenzung: RBF im Vergleich zu klassischen Alternativen
              </h2>
            </AnimateOnScroll>

            <div className="rbf-prose">
              <AnimateOnScroll>
                <p>
                  Revenue-Based Finance ist kein Ersatz f&uuml;r alle anderen
                  Finanzierungsformen &ndash; es ist ein zus&auml;tzliches
                  Instrument mit spezifischen St&auml;rken und
                  Schw&auml;chen. Die folgende &Uuml;bersicht ordnet ein:
                </p>
              </AnimateOnScroll>
            </div>

            <AnimateOnScroll>
              <div className="overflow-x-auto mt-6 -mx-4 px-4 md:mx-0 md:px-0">
                <table className="rbf-table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>RBF / MCA</th>
                      <th>Betriebsmittelkredit</th>
                      <th>Kontokorrent</th>
                      <th>Kreditkarte</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>R&uuml;ckzahlung</td>
                      <td>% vom Umsatz</td>
                      <td>Feste Raten</td>
                      <td>Flexibel</td>
                      <td>Monatlich / Revolving</td>
                    </tr>
                    <tr>
                      <td>Kosten</td>
                      <td>Fixe Geb&uuml;hr</td>
                      <td>Zins p.&nbsp;a.</td>
                      <td>Zins auf Nutzung</td>
                      <td>Zins auf Saldo</td>
                    </tr>
                    <tr>
                      <td>Geschwindigkeit</td>
                      <td>24&ndash;48&nbsp;h</td>
                      <td>2&ndash;6 Wochen</td>
                      <td>1&ndash;2 Wochen</td>
                      <td>Sofort</td>
                    </tr>
                    <tr>
                      <td>Sicherheiten</td>
                      <td>Umsatzdaten</td>
                      <td>Oft erforderlich</td>
                      <td>Bonit&auml;t</td>
                      <td>Bonit&auml;t</td>
                    </tr>
                    <tr>
                      <td>Ideal f&uuml;r</td>
                      <td>Kurzfristige Peaks, Scaling</td>
                      <td>Langfristige Investitionen</td>
                      <td>Laufende Liquidit&auml;t</td>
                      <td>Kleine Ausgaben</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </AnimateOnScroll>

            <div className="rbf-prose mt-8">
              <AnimateOnScroll>
                <p>
                  Beim <strong>klassischen Betriebsmittelkredit</strong> zahlen
                  Sie Zins und Tilgung nach Plan &ndash; unabh&auml;ngig davon,
                  ob Ihr Umsatz gerade hoch oder niedrig ist. Das gibt
                  Planungssicherheit, setzt aber eine stabile Ertragslage voraus.
                </p>
              </AnimateOnScroll>

              <AnimateOnScroll>
                <p>
                  Der <strong>Kontokorrentkredit</strong> ist eine flexible
                  Kreditlinie auf dem Gesch&auml;ftskonto: Zinsen fallen nur auf
                  den tats&auml;chlich genutzten Betrag und Zeitraum an. Sie
                  k&ouml;nnen jederzeit zur&uuml;ckf&uuml;hren &ndash; kein
                  umsatzabh&auml;ngiger Einzug. Daf&uuml;r sind die Zinss&auml;tze
                  oft h&ouml;her als bei Laufzeitkrediten.
                </p>
              </AnimateOnScroll>

              <AnimateOnScroll>
                <p>
                  Bei der <strong>Gesch&auml;fts-Kreditkarte</strong> wird bei
                  Charge-Modellen monatlich voll abgebucht; bei Revolving
                  k&ouml;nnen Sie st&uuml;ckeln, zahlen daf&uuml;r Zinsen auf
                  den offenen Saldo. F&uuml;r gr&ouml;&szlig;ere
                  Finanzierungsbetr&auml;ge ist sie nicht geeignet.
                </p>
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            WANN ES PASST
        ═══════════════════════════════════════ */}
        <section className="rbf-section">
          <div className="rbf-article">
            <AnimateOnScroll>
              <h2 className="rbf-h2">Wann Revenue-Based Finance passt</h2>
            </AnimateOnScroll>

            <div className="rbf-prose">
              <AnimateOnScroll>
                <p>
                  Revenue-Based Finance entfaltet seinen Wert in Szenarien, in
                  denen klassische Banklogik schlecht greift: Wenn der
                  Kapitalbedarf kurzfristig und zweckgebunden ist, der Cashflow
                  schwankt, und traditionelle Sicherheiten fehlen.
                </p>
              </AnimateOnScroll>

              <AnimateOnScroll>
                <p>
                  <strong>
                    Kurzfristige Peaks im Kapitalbedarf
                  </strong>{" "}
                  sind der Kern-Use-Case: Lagereinkauf f&uuml;r die Saison,
                  Marketing-Scaling bei profitablen Kampagnen, Vorfinanzierung
                  von Warenlieferungen. Wenn der investierte Euro nachweislich
                  mehr zur&uuml;ckbringt als die Finanzierung kostet, ist das
                  Modell sinnvoll.
                </p>
              </AnimateOnScroll>

              <AnimateOnScroll>
                <p>
                  <strong>
                    Stark schwankende Ums&auml;tze
                  </strong>{" "}
                  sind ein zweites starkes Argument: W&auml;hrend feste Raten
                  in schwachen Monaten zur Belastung werden, passt sich der
                  Umsatzanteil automatisch an. H&ouml;herer Umsatz =
                  h&ouml;here R&uuml;ckzahlung. Niedriger Umsatz = niedrigere
                  Rate. Das reduziert das Risiko eines Cashflow-Engpasses.
                </p>
              </AnimateOnScroll>

              <AnimateOnScroll>
                <p>
                  <strong>Datengetriebene Entscheidungslogik</strong> statt
                  Sicherheiten-Story: Anbieter bewerten Ihre
                  Umsatz-Performance und Verkaufshistorie, nicht Ihre
                  Bilanzstruktur oder Immobilien. F&uuml;r junge oder
                  asset-light Unternehmen kann das den Unterschied machen.
                </p>
              </AnimateOnScroll>

              <AnimateOnScroll>
                <p>
                  <strong>Embedded Finance</strong> als Sonderfall: Viele
                  Anbieter integrieren sich direkt in Plattformen und
                  Payment-Systeme (Shopify, Amazon, Stripe). Die Finanzierung
                  wird Teil des bestehenden Workflows &ndash; wenig
                  Prozessaufwand, schnelle Verf&uuml;gbarkeit.
                </p>
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            WANN ES NICHT PASST
        ═══════════════════════════════════════ */}
        <section className="rbf-section rbf-warm-bg">
          <div className="rbf-article">
            <AnimateOnScroll>
              <h2 className="rbf-h2">Wann Sie die Finger davon lassen sollten</h2>
            </AnimateOnScroll>

            <div className="rbf-prose">
              <AnimateOnScroll>
                <p>
                  Revenue-Based Finance ist kein Universalmittel &ndash; und in
                  bestimmten Konstellationen kann es die Lage
                  verschl&auml;rfen statt zu verbessern.
                </p>
              </AnimateOnScroll>

              <AnimateOnScroll>
                <p>
                  <strong>
                    Strukturelle Verluste oder negative Unit Economics
                  </strong>{" "}
                  sind das gr&ouml;&szlig;te Risiko. Wenn Ihr
                  Gesch&auml;ftsmodell grundlegend mehr ausgibt als es
                  einnimmt, l&ouml;st zus&auml;tzliches Kapital das Problem
                  nicht &ndash; die fixe Geb&uuml;hr plus der laufende
                  Umsatzabzug verschl&auml;rfen die Situation.
                </p>
              </AnimateOnScroll>

              <AnimateOnScroll>
                <p>
                  <strong>Sehr niedrige Margen</strong> sind ein verwandtes
                  Problem: Wenn der vereinbarte Umsatzanteil die
                  Bruttomarge nahezu auffrisst, entsteht operativer Stress.
                  Die R&uuml;ckzahlung l&auml;uft pro Verkauf weiter &ndash;
                  unabh&auml;ngig davon, ob der einzelne Verkauf profitabel
                  ist.
                </p>
              </AnimateOnScroll>

              <AnimateOnScroll>
                <p>
                  <strong>Lange Cash-Conversion-Cycles</strong> (beispielsweise
                  Projektgesch&auml;ft mit sp&auml;tem Zahlungseingang)
                  passen schlecht: Der Holdback wird auf Basis laufender
                  Ums&auml;tze eingezogen, auch wenn die zugeh&ouml;rigen
                  Einnahmen erst Monate sp&auml;ter flie&szlig;en.
                </p>
              </AnimateOnScroll>

              <AnimateOnScroll>
                <p>
                  <strong>
                    Gro&szlig;e, langfristige Capex-Investitionen
                  </strong>{" "}
                  &ndash; Maschinen, Umbauten, IT-Infrastruktur &ndash; sind
                  mit einem g&uuml;nstigeren Laufzeitkredit fast immer besser
                  bedient. Revenue-Based Finance ist f&uuml;r kurzfristigen
                  Working-Capital-Bedarf konzipiert, nicht f&uuml;r
                  mehrj&auml;hrige Abschreibungszeitr&auml;ume.
                </p>
              </AnimateOnScroll>

              <AnimateOnScroll>
                <p>
                  <strong>Stacking</strong> &ndash; das gleichzeitige Laufen
                  mehrerer Umsatzfinanzierungen &ndash; ist ein h&auml;ufig
                  untersch&auml;tztes Risiko: Jeder zus&auml;tzliche
                  Holdback reduziert den verf&uuml;gbaren Cashflow weiter.
                  In der MCA-Branche ist Stacking einer der
                  Hauptausfallgr&uuml;nde.
                </p>
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            KOSTEN SENKEN
        ═══════════════════════════════════════ */}
        <section className="rbf-section">
          <div className="rbf-article">
            <AnimateOnScroll>
              <h2 className="rbf-h2">
                F&uuml;nf Hebel, um die Kosten zu optimieren
              </h2>
            </AnimateOnScroll>

            <div className="rbf-prose">
              <AnimateOnScroll>
                <p>
                  Wer Revenue-Based Finance nutzt, sollte die Kosten bewusst
                  steuern. Die folgenden f&uuml;nf Punkte sind keine Theorie
                  &ndash; sie sind die Hebel, die in der Praxis den
                  Unterschied machen.
                </p>
              </AnimateOnScroll>
            </div>

            <div className="mt-8 space-y-8">
              <AnimateOnScroll>
                <div className="rbf-numbered-item">
                  <span className="rbf-number">01</span>
                  <div className="rbf-prose">
                    <p>
                      <strong>
                        Payback-Multiple und implizite APR berechnen, nicht die
                        Fee allein.
                      </strong>{" "}
                      8&nbsp;% Geb&uuml;hr klingt wenig &ndash; aber bei einer
                      R&uuml;ckzahlung in sieben Monaten entspricht das einer
                      effektiven APR von rund 27&nbsp;%. Die Fee-Prozentzahl
                      allein ist nicht aussagekr&auml;ftig.
                    </p>
                  </div>
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll>
                <div className="rbf-numbered-item">
                  <span className="rbf-number">02</span>
                  <div className="rbf-prose">
                    <p>
                      <strong>Angebote vergleichbar machen.</strong> Gleiche
                      Auszahlung, gleiche erwartete R&uuml;ckzahlungsdauer,
                      gleiche Revenue-Runrate &ndash; erst dann sind Angebote
                      verschiedener Anbieter wirklich vergleichbar.
                    </p>
                  </div>
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll>
                <div className="rbf-numbered-item">
                  <span className="rbf-number">03</span>
                  <div className="rbf-prose">
                    <p>
                      <strong>Early-Repayment-Logik pr&uuml;fen.</strong> Bei
                      vielen Modellen gibt es keinen Preisvorteil bei schneller
                      R&uuml;ckzahlung &ndash; die Kosten bleiben fix.
                      Schneller zur&uuml;ckzahlen hei&szlig;t dann: gleiche
                      Geb&uuml;hr, k&uuml;rzere Nutzungsdauer, h&ouml;here
                      effektive Kosten.
                    </p>
                  </div>
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll>
                <div className="rbf-numbered-item">
                  <span className="rbf-number">04</span>
                  <div className="rbf-prose">
                    <p>
                      <strong>
                        Holdback-Rate so w&auml;hlen, dass Sie operativ nicht
                        aushungern.
                      </strong>{" "}
                      Der Umsatzanteil muss nach Abzug von Fixkosten,
                      Wareneinsatz und einem angemessenen Cash-Puffer tragbar
                      sein. Ein zu hoher Holdback f&uuml;hrt in die
                      Cashflow-Falle.
                    </p>
                  </div>
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll>
                <div className="rbf-numbered-item">
                  <span className="rbf-number">05</span>
                  <div className="rbf-prose">
                    <p>
                      <strong>
                        Nur dort einsetzen, wo der Euro mehr zur&uuml;ckkommt
                        als er kostet.
                      </strong>{" "}
                      Marketing mit stabiler CAC-zu-LTV-Logik, Inventory mit
                      sicherem Abverkauf, saisonale Vorfinanzierung mit
                      kalkulierbarem Ertrag. Revenue-Based Finance ist ein
                      Wachstums-Tool &ndash; kein Rettungsring.
                    </p>
                  </div>
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            TRANSPARENZ-HINWEISE
        ═══════════════════════════════════════ */}
        <section className="rbf-section rbf-warm-bg">
          <div className="rbf-article">
            <AnimateOnScroll>
              <h2 className="rbf-h2">Was Sie au&szlig;erdem wissen sollten</h2>
            </AnimateOnScroll>

            <div className="rbf-prose">
              <AnimateOnScroll>
                <p>
                  <strong>Datenzugriff und laufendes Monitoring</strong> sind
                  Teil des Modells. Anbieter greifen &uuml;ber
                  Open-Banking-Schnittstellen oder direkte
                  Plattform-Integrationen auf Ihre Umsatzdaten zu &ndash;
                  nicht nur einmalig zur Pr&uuml;fung, sondern oft laufend
                  w&auml;hrend der gesamten R&uuml;ckzahlungsphase. Das ist
                  der Preis f&uuml;r die unkomplizierte Vergabe.
                </p>
              </AnimateOnScroll>

              <AnimateOnScroll>
                <p>
                  <strong>
                    Die R&uuml;ckzahlungsmechanik variiert zwischen
                    Anbietern
                  </strong>
                  . Einige ziehen t&auml;glich ein, andere w&ouml;chentlich,
                  manche als festen Prozentsatz pro Transaktion. Pr&uuml;fen
                  Sie die Details &ndash; der Rhythmus beeinflusst Ihre
                  Liquidit&auml;tsplanung.
                </p>
              </AnimateOnScroll>

              <AnimateOnScroll>
                <p>
                  <strong>Das Risiko eines Cashflow-Squeeze</strong> bei
                  Umsatzr&uuml;ckgang ist real: Auch wenn die absolute
                  R&uuml;ckzahlungsh&ouml;he sinkt, l&auml;uft der Abzug
                  pro Verkauf weiter. Die fixe Gesamtr&uuml;ckzahlung bleibt
                  bestehen &ndash; sie verteilt sich nur &uuml;ber einen
                  l&auml;ngeren Zeitraum.
                </p>
              </AnimateOnScroll>

              <AnimateOnScroll>
                <p>
                  <strong>
                    Pers&ouml;nliche Garantien
                  </strong>{" "}
                  werden von manchen Anbietern verlangt. Informieren Sie sich
                  vor Vertragsschluss, ob und in welchem Umfang Sie
                  pers&ouml;nlich haften.
                </p>
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            CTA
        ═══════════════════════════════════════ */}
        <section className="rbf-section">
          <div className="rbf-article text-center">
            <AnimateOnScroll>
              <hr className="rbf-divider" />
              <h2 className="rbf-h2">
                Angebote vergleichen &ndash; kostenlos und unverbindlich
              </h2>
              <p className="rbf-prose max-w-lg mx-auto">
                &Uuml;ber LiqiNow k&ouml;nnen Sie Revenue-Based Finance
                Angebote f&uuml;hrender Anbieter vergleichen &ndash; mit einem
                Antrag, in wenigen Minuten, ohne Kosten und ohne
                SCHUFA-Auswirkung.
              </p>
              <div className="mt-8">
                <a href="/antrag/kreditart" className="btn btn-primary btn-lg">
                  Jetzt Angebote vergleichen &rarr;
                </a>
              </div>
              <p className="text-xs text-subtle mt-4">
                100&nbsp;% kostenlos &middot; Unverbindlich &middot; Keine
                SCHUFA-Auswirkung
              </p>
            </AnimateOnScroll>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
