export function LocalBusinessSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    name: "Mindsupport Psychotherapy Ltd",
    description: "Psychotherapy support with online and in-person options.",
    availableService: [
      { "@type": "Service", name: "Free discovery call" },
      { "@type": "Service", name: "Psychotherapy session" },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />;
}
