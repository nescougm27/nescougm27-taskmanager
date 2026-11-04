import { parseList, type WorkspaceRecord, type WwcAnswer } from './schema';

export const starterQuestions = [
  {
    category: 'Pengenalan',
    title: 'Ceritakan tentang dirimu dan pengalaman yang paling relevan dengan NESCO.',
  },
  {
    category: 'Motivasi',
    title: 'Apa motivasimu bergabung dengan NESCO dan apa yang ingin kamu pelajari?',
  },
  {
    category: 'Divisi',
    title: 'Mengapa kamu memilih divisi ini? Kontribusi apa yang ingin kamu berikan?',
  },
  {
    category: 'Kerja sama',
    title:
      'Ceritakan pengalaman menghadapi perbedaan pendapat dalam tim. Bagaimana kamu menyelesaikannya?',
  },
  {
    category: 'Komitmen',
    title: 'Bagaimana kamu membagi waktu antara kuliah, organisasi, dan tanggung jawab di NESCO?',
  },
  {
    category: 'Pemecahan masalah',
    title:
      'Jika tugasmu terhambat menjelang tenggat, langkah apa yang akan kamu ambil dan bagaimana kamu mengomunikasikannya?',
  },
];

// Keep the original wording of answered questions, even after the bank is edited or deleted.
export function interviewAnswers(
  participant: WorkspaceRecord | undefined,
  questions: WorkspaceRecord[],
): WwcAnswer[] {
  const saved = parseList<WwcAnswer>(participant?.answers_json);
  return [
    ...questions.map(
      (question) =>
        saved.find((answer) => answer.question_id === question.id) || {
          question_id: question.id,
          question: question.title,
          response: '',
        },
    ),
    ...saved.filter((answer) => !questions.some((question) => question.id === answer.question_id)),
  ];
}
