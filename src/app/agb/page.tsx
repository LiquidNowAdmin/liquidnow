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
            <Logo size="md" />
            <div className="w-20" />
          </div>
        </div>
      </header>

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="card p-8 sm:p-12">
              <h1 className="text-3xl font-bold text-dark mb-2">Allgemeine Geschäftsbedingungen</h1>
              <p className="text-sm text-subtle mb-8">Stand: April 2026</p>

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
                    (4) Abweichende oder entgegenstehende Bedingungen des Nutzers werden nicht anerkannt, es sei denn, der Betreiber stimmt ihrer Geltung ausdrücklich schriftlich zu.
                  </p>
                </section>

                {/* 2. Leistungsbeschreibung */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">§ 2 Leistungsbeschreibung</h2>
                  <p>
                    (1) Der Betreiber stellt eine Plattform zur Verfügung, auf der gewerbliche Nutzer Finanzierungsangebote verschiedener Anbieter vergleichen und Anfragen an diese Anbieter übermitteln können.
                  </p>
                  <p className="mt-2">
                    (2) Der Betreiber erbringt einen Tippgeber-Service. Er vermittelt keine Kredite im Sinne des § 34c GewO und erbringt keine Finanzberatung. Die Kreditentscheidung liegt ausschließlich bei den jeweiligen Finanzierungspartnern.
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
                    (1) Durch die Übermittlung einer Finanzierungsanfrage über die Plattform beauftragt der Nutzer den Betreiber, seine Antragsdaten an den ausgewählten Finanzierungspartner weiterzuleiten.
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
                    (1) Mit der Übermittlung einer Finanzierungsanfrage willigt der Nutzer in die Weitergabe seiner Antragsdaten an den ausgewählten Finanzierungspartner ein. Die Datenverarbeitung durch den Finanzierungspartner richtet sich nach dessen eigenen Datenschutzbestimmungen.
                  </p>
                  <p className="mt-2">
                    (2) Der Betreiber verarbeitet personenbezogene Daten gemäß seiner Datenschutzerklärung, abrufbar unter{" "}
                    <Link href="/datenschutz" className="text-turquoise hover:underline">www.liqinow.de/datenschutz</Link>.
                  </p>
                </section>

                {/* 7. Haftung */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">§ 7 Haftung</h2>
                  <p>
                    (1) Der Betreiber haftet unbeschränkt für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit, die auf einer vorsätzlichen oder fahrlässigen Pflichtverletzung beruhen, sowie für Schäden, die auf vorsätzlichem oder grob fahrlässigem Verhalten beruhen.
                  </p>
                  <p className="mt-2">
                    (2) Bei leicht fahrlässiger Verletzung wesentlicher Vertragspflichten (Kardinalpflichten) ist die Haftung auf den vertragstypisch vorhersehbaren Schaden begrenzt.
                  </p>
                  <p className="mt-2">
                    (3) Eine weitergehende Haftung ist ausgeschlossen. Insbesondere haftet der Betreiber nicht für die Richtigkeit, Vollständigkeit oder Aktualität der auf der Plattform dargestellten Finanzierungsangebote.
                  </p>
                  <p className="mt-2">
                    (4) Der Betreiber haftet nicht für Handlungen oder Unterlassungen der Finanzierungspartner, insbesondere nicht für deren Kreditentscheidungen oder die Erfüllung der zwischen dem Nutzer und dem Finanzierungspartner geschlossenen Verträge.
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
                </section>

                {/* 9. Geistiges Eigentum */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">§ 9 Geistiges Eigentum</h2>
                  <p>
                    Alle Inhalte der Plattform (Texte, Grafiken, Logos, Software) sind urheberrechtlich geschützt. Die Nutzung über den bestimmungsgemäßen Gebrauch der Plattform hinaus bedarf der vorherigen schriftlichen Zustimmung des Betreibers.
                  </p>
                </section>

                {/* 10. Änderungen der AGB */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">§ 10 Änderungen der AGB</h2>
                  <p>
                    (1) Der Betreiber behält sich das Recht vor, diese AGB jederzeit zu ändern. Änderungen werden auf der Plattform veröffentlicht.
                  </p>
                  <p className="mt-2">
                    (2) Durch die fortgesetzte Nutzung der Plattform nach Veröffentlichung geänderter AGB erklärt der Nutzer sein Einverständnis mit den Änderungen.
                  </p>
                </section>

                {/* 11. Schlussbestimmungen */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">§ 11 Schlussbestimmungen</h2>
                  <p>
                    (1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.
                  </p>
                  <p className="mt-2">
                    (2) Gerichtsstand für alle Streitigkeiten aus oder im Zusammenhang mit diesen AGB ist Hamburg, sofern der Nutzer Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen ist.
                  </p>
                  <p className="mt-2">
                    (3) Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
                  </p>
                </section>

                {/* Kontakt */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">Kontakt</h2>
                  <p>
                    Deutsche Einkaufsfinanzierer GmbH<br />
                    ABC-Straße 35, 20354 Hamburg<br />
                    E-Mail: <a href="mailto:info@liqinow.de" className="text-turquoise hover:underline">info@liqinow.de</a><br />
                    Telefon: +49 40 999 999-400
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
