'use client';
import { useState, type FormEvent } from 'react';
import { Plus, UsersRound, MessageSquareText, CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import { useWorkspace } from './providers';
import { Badge, Confirmation, EmptyState, MetricCard, PageHeading, SearchInput } from './shared';
import { Field } from './record-editor';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import { schemas, wwcStatuses, type WorkspaceRecord } from '@/lib/schema';
import { memberCanEdit } from '@/lib/permissions';
import { interviewAnswers, starterQuestions } from '@/lib/wwc';

type WwcResource = 'wwc-participants' | 'wwc-questions';
type Editor = { resource: WwcResource; record?: WorkspaceRecord };

export function Interviews() {
  const { data, user, save, notify } = useWorkspace();
  const [tab, setTab] = useState<WwcResource>('wwc-participants');
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState<Editor | null>(null);
  const [seeding, setSeeding] = useState(false);
  const participants = data['wwc-participants'];
  const questions = data['wwc-questions'];
  const writable = user.role !== 'viewer';
  const missingQuestions = starterQuestions.filter(
    (question, index) =>
      !questions.some(
        (existing) =>
          existing.title === question.title ||
          existing.id === `00000000-0000-4000-8000-${String(601 + index).padStart(12, '0')}`,
      ),
  );
  const records = data[tab].filter((record) =>
    `${record.title} ${record.division || ''} ${record.category || ''} ${record.email || ''}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  async function addStarterQuestions() {
    setSeeding(true);
    try {
      for (const question of missingQuestions) {
        const index = starterQuestions.indexOf(question);
        await save('wwc-questions', {
          ...question,
          id: `00000000-0000-4000-8000-${String(601 + index).padStart(12, '0')}`,
          responsible: user.email,
        });
      }
    } catch (error) {
      notify(
        error instanceof Error ? error.message : 'Pertanyaan belum tersimpan. Silakan coba lagi.',
        true,
      );
    } finally {
      setSeeding(false);
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="REKRUTMEN NESCO 2027"
        title="Kenali kandidat, mulai percakapan."
        description="Kelola peserta WWC, siapkan pertanyaan, dan catat jawaban wawancara dalam satu tempat."
        actions={
          writable && (
            <Button onClick={() => setEditor({ resource: tab })}>
              <Plus size={16} />
              {tab === 'wwc-participants' ? 'Tambah peserta' : 'Tambah pertanyaan'}
            </Button>
          )
        }
      />
      <div className="metrics-grid wwc-metrics">
        <MetricCard
          label="Peserta WWC"
          value={participants.length}
          caption="Kandidat yang sudah ditambahkan"
          icon={UsersRound}
        />
        <MetricCard
          label="Selesai diwawancarai"
          value={participants.filter((participant) => participant.status === wwcStatuses[1]).length}
          caption="Wawancara yang sudah selesai"
          icon={CheckCircle2}
        />
        <MetricCard
          label="Bank pertanyaan"
          value={questions.length}
          caption="Pertanyaan untuk memandu WWC"
          icon={MessageSquareText}
        />
      </div>
      <div className="feedback-main-tabs" role="tablist" aria-label="Menu wawancara">
        {(
          [
            ['wwc-participants', 'Peserta WWC'],
            ['wwc-questions', 'Bank pertanyaan'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            id={`${value}-tab`}
            type="button"
            role="tab"
            aria-selected={tab === value}
            aria-controls="wwc-panel"
            className={tab === value ? 'selected' : ''}
            onClick={() => {
              setTab(value);
              setSearch('');
            }}
          >
            {label} <Badge>{data[value].length}</Badge>
          </button>
        ))}
      </div>
      <section id="wwc-panel" role="tabpanel" aria-labelledby={`${tab}-tab`}>
        <div className="toolbar wwc-toolbar">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={
              tab === 'wwc-participants'
                ? 'Cari nama, email, atau divisi…'
                : 'Cari pertanyaan atau kategori…'
            }
          />
          {tab === 'wwc-questions' && writable && missingQuestions.length > 0 && (
            <Button variant="outline" disabled={seeding} onClick={addStarterQuestions}>
              {seeding ? 'Menambahkan…' : 'Tambahkan pertanyaan awal'}
            </Button>
          )}
        </div>
        {tab === 'wwc-questions' && (
          <p className="wwc-hint">
            Pertanyaan berlaku untuk semua kandidat. Tambahkan pertanyaan sesuai kebutuhan divisi;
            jawaban dicatat lewat detail peserta.
          </p>
        )}
        {!records.length ? (
          <EmptyState
            title={
              search
                ? 'Tidak ada hasil pencarian'
                : tab === 'wwc-participants'
                  ? 'Belum ada peserta WWC'
                  : 'Bank pertanyaan masih kosong'
            }
            description={
              search
                ? 'Coba kata kunci lain.'
                : tab === 'wwc-participants'
                  ? 'Tambahkan kandidat pertama, lalu buka detailnya untuk mencatat jawaban.'
                  : 'Buat pertanyaan sendiri atau tambahkan contoh pertanyaan awal.'
            }
          />
        ) : (
          <div className="wwc-list">
            {records.map((record) => (
              <article className="wwc-card panel" key={record.id}>
                <div className="wwc-card-body">
                  <Badge
                    tone={
                      tab === 'wwc-participants' && record.status === wwcStatuses[1]
                        ? 'green'
                        : 'neutral'
                    }
                  >
                    {tab === 'wwc-participants' ? record.status : record.category}
                  </Badge>
                  <h2>{record.title}</h2>
                  {tab === 'wwc-participants' && (
                    <p>
                      {[record.division, record.email].filter(Boolean).join(' · ') ||
                        'Divisi dan email belum diisi'}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditor({ resource: tab, record })}
                >
                  <Pencil size={14} />
                  {tab === 'wwc-participants'
                    ? 'Detail & jawaban'
                    : memberCanEdit(user, record, tab)
                      ? 'Edit pertanyaan'
                      : 'Lihat pertanyaan'}
                </Button>
              </article>
            ))}
          </div>
        )}
      </section>
      <Dialog
        open={!!editor}
        onOpenChange={(open) => {
          if (!open) setEditor(null);
        }}
      >
        <DialogContent className="wwc-dialog">
          {editor && (
            <InterviewForm
              key={`${editor.resource}-${editor.record?.id || 'new'}`}
              editor={editor}
              onClose={() => setEditor(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function InterviewForm({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const { user, data, save, remove } = useWorkspace();
  const { resource, record } = editor;
  const participant = resource === 'wwc-participants';
  const editable = !record ? user.role !== 'viewer' : memberCanEdit(user, record, resource);
  const [id] = useState(() => record?.id || crypto.randomUUID());
  const [fields, setFields] = useState<Record<string, string>>(() => ({
    title: '',
    email: '',
    division: '',
    responsible: user.email,
    status: wwcStatuses[0],
    notes: '',
    category: 'Umum',
    ...record,
  }));
  const [answers, setAnswers] = useState(() =>
    participant ? interviewAnswers(record, data['wwc-questions']) : [],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const change = (field: string, value: string) =>
    setFields((previous) => ({ ...previous, [field]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!editable || pending) return;
    setError('');
    const result = schemas[resource].safeParse({
      ...fields,
      answers_json: JSON.stringify(answers.filter((answer) => answer.response.trim())),
    });
    if (!result.success) {
      setErrors(
        Object.fromEntries(
          result.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
        ),
      );
      return;
    }
    setErrors({});
    setPending(true);
    try {
      await save(resource, { ...result.data, id }, record);
      onClose();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Perubahan belum tersimpan. Silakan coba lagi.',
      );
    } finally {
      setPending(false);
    }
  }

  async function deleteRecord() {
    if (!record || pending) return;
    setPending(true);
    setError('');
    try {
      await remove(resource, record);
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Data belum terhapus. Silakan coba lagi.');
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <DialogTitle>
        {participant
          ? record
            ? 'Detail peserta WWC'
            : 'Tambah peserta WWC'
          : record
            ? 'Detail pertanyaan WWC'
            : 'Tambah pertanyaan WWC'}
      </DialogTitle>
      <DialogDescription>
        {participant
          ? 'Isi identitas kandidat dan catat jawaban selama wawancara.'
          : 'Siapkan pertanyaan yang bisa digunakan untuk wawancara seluruh kandidat.'}
      </DialogDescription>
      {!editable && <p className="inline-notice">Akunmu hanya dapat melihat data ini.</p>}
      {error && (
        <p className="error-banner" role="alert">
          {error}
        </p>
      )}
      {deleting ? (
        <Confirmation
          title={participant ? 'Hapus peserta ini?' : 'Hapus pertanyaan ini?'}
          description={
            participant
              ? 'Identitas, catatan, dan jawaban peserta ini akan dihapus permanen.'
              : 'Pertanyaan dihapus dari bank. Jawaban yang sudah disimpan tetap tersedia pada peserta.'
          }
          onConfirm={deleteRecord}
          onCancel={() => setDeleting(false)}
          pending={pending}
        />
      ) : (
        <form className="wwc-form" onSubmit={submit}>
          <fieldset disabled={!editable || pending}>
            <Field
              label={participant ? 'Nama peserta' : 'Pertanyaan'}
              required
              error={errors.title}
            >
              {participant ? (
                <input
                  required
                  minLength={2}
                  maxLength={200}
                  value={fields.title}
                  onChange={(event) => change('title', event.target.value)}
                />
              ) : (
                <textarea
                  required
                  minLength={2}
                  maxLength={2000}
                  rows={4}
                  value={fields.title}
                  onChange={(event) => change('title', event.target.value)}
                />
              )}
            </Field>
            {participant ? (
              <>
                <div className="form-grid">
                  <Field label="Email peserta" error={errors.email}>
                    <input
                      type="email"
                      value={fields.email}
                      onChange={(event) => change('email', event.target.value)}
                    />
                  </Field>
                  <Field label="Divisi pilihan" error={errors.division}>
                    <input
                      maxLength={200}
                      value={fields.division}
                      onChange={(event) => change('division', event.target.value)}
                    />
                  </Field>
                </div>
                <Field label="Status wawancara" error={errors.status}>
                  <select
                    value={fields.status}
                    onChange={(event) => change('status', event.target.value)}
                  >
                    {wwcStatuses.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </Field>
              </>
            ) : (
              <Field label="Kategori pertanyaan" required error={errors.category}>
                <input
                  required
                  minLength={2}
                  maxLength={100}
                  value={fields.category}
                  onChange={(event) => change('category', event.target.value)}
                />
              </Field>
            )}
            {user.role === 'admin' && (
              <Field
                label={participant ? 'Email pewawancara' : 'Email penanggung jawab'}
                required
                error={errors.responsible}
                hint="Gunakan email anggota aktif agar anggota tersebut dapat mengedit data ini."
              >
                <input
                  required
                  type="email"
                  value={fields.responsible}
                  onChange={(event) => change('responsible', event.target.value)}
                />
              </Field>
            )}
            {participant && (
              <>
                <h3 className="wwc-form-heading">Pertanyaan & jawaban</h3>
                <p className="wwc-hint">
                  Jawaban bersifat opsional. Simpan dan lanjutkan wawancara kapan saja.
                </p>
                {!answers.length && (
                  <p className="inline-notice">
                    Tambahkan pertanyaan di tab Bank pertanyaan terlebih dahulu.
                  </p>
                )}
                {errors.answers_json && (
                  <p className="field-error" role="alert">
                    {errors.answers_json}
                  </p>
                )}
                {answers.map((answer, index) => (
                  <Field key={answer.question_id} label={`${index + 1}. ${answer.question}`}>
                    <textarea
                      rows={3}
                      maxLength={5000}
                      value={answer.response}
                      onChange={(event) =>
                        setAnswers((previous) =>
                          previous.map((item) =>
                            item.question_id === answer.question_id
                              ? { ...item, response: event.target.value }
                              : item,
                          ),
                        )
                      }
                    />
                  </Field>
                ))}
                <Field label="Catatan pewawancara" error={errors.notes}>
                  <textarea
                    rows={3}
                    maxLength={10000}
                    value={fields.notes}
                    onChange={(event) => change('notes', event.target.value)}
                  />
                </Field>
              </>
            )}
          </fieldset>
          <div className="form-actions wwc-form-actions">
            {record && user.role === 'admin' && (
              <Button
                type="button"
                variant="destructive"
                disabled={pending}
                onClick={() => setDeleting(true)}
              >
                <Trash2 size={14} />
                {participant ? 'Hapus peserta' : 'Hapus pertanyaan'}
              </Button>
            )}
            <Button type="button" variant="outline" disabled={pending} onClick={onClose}>
              Tutup
            </Button>
            {editable && (
              <Button type="submit" disabled={pending}>
                {pending ? 'Menyimpan…' : participant ? 'Simpan peserta' : 'Simpan pertanyaan'}
              </Button>
            )}
          </div>
        </form>
      )}
    </>
  );
}
