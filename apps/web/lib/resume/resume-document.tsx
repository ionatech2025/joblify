import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

export type ResumeExperience = {
  company: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
};

export type ResumeData = {
  name: string;
  headline: string | null;
  email: string;
  location: string | null;
  portfolioUrl: string | null;
  bio: string | null;
  skills: string[];
  experience: ResumeExperience[];
  education: string | null;
  certifications: string | null;
};

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10.5, fontFamily: 'Helvetica', color: '#1a1a1a' },
  name: { fontSize: 22, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  headline: { fontSize: 12, color: '#444', marginBottom: 8 },
  contact: { fontSize: 9.5, color: '#555', marginBottom: 16 },
  section: { marginTop: 14 },
  sectionTitle: {
    fontSize: 11.5,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
    paddingBottom: 3,
    borderBottom: '1 solid #ccc',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: { marginBottom: 9 },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  rowTitle: { fontSize: 10.5, fontFamily: 'Helvetica-Bold' },
  rowDates: { fontSize: 9.5, color: '#555' },
  rowCompany: { fontSize: 10, color: '#333', marginBottom: 2 },
  text: { fontSize: 10, lineHeight: 1.45 },
});

export function ResumeDocument({ data }: { data: ResumeData }) {
  const contactLine = [data.email, data.location, data.portfolioUrl]
    .filter(Boolean)
    .join('   ·   ');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.name}>{data.name}</Text>
        {data.headline ? <Text style={styles.headline}>{data.headline}</Text> : null}
        {contactLine ? <Text style={styles.contact}>{contactLine}</Text> : null}

        {data.bio ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.text}>{data.bio}</Text>
          </View>
        ) : null}

        {data.experience.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience</Text>
            {data.experience.map((exp, i) => {
              const dates = [exp.startDate, exp.endDate].filter(Boolean).join(' – ');
              return (
                <View key={i} style={styles.row}>
                  <View style={styles.rowHeader}>
                    <Text style={styles.rowTitle}>{exp.title}</Text>
                    {dates ? <Text style={styles.rowDates}>{dates}</Text> : null}
                  </View>
                  <Text style={styles.rowCompany}>{exp.company}</Text>
                  {exp.description ? <Text style={styles.text}>{exp.description}</Text> : null}
                </View>
              );
            })}
          </View>
        ) : null}

        {data.skills.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <Text style={styles.text}>{data.skills.join('   ·   ')}</Text>
          </View>
        ) : null}

        {data.education ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            <Text style={styles.text}>{data.education}</Text>
          </View>
        ) : null}

        {data.certifications ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            <Text style={styles.text}>{data.certifications}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
