import Logo from "@/components/Logo";
import { COMPANY_INFO } from "@/lib/company-info";

export default function Footer() {
  return (
    <footer className="bg-dark text-white">
      <div className="container py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          {/* Logo & Tagline */}
          <div>
            <div className="mb-4">
              <Logo size="md" />
            </div>
            <p className="footer-text leading-relaxed">
              Diagnose statt Symptombehandlung. Working-Capital-Lösungen für KMU – neutral, nachvollziehbar, CFO-tauglich.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="footer-heading">Rechtliches</h4>
            <ul className="space-y-3">
              <li><a href="/impressum" className="footer-link">Impressum</a></li>
              <li><a href="/datenschutz" className="footer-link">Datenschutz</a></li>
              <li><a href="/agb" className="footer-link">AGB</a></li>
            </ul>
          </div>

          {/* Kontakt */}
          <div>
            <h4 className="footer-heading">Kontakt</h4>
            <ul className="space-y-3">
              <li>
                <a href={`tel:${COMPANY_INFO.phoneE164}`} className="footer-link">
                  {COMPANY_INFO.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${COMPANY_INFO.email}`} className="footer-link">
                  {COMPANY_INFO.email}
                </a>
              </li>
              <li>
                <span className="footer-text">{COMPANY_INFO.phoneHours}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8">
          <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
            <p className="text-xs text-white/40">
              &copy; {new Date().getFullYear()} LiQiNow. Alle Rechte vorbehalten.
            </p>
            <p className="text-xs text-white/30 text-center md:text-right max-w-md">
              LiQiNow ist ein Tippgeber-Service und bietet keine Finanzberatung
              oder Kreditvermittlung im Sinne des §34c GewO an.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
