import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Footer from "@/components/Footer";
import Logo from "@/components/Logo";

export const metadata = {
  title: "Allgemeine Geschäftsbedingungen – LiQiNow",
  description: "AGB der LiQiNow Plattform der Deutschen Einkaufsfinanzierer GmbH",
};

export default function AGBPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#F5DEB3]/10 to-white">
      <header className="shadow-sm bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-subtle hover:text-dark transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Zurück</span>
            </Link>
            <a href="/plattform"><Logo size="md" /></a>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="card p-8 sm:p-12">
              <h1 className="text-3xl font-bold text-dark mb-2">Allgemeine Geschäftsbedingungen</h1>
              <p className="text-sm text-subtle mb-8">Stand: April 2026 (überarbeitet)</p>

              <div className="space-y-8 text-dark text-[0.9375rem] leading-relaxed">

                {/* 1. Geltungsbereich */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">§ 1 Geltungsbereich</h2>
                  <p>
                    (1) Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung der Plattform LiQiNow (erreichbar unter www.liqinow.de), betrieben von der Deutschen Einkaufsfinanzierer GmbH, ABC-Straße 35, 20354 Hamburg (nachfolgend „Betreiber").
                  </p>
                  <p className="mt-2">
                    (2) LiQiNow ist ein digitaler Marktplatz, der gewerblichen Nutzern den Vergleich und die Anfrage von Working-Capital-Finanzierungslösungen bei Drittanbietern (Banken und Fintechs) ermöglicht.
                  </p>
                  <p className="mt-2">
                    (3) Die Plattform richtet sich ausschließlich an Unternehmer im Sinne von § 14 BGB. Die Nutzung durch Verbraucher im Sinne von § 13 BGB ist nicht vorgesehen.
                  </p>
                  <p className="mt-2">
                    (4) Abweichende oder entgegenstehende Bedingungen des Nutzers werden nicht anerkannt, es sei denn, der Betreiber stimmt ihrer Geltung ausdrücklich zu. Diese AGB gelten für alle gegenwärtigen und zukünftigen Geschäftsbeziehungen zwischen dem Nutzer und dem Betreiber.
                  </p>
                </section>

                {/* 2. Leistungsbeschreibung */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">§ 2 Leistungsbeschreibung</h2>
                  <p>
                    (1) Der Betreiber stellt eine Plattform zur Verfügung, auf der gewerbliche Nutzer Finanzierungsangebote verschiedener Anbieter vergleichen und Anfragen an diese Anbieter übermitteln können.
                  </p>
                  <p className="mt-2">
                    (2) Der Betreiber erbringt einen Tippgeber-Service. Er leitet Kontaktdaten und Anfragedaten des Nutzers an Finanzierungspartner weiter. Der Betreiber vermittelt keine Kredite im Sinne des § 34c GewO, gibt keine Empfehlungen für bestimmte Finanzierungsprodukte ab und erbringt keine Finanz- oder Anlageberatung. Die auf der Plattform dargestellten Konditionen beruhen auf den Angaben der Finanzierungspartner; der Betreiber nimmt keine eigene Bewertung oder Rangfolge vor. Die Kreditentscheidung liegt ausschließlich bei den jeweiligen Finanzierungspartnern.
                  </p>
                  <p className="mt-2">
                    (3) Der Betreiber übernimmt keine Gewähr für die Verfügbarkeit, Konditionen oder Zusage von Finanzierungsangeboten der auf der Plattform gelisteten Anbieter.
                  </p>
                  <p className="mt-2">
                    (4) Die Nutzung der Plattform ist für den Nutzer kostenlos. Der Betreiber finanziert sich über Provisionen der Finanzierungspartner.
                  </p>
                </section>

                {/* 3. Registrierung */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">§ 3 Registrierung und Nutzerkonto</h2>
                  <p>
                    (1) Für die Nutzung der Plattform ist die Erstellung eines Nutzerkontos erforderlich. Die Registrierung erfolgt über Google OAuth oder einen E-Mail-Login-Link.
                  </p>
                  <p className="mt-2">
                    (2) Der Nutzer ist verpflichtet, bei der Registrierung und bei Finanzierungsanfragen wahrheitsgemäße und vollständige Angaben zu machen.
                  </p>
                  <p className="mt-2">
                    (3) Der Nutzer ist für die Sicherheit seines Nutzerkontos verantwortlich und hat den Betreiber unverzüglich über eine unbefugte Nutzung zu informieren.
                  </p>
                  <p className="mt-2">
                    (4) Der Betreiber behält sich das Recht vor, Nutzerkonten bei Verstößen gegen diese AGB oder bei Verdacht auf missbräuchliche Nutzung zu sperren oder zu löschen.
                  </p>
                </section>

                {/* 4. Finanzierungsanfragen */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">§ 4 Finanzierungsanfragen</h2>
                  <p>
                    (1) Mit der Übermittlung einer Finanzierungsanfrage über die Plattform stimmt der Nutzer zu, dass der Betreiber seine Antragsdaten an den ausgewählten Finanzierungspartner weiterleitet.
                  </p>
                  <p className="mt-2">
                    (2) Die Finanzierungsanfrage stellt kein bindendes Angebot des Nutzers dar. Ein Finanzierungsvertrag kommt ausschließlich zwischen dem Nutzer und dem jeweiligen Finanzierungspartner zustande.
                  </p>
                  <p className="mt-2">
                    (3) Der Betreiber ist nicht Vertragspartei des Finanzierungsvertrages und haftet nicht für dessen Zustandekommen oder Erfüllung.
                  </p>
                </section>

                {/* 5. Pflichten des Nutzers */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">§ 5 Pflichten des Nutzers</h2>
                  <p>Der Nutzer verpflichtet sich:</p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>die Plattform nur für gewerbliche Zwecke zu nutzen;</li>
                    <li>ausschließlich wahrheitsgemäße und vollständige Angaben zu machen;</li>
                    <li>keine Anfragen im Namen Dritter ohne deren Bevollmächtigung zu stellen;</li>
                    <li>die Plattform nicht missbräuchlich zu nutzen, insbesondere keine automatisierten Abfragen durchzuführen;</li>
                    <li>die geltenden gesetzlichen Vorschriften einzuhalten.</li>
                  </ul>
                </section>

                {/* 6. Datenweitergabe */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">§ 6 Datenweitergabe an Finanzierungspartner</h2>
                  <p>
                    (1) Die Weiterleitung der Antragsdaten an den ausgewählten Finanzierungspartner erfolgt auf Grundlage der Durchführung vorvertraglicher Maßnahmen (Art. 6 Abs. 1 lit. b DSGVO). Vor der Übermittlung wird der Nutzer im Antragsprozess gesondert über die Datenweitergabe informiert und erteilt hierzu eine separate, ausdrückliche Einwilligung (Art. 6 Abs. 1 lit. a DSGVO).
                  </p>
                  <p className="mt-2">
                    (2) Die Datenverarbeitung durch den Finanzierungspartner richtet sich nach dessen eigenen Datenschutzbestimmungen. Der Betreiber informiert den Nutzer vor der Übermittlung über den jeweiligen Empfänger.
                  </p>
                  <p className="mt-2">
                    (3) Der Betreiber verarbeitet personenbezogene Daten gemäß seiner Datenschutzerklärung, abrufbar unter{" "}
                    <Link href="/datenschutz" className="text-turquoise hover:underline">www.liqinow.de/datenschutz</Link>.
                  </p>
                </section>

                {/* 7. Haftung */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">§ 7 Haftung</h2>
                  <p>
                    (1) Die Haftung des Betreibers auf Schadensersatz, gleich aus welchem Rechtsgrund, ist, soweit es dabei jeweils auf ein Verschulden ankommt, nach Maßgabe dieses § 7 beschränkt.
                  </p>
                  <p className="mt-2">
                    (2) Der Betreiber haftet nicht im Falle einfacher Fahrlässigkeit seiner Organe, gesetzlichen Vertreter, Angestellten oder sonstigen Erfüllungsgehilfen, soweit es sich nicht um eine Verletzung vertragswesentlicher Pflichten handelt. Vertragswesentlich sind solche Pflichten, deren Erfüllung die ordnungsgemäße Durchführung des Vertrags überhaupt erst ermöglicht und auf deren Einhaltung der Vertragspartner regelmäßig vertrauen darf.
                  </p>
                  <p className="mt-2">
                    (3) Soweit der Betreiber gem. Abs. 2 dem Grunde nach auf Schadensersatz haftet, ist diese Haftung auf Schäden begrenzt, die der Betreiber bei Vertragsschluss als mögliche Folge einer Vertragsverletzung vorausgesehen hat oder die er bei Anwendung verkehrsüblicher Sorgfalt hätte voraussehen müssen. Die vorstehenden Regelungen dieses Abs. 3 gelten nicht im Fall vorsätzlichen oder grob fahrlässigen Verhaltens von Organmitgliedern oder leitenden Angestellten des Betreibers.
                  </p>
                  <p className="mt-2">
                    (4) Die vorstehenden Haftungsausschlüsse und -beschränkungen gelten in gleichem Umfang zugunsten der Organe, gesetzlichen Vertreter, Angestellten und sonstigen Erfüllungsgehilfen des Betreibers.
                  </p>
                  <p className="mt-2">
                    (5) Soweit die auf der Plattform dargestellten Informationen von den Finanzierungspartnern stammen, haftet der Betreiber nicht für deren Richtigkeit, Vollständigkeit oder Aktualität. Dies gilt nicht für Informationen, die der Betreiber selbst erstellt oder deren Richtigkeit er ausdrücklich bestätigt hat.
                  </p>
                  <p className="mt-2">
                    (6) Der Betreiber haftet nicht für Handlungen oder Unterlassungen der Finanzierungspartner, insbesondere nicht für deren Kreditentscheidungen oder die Erfüllung der zwischen dem Nutzer und dem Finanzierungspartner geschlossenen Verträge.
                  </p>
                  <p className="mt-2">
                    (7) Die Einschränkungen dieses § 7 gelten nicht für die Haftung des Betreibers wegen vorsätzlichen Verhaltens, für garantierte Beschaffenheitsmerkmale, wegen Verletzung des Lebens, des Körpers oder der Gesundheit oder nach dem Produkthaftungsgesetz.
                  </p>
                </section>

                {/* 8. Verfügbarkeit */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">§ 8 Verfügbarkeit der Plattform</h2>
                  <p>
                    (1) Der Betreiber bemüht sich um eine möglichst unterbrechungsfreie Verfügbarkeit der Plattform, übernimmt jedoch keine Garantie hierfür.
                  </p>
                  <p className="mt-2">
                    (2) Der Betreiber ist berechtigt, die Plattform jederzeit ganz oder teilweise zu ändern, zu erweitern oder einzustellen.
                  </p>
                  <p className="mt-2">
                    (3) Der Betreiber haftet nicht für Unterbrechungen oder Einschränkungen der Plattform, die auf Umstände zurückzuführen sind, die außerhalb seiner zumutbaren Kontrolle liegen (höhere Gewalt). Hierzu zählen insbesondere Naturkatastrophen, behördliche Anordnungen, Störungen der Telekommunikationsnetze, Cyberangriffe, Pandemien sowie Ausfälle von Drittanbietern (Hosting, Datenbank, Authentifizierungsdienste). Der Betreiber wird den Nutzer über wesentliche Einschränkungen unverzüglich informieren und sich um eine schnellstmögliche Wiederherstellung bemühen.
                  </p>
                </section>

                {/* 9. Geistiges Eigentum */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">§ 9 Geistiges Eigentum</h2>
                  <p>
                    Alle Inhalte der Plattform (Texte, Grafiken, Logos, Software) sind urheberrechtlich geschützt. Die Nutzung über den bestimmungsgemäßen Gebrauch der Plattform hinaus bedarf der vorherigen schriftlichen Zustimmung des Betreibers.
                  </p>
                </section>

                {/* 10. Laufzeit und Kündigung */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">§ 10 Laufzeit und Kündigung</h2>
                  <p>
                    (1) Das Nutzungsverhältnis wird auf unbestimmte Zeit geschlossen und beginnt mit der Registrierung auf der Plattform.
                  </p>
                  <p className="mt-2">
                    (2) Der Nutzer kann sein Nutzerkonto jederzeit ohne Angabe von Gründen kündigen. Die Kündigung erfolgt per E-Mail an <a href="mailto:info@liqinow.de" className="text-turquoise hover:underline">info@liqinow.de</a> oder über die Kontoeinstellungen der Plattform. Mit Wirksamkeit der Kündigung werden die personenbezogenen Daten des Nutzers gelöscht, soweit keine gesetzlichen oder vertraglichen Aufbewahrungspflichten (insbesondere steuer- und handelsrechtliche Aufbewahrungsfristen) entgegenstehen. Nach Ablauf dieser Fristen werden die Daten unverzüglich gelöscht.
                  </p>
                  <p className="mt-2">
                    (3) Der Betreiber kann das Nutzungsverhältnis mit einer Frist von zwei Wochen per E-Mail kündigen.
                  </p>
                  <p className="mt-2">
                    (4) Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt für beide Parteien unberührt. Ein wichtiger Grund liegt für den Betreiber insbesondere vor, wenn der Nutzer gegen wesentliche Bestimmungen dieser AGB verstößt.
                  </p>
                  <p className="mt-2">
                    (5) Bereits übermittelte Finanzierungsanfragen bleiben von der Kündigung unberührt und werden von den Finanzierungspartnern nach deren eigenen Bedingungen weiterbearbeitet.
                  </p>
                </section>

                {/* 11. Änderungen der AGB */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">§ 11 Änderungen der AGB</h2>
                  <p>
                    (1) Der Betreiber behält sich das Recht vor, diese AGB mit Wirkung für die Zukunft zu ändern, sofern die Änderung aufgrund von Gesetzesänderungen, geänderter Rechtsprechung, der Aufnahme neuer Finanzierungspartner oder technischen Änderungen der Plattform erforderlich wird.
                  </p>
                  <p className="mt-2">
                    (2) Der Betreiber wird den Nutzer über Änderungen mindestens zwei Wochen vor dem geplanten Inkrafttreten per E-Mail an die im Nutzerkonto hinterlegte Adresse informieren. Die Änderungen werden im Wortlaut mitgeteilt.
                  </p>
                  <p className="mt-2">
                    (3) Der Nutzer kann den Änderungen innerhalb von vier (4) Wochen nach Zugang der Mitteilung widersprechen. Widerspricht der Nutzer nicht innerhalb der Frist, gelten die geänderten AGB als angenommen. Der Betreiber wird den Nutzer in der Änderungsmitteilung auf die Widerspruchsmöglichkeit, die Frist und die Folgen des Schweigens gesondert hinweisen.
                  </p>
                  <p className="mt-2">
                    (4) Im Falle eines Widerspruchs steht beiden Parteien ein außerordentliches Kündigungsrecht zu. Bis zur Wirksamkeit der Kündigung gelten die bisherigen AGB fort.
                  </p>
                </section>

                {/* 12. Schlussbestimmungen */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">§ 12 Schlussbestimmungen</h2>
                  <p>
                    (1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.
                  </p>
                  <p className="mt-2">
                    (2) Gerichtsstand für alle Streitigkeiten aus oder im Zusammenhang mit diesen AGB ist Hamburg, sofern der Nutzer Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen ist.
                  </p>
                  <p className="mt-2">
                    (3) Bei Streitigkeiten aus oder im Zusammenhang mit diesem Nutzungsverhältnis sind die Parteien bestrebt, eine einvernehmliche Lösung zu finden, bevor der Rechtsweg beschritten wird.
                  </p>
                  <p className="mt-2">
                    (4) Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
                  </p>
                </section>

                {/* Kontakt */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">Kontakt</h2>
                  <p>
                    Deutsche Einkaufsfinanzierer GmbH<br />
                    ABC-Straße 35, 20354 Hamburg<br />
                    E-Mail: <a href="mailto:info@liqinow.de" className="text-turquoise hover:underline">info@liqinow.de</a><br />
                    Telefon: 040 999 999 400
                  </p>
                </section>

              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
