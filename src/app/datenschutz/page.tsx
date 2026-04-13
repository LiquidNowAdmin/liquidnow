import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Footer from "@/components/Footer";
import Logo from "@/components/Logo";

export const metadata = {
  title: "Datenschutzerklärung – LiQiNow",
  description: "Datenschutzerklärung der LiQiNow Plattform der Deutschen Einkaufsfinanzierer GmbH",
};

export default function DatenschutzPage() {
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
              <h1 className="text-3xl font-bold text-dark mb-2">Datenschutzerklärung</h1>
              <p className="text-sm text-subtle mb-8">Stand: April 2026</p>

              <div className="space-y-8 text-dark text-[0.9375rem] leading-relaxed">

                {/* 1. Verantwortlicher */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">1. Verantwortlicher</h2>
                  <p>
                    Deutsche Einkaufsfinanzierer GmbH<br />
                    ABC-Straße 35<br />
                    20354 Hamburg<br />
                    E-Mail: <a href="mailto:datenschutz@liqinow.de" className="text-turquoise hover:underline">datenschutz@liqinow.de</a><br />
                    Telefon: +49 40 999 999-400
                  </p>
                  <p className="mt-2">
                    Geschäftsführender Gesellschafter: Thomas Auerbach<br />
                    Handelsregister: Amtsgericht Hamburg, HRB 177955
                  </p>
                </section>

                {/* 2. Überblick */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">2. Überblick über die Datenverarbeitung</h2>
                  <p>
                    LiQiNow ist ein digitaler Working-Capital-Marktplatz der Deutschen Einkaufsfinanzierer GmbH. Wir vermitteln Finanzierungslösungen von Drittanbietern (Banken und Fintechs) an mittelständische Unternehmen. Im Rahmen dieser Vermittlung verarbeiten wir personenbezogene Daten gemäß der Datenschutz-Grundverordnung (DSGVO) und des Bundesdatenschutzgesetzes (BDSG).
                  </p>
                </section>

                {/* 3. Rechtsgrundlagen */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">3. Rechtsgrundlagen der Verarbeitung</h2>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Art. 6 Abs. 1 lit. a DSGVO</strong> – Einwilligung (z. B. Marketing-Cookies, Newsletter)</li>
                    <li><strong>Art. 6 Abs. 1 lit. b DSGVO</strong> – Vertragserfüllung bzw. vorvertragliche Maßnahmen (z. B. Finanzierungsanfrage)</li>
                    <li><strong>Art. 6 Abs. 1 lit. f DSGVO</strong> – Berechtigtes Interesse (z. B. Webseitenanalyse, Betrugsprävention)</li>
                    <li><strong>Art. 6 Abs. 1 lit. c DSGVO</strong> – Rechtliche Verpflichtung (z. B. steuerliche Aufbewahrungspflichten)</li>
                  </ul>
                </section>

                {/* 4. Datenerhebung auf der Website */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">4. Datenerhebung auf der Website</h2>

                  <h3 className="text-lg font-semibold mt-4 mb-2">4.1 Server-Log-Dateien</h3>
                  <p>
                    Bei jedem Zugriff auf unsere Website werden automatisch technische Daten erhoben: IP-Adresse, Browsertyp und -version, Betriebssystem, Referrer-URL, aufgerufene Seiten, Datum und Uhrzeit des Zugriffs. Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO zur Gewährleistung der technischen Sicherheit.
                  </p>

                  <h3 className="text-lg font-semibold mt-4 mb-2">4.2 Cookies und lokale Speicherung</h3>
                  <p>
                    Unsere Website verwendet technisch notwendige Cookies und localStorage-Einträge für die Authentifizierung und Session-Verwaltung. Darüber hinaus setzen wir mit Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) Tracking-Cookies für anonymisierte Nutzungsanalysen ein.
                  </p>
                  <p className="mt-2">
                    Sie können Ihre Cookie-Einwilligung jederzeit über den Cookie-Banner widerrufen oder in Ihren Browsereinstellungen Cookies blockieren.
                  </p>
                </section>

                {/* 5. Registrierung und Nutzerkonto */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">5. Registrierung und Nutzerkonto</h2>
                  <p>
                    Für die Nutzung unseres Marktplatzes ist die Erstellung eines Nutzerkontos erforderlich. Dabei erheben wir:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>E-Mail-Adresse</li>
                    <li>Vor- und Nachname</li>
                    <li>Telefonnummer</li>
                    <li>Geburtsdatum</li>
                    <li>Anschrift (Straße, PLZ, Ort)</li>
                  </ul>
                  <p className="mt-2">
                    Die Verarbeitung erfolgt zur Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO). Die Anmeldung ist über Google OAuth oder einen E-Mail-Login-Link (Magic Link) möglich.
                  </p>
                </section>

                {/* 6. Finanzierungsanfragen */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">6. Verarbeitung von Finanzierungsanfragen</h2>
                  <p>
                    Im Rahmen einer Finanzierungsanfrage erheben wir zusätzlich:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>Firmenname, Rechtsform, Handelsregisternummer (HRB)</li>
                    <li>Umsatzsteuer-ID, Creditreform-Nummer (Crefo)</li>
                    <li>Firmenanschrift und Website</li>
                    <li>Monatlicher Umsatz / Jahresumsatz</li>
                    <li>Gewünschtes Finanzierungsvolumen, Laufzeit und Verwendungszweck</li>
                  </ul>
                  <p className="mt-2">
                    Diese Daten werden zur Durchführung vorvertraglicher Maßnahmen (Art. 6 Abs. 1 lit. b DSGVO) verarbeitet und an den jeweils gewählten Finanzierungspartner übermittelt.
                  </p>
                </section>

                {/* 7. Datenweitergabe an Dritte */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">7. Datenweitergabe an Finanzierungspartner</h2>
                  <p>
                    Wenn Sie eine Finanzierungsanfrage über unseren Marktplatz stellen, werden Ihre Daten an den von Ihnen gewählten Finanzierungspartner übermittelt. Aktuell arbeiten wir unter anderem mit folgenden Partnern zusammen:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li><strong>Qred Bank AB</strong> (Schweden) – Übermittlung der Antragsdaten zur Kreditprüfung</li>
                    <li><strong>YouLend</strong> (Großbritannien) – Übermittlung der Antragsdaten zur Kreditprüfung</li>
                    <li><strong>iwoca Ltd.</strong> (Großbritannien) – Übermittlung der Antragsdaten zur Kreditprüfung</li>
                  </ul>
                  <p className="mt-2">
                    Die Datenübermittlung in Drittländer (UK, Schweden) erfolgt auf Grundlage des Angemessenheitsbeschlusses der EU-Kommission bzw. unter Verwendung von EU-Standardvertragsklauseln (Art. 46 Abs. 2 lit. c DSGVO).
                  </p>
                  <p className="mt-2">
                    Bitte beachten Sie, dass die Finanzierungspartner eigenständige Verantwortliche im Sinne der DSGVO sind. Für die Datenverarbeitung nach Übermittlung gelten die jeweiligen Datenschutzerklärungen der Partner.
                  </p>
                </section>

                {/* 8. Hosting und Auftragsverarbeiter */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">8. Hosting und Auftragsverarbeiter</h2>
                  <p>Wir setzen folgende Dienstleister als Auftragsverarbeiter ein:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-2">
                    <li>
                      <strong>Supabase Inc.</strong> (USA) – Datenbank-Hosting, Authentifizierung, Edge Functions, Datenspeicherung. Datenverarbeitung in der EU (AWS Frankfurt). Auftragsverarbeitungsvertrag geschlossen.
                    </li>
                    <li>
                      <strong>Scaleway SAS</strong> (Frankreich) – Website-Hosting und Datenspeicherung. Datenverarbeitung in der EU (Rechenzentrum Amsterdam, Niederlande).
                    </li>
                    <li>
                      <strong>Google Ireland Ltd.</strong> – Authentifizierung via Google OAuth (Single Sign-On). Es werden nur die für die Anmeldung erforderlichen Daten (Name, E-Mail) übermittelt.
                    </li>
                    <li>
                      <strong>OpenAI Inc.</strong> (USA) – Automatisierte Extraktion öffentlich zugänglicher Firmendaten (Impressum) zur Vereinfachung der Antragstellung. Es werden keine personenbezogenen Daten, sondern ausschließlich öffentlich verfügbare Firmendaten verarbeitet.
                    </li>
                    <li>
                      <strong>Resend Inc.</strong> (USA) – Versand von transaktionalen E-Mails (Login-Links). Auftragsverarbeitungsvertrag geschlossen.
                    </li>
                  </ul>
                  <p className="mt-2">
                    Soweit Auftragsverarbeiter in den USA ansässig sind, erfolgt die Datenübermittlung auf Grundlage des EU-US Data Privacy Framework bzw. unter Verwendung von EU-Standardvertragsklauseln.
                  </p>
                </section>

                {/* 9. Firmensuche */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">9. Automatisierte Firmensuche</h2>
                  <p>
                    Zur Vereinfachung der Antragstellung bieten wir eine Firmensuche an, bei der öffentlich zugängliche Firmendaten (Name, Anschrift, Handelsregisternummer, Creditreform-Nummer) aus externen Quellen abgerufen werden. Es handelt sich dabei ausschließlich um öffentlich zugängliche Unternehmensdaten, nicht um personenbezogene Daten.
                  </p>
                </section>

                {/* 10. Tracking */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">10. Webanalyse und Marketing</h2>
                  <p>
                    Mit Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) setzen wir ein eigenes, selbst gehostetes Tracking-System ein, um die Nutzung unserer Website anonymisiert auszuwerten. Es werden keine Daten an externe Analyse-Dienste übermittelt. Die erfassten Daten umfassen:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>Anonymisierte Besucher-ID (pseudonymisiert, kein Rückschluss auf Person)</li>
                    <li>Aufgerufene Seiten und Verweildauer</li>
                    <li>Gerätetyp (Desktop/Mobil/Tablet)</li>
                    <li>Herkunftsquelle (UTM-Parameter, Referrer)</li>
                    <li>Funnel-Fortschritt (welche Schritte im Antragsprozess erreicht wurden)</li>
                  </ul>
                  <p className="mt-2">
                    Sie können Ihre Einwilligung jederzeit über den Cookie-Banner widerrufen.
                  </p>
                </section>

                {/* 11. Betroffenenrechte */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">11. Ihre Rechte als betroffene Person</h2>
                  <p>Sie haben folgende Rechte gemäß DSGVO:</p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li><strong>Auskunft</strong> (Art. 15 DSGVO) – über die zu Ihrer Person gespeicherten Daten</li>
                    <li><strong>Berichtigung</strong> (Art. 16 DSGVO) – unrichtiger personenbezogener Daten</li>
                    <li><strong>Löschung</strong> (Art. 17 DSGVO) – Ihrer Daten, sofern keine Aufbewahrungspflichten entgegenstehen</li>
                    <li><strong>Einschränkung der Verarbeitung</strong> (Art. 18 DSGVO)</li>
                    <li><strong>Datenübertragbarkeit</strong> (Art. 20 DSGVO) – Erhalt Ihrer Daten in einem maschinenlesbaren Format</li>
                    <li><strong>Widerspruch</strong> (Art. 21 DSGVO) – gegen die Verarbeitung auf Grundlage berechtigter Interessen</li>
                    <li><strong>Widerruf der Einwilligung</strong> (Art. 7 Abs. 3 DSGVO) – jederzeit mit Wirkung für die Zukunft</li>
                  </ul>
                  <p className="mt-2">
                    Zur Ausübung Ihrer Rechte wenden Sie sich an: <a href="mailto:datenschutz@liqinow.de" className="text-turquoise hover:underline">datenschutz@liqinow.de</a>
                  </p>
                </section>

                {/* 12. Beschwerderecht */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">12. Beschwerderecht bei der Aufsichtsbehörde</h2>
                  <p>
                    Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde über die Verarbeitung Ihrer personenbezogenen Daten zu beschweren. Die für uns zuständige Aufsichtsbehörde ist:
                  </p>
                  <p className="mt-2">
                    Der Hamburgische Beauftragte für Datenschutz und Informationsfreiheit<br />
                    Ludwig-Erhard-Str. 22, 7. OG<br />
                    20459 Hamburg<br />
                    <a href="https://datenschutz-hamburg.de" target="_blank" rel="noopener noreferrer" className="text-turquoise hover:underline">datenschutz-hamburg.de</a>
                  </p>
                </section>

                {/* 13. Speicherdauer */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">13. Speicherdauer</h2>
                  <p>
                    Personenbezogene Daten werden gelöscht, sobald der Zweck der Verarbeitung entfällt und keine gesetzlichen Aufbewahrungspflichten (z. B. handels- oder steuerrechtliche Aufbewahrungsfristen von 6 bzw. 10 Jahren) entgegenstehen. Nutzerkonten können jederzeit gelöscht werden.
                  </p>
                </section>

                {/* 14. Datensicherheit */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">14. Datensicherheit</h2>
                  <p>
                    Wir setzen technische und organisatorische Maßnahmen zum Schutz Ihrer Daten ein, darunter:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>Verschlüsselte Datenübertragung (TLS/HTTPS)</li>
                    <li>Row-Level Security auf Datenbankebene (jeder Nutzer sieht nur seine eigenen Daten)</li>
                    <li>Verschlüsselte Speicherung sensibler Daten (API-Schlüssel via Vault)</li>
                    <li>Regelmäßige Sicherheitsupdates und Zugriffskontrollen</li>
                  </ul>
                </section>

                {/* 15. Änderungen */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">15. Änderungen dieser Datenschutzerklärung</h2>
                  <p>
                    Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf anzupassen, um sie an geänderte Rechtslagen oder Änderungen unseres Dienstes anzupassen. Die aktuelle Version finden Sie stets auf dieser Seite.
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
