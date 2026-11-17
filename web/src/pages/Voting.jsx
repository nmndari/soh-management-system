import { useMemo, useState } from 'react'
import {
  Plus,
  Search,
  ClipboardList,
  CalendarClock,
  CheckCircle,
  FileText,
  Eye,
  Pencil,
  Trash2,
  X,
  Bell,
  Clock,
  Users,
  BarChart3,
  CircleHelp,
  ListChecks,
  Send,
  Copy,
} from 'lucide-react'
import './Voting.css'

const today = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const addDays = (days) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const makeEmptyQuestion = () => ({
  id: Date.now() + Math.random(),
  title: '',
  type: 'Нэг сонголт',
  required: true,
  options: ['Тийм', 'Үгүй'],
})

const emptyForm = {
  title: '',
  description: '',
  audience: 'Бүх оршин суугч',
  startDate: today(),
  startTime: '09:00',
  endDate: addDays(7),
  endTime: '18:00',
  allowAnonymous: false,
  oneResponse: true,
  notify: false,
  questions: [makeEmptyQuestion()],
}

const initialSurveys = [
  {
    id: 1,
    title: 'Орцны цэвэрлэгээний үйлчилгээний үнэлгээ',
    description: 'Цэвэрлэгээ үйлчилгээний чанарын талаар саналаа өгнө үү.',
    audience: 'Бүх оршин суугч',
    startDate: '2026-11-15',
    startTime: '09:00',
    endDate: '2026-11-22',
    endTime: '18:00',
    allowAnonymous: false,
    oneResponse: true,
    notify: true,
    questions: [
      {
        id: 11,
        title: 'Орцны цэвэрлэгээний үйлчилгээнд хэр сэтгэл хангалуун байна вэ?',
        type: 'Нэг сонголт',
        required: true,
        options: ['Маш сайн', 'Сайн', 'Дунд', 'Муу'],
      },
    ],
    responses: 24,
    status: 'Идэвхтэй',
  },
  {
    id: 2,
    title: 'Лифт шинэчлэх эсэх санал',
    description: 'Лифтийг шинэчлэх талаар оршин суугчдын саналыг авна.',
    audience: 'Бүх оршин суугч',
    startDate: '2026-11-20',
    startTime: '09:00',
    endDate: '2026-11-27',
    endTime: '18:00',
    allowAnonymous: false,
    oneResponse: true,
    notify: false,
    questions: [
      {
        id: 21,
        title: 'Лифтийг шинэчлэхийг дэмжиж байна уу?',
        type: 'Нэг сонголт',
        required: true,
        options: ['Тийм', 'Үгүй', 'Саналгүй'],
      },
    ],
    responses: 0,
    status: 'Ноорог',
  },
  {
    id: 3,
    title: 'Гадна талбайн тохижилтын санал',
    description: 'Гадна талбайд хийх тохижилтын ажлын талаар санал авна.',
    audience: 'Бүх оршин суугч',
    startDate: '2026-11-01',
    startTime: '09:00',
    endDate: '2026-11-10',
    endTime: '18:00',
    allowAnonymous: true,
    oneResponse: true,
    notify: false,
    questions: [
      {
        id: 31,
        title: 'Ямар тохижилт хийх нь зүйтэй вэ?',
        type: 'Олон сонголт',
        required: true,
        options: ['Хүүхдийн тоглоомын талбай', 'Ногоон байгууламж', 'Амрах сандал'],
      },
    ],
    responses: 38,
    status: 'Дууссан',
  },
]

const formatDate = (date) => {
  if (!date) return '-'
  const [year, month, day] = date.split('-')
  return `${year}.${month}.${day}`
}

const getSurveyStatus = (survey) => {
  if (survey.status === 'Ноорог') return 'Ноорог'

  const now = new Date()
  const start = new Date(`${survey.startDate}T${survey.startTime || '00:00'}:00`)
  const end = new Date(`${survey.endDate}T${survey.endTime || '23:59'}:00`)

  if (now < start) return 'Эхлэхийг хүлээж буй'
  if (now > end) return 'Дууссан'
  return 'Идэвхтэй'
}

const statusClass = (status) => {
  if (status === 'Идэвхтэй') return 'active'
  if (status === 'Дууссан') return 'completed'
  if (status === 'Эхлэхийг хүлээж буй') return 'waiting'
  return 'draft'
}

function Voting() {
  const [surveys, setSurveys] = useState(initialSurveys)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Бүх төлөв')
  const [showModal, setShowModal] = useState(false)
  const [selectedSurvey, setSelectedSurvey] = useState(null)
  const [viewSurvey, setViewSurvey] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const surveysWithStatus = useMemo(
    () => surveys.map((survey) => ({ ...survey, currentStatus: getSurveyStatus(survey) })),
    [surveys]
  )

  const activeCount = surveysWithStatus.filter((survey) => survey.currentStatus === 'Идэвхтэй').length
  const completedCount = surveysWithStatus.filter((survey) => survey.currentStatus === 'Дууссан').length
  const draftCount = surveysWithStatus.filter((survey) => survey.currentStatus === 'Ноорог').length

  const filteredSurveys = surveysWithStatus.filter((survey) => {
    const matchesSearch = survey.title.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'Бүх төлөв' || survey.currentStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  const openCreateModal = () => {
    setSelectedSurvey(null)
    setForm({
      ...emptyForm,
      startDate: today(),
      endDate: addDays(7),
      questions: [makeEmptyQuestion()],
    })
    setShowModal(true)
  }

  const openEditModal = (survey) => {
    setSelectedSurvey(survey)
    setForm({
      ...emptyForm,
      ...survey,
      questions: survey.questions?.length
        ? survey.questions.map((question) => ({ ...question, options: [...(question.options || [])] }))
        : [makeEmptyQuestion()],
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedSurvey(null)
    setForm(emptyForm)
  }

  const updateQuestion = (questionId, changes) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((question) =>
        question.id === questionId ? { ...question, ...changes } : question
      ),
    }))
  }

  const addQuestion = () => {
    setForm((prev) => ({
      ...prev,
      questions: [...prev.questions, makeEmptyQuestion()],
    }))
  }

  const removeQuestion = (questionId) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((question) => question.id !== questionId),
    }))
  }

  const updateOption = (questionId, optionIndex, value) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((question) =>
        question.id === questionId
          ? {
              ...question,
              options: question.options.map((option, index) =>
                index === optionIndex ? value : option
              ),
            }
          : question
      ),
    }))
  }

  const addOption = (questionId) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((question) =>
        question.id === questionId
          ? { ...question, options: [...question.options, ''] }
          : question
      ),
    }))
  }

  const removeOption = (questionId, optionIndex) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((question) =>
        question.id === questionId
          ? {
              ...question,
              options: question.options.filter((_, index) => index !== optionIndex),
            }
          : question
      ),
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const action = event.nativeEvent.submitter?.value
    const shouldPublish = action === 'publish'

    const cleanQuestions = form.questions.map((question) => ({
      ...question,
      title: question.title.trim(),
      options:
        question.type === 'Богино хариулт' || question.type === 'Урт хариулт'
          ? []
          : question.options.map((option) => option.trim()).filter(Boolean),
    }))

    if (!form.title.trim()) {
      window.alert('Санал асуулгын нэрийг оруулна уу.')
      return
    }

    if (cleanQuestions.some((question) => !question.title)) {
      window.alert('Бүх асуултын текстийг оруулна уу.')
      return
    }

    if (
      cleanQuestions.some(
        (question) =>
          question.type !== 'Богино хариулт' &&
          question.type !== 'Урт хариулт' &&
          question.options.length < 2
      )
    ) {
      window.alert('Сонголтот асуулт бүр дор хаяж 2 хариултын сонголттой байх ёстой.')
      return
    }

    const start = new Date(`${form.startDate}T${form.startTime}:00`)
    const end = new Date(`${form.endDate}T${form.endTime}:00`)

    if (end <= start) {
      window.alert('Дуусах хугацаа эхлэх хугацаанаас хойш байх ёстой.')
      return
    }

    const survey = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      questions: cleanQuestions,
      status: shouldPublish ? 'Нийтэлсэн' : 'Ноорог',
      responses: selectedSurvey?.responses ?? 0,
      id: selectedSurvey ? selectedSurvey.id : Date.now(),
    }

    if (selectedSurvey) {
      setSurveys((prev) => prev.map((item) => (item.id === selectedSurvey.id ? survey : item)))
    } else {
      setSurveys((prev) => [survey, ...prev])
    }

    closeModal()
  }

  const handleDelete = (id) => {
    if (!window.confirm('Энэ санал асуулгыг устгахдаа итгэлтэй байна уу?')) return
    setSurveys((prev) => prev.filter((survey) => survey.id !== id))
    if (viewSurvey?.id === id) setViewSurvey(null)
  }

  const handlePublish = (id) => {
    setSurveys((prev) =>
      prev.map((survey) => (survey.id === id ? { ...survey, status: 'Нийтэлсэн' } : survey))
    )
  }

  const handleUnpublish = (id) => {
    setSurveys((prev) =>
      prev.map((survey) => (survey.id === id ? { ...survey, status: 'Ноорог' } : survey))
    )
  }

  const copySurveyLink = async (survey) => {
    const link = `${window.location.origin}/survey/${survey.id}`
    try {
      await navigator.clipboard.writeText(link)
      window.alert('Санал асуулгын холбоосыг хууллаа.')
    } catch {
      window.alert(`Санал асуулгын холбоос: ${link}`)
    }
  }
    return (
    <div className="voting-page">
      <div className="voting-heading">
        <div>
          <span className="voting-eyebrow">ОРШИН СУУГЧДЫН ОРОЛЦОО</span>
          <h1>Санал асуулга</h1>
          <p>Оршин суугчдаас санал, хүсэлт болон үнэлгээ авах.</p>
        </div>
        <button className="add-survey-btn" onClick={openCreateModal}>
          <Plus size={18} />
          Шинэ санал асуулга
        </button>
      </div>

      <div className="voting-stats">
        <div className="voting-stat-card">
          <div className="voting-stat-icon blue"><ClipboardList size={21} /></div>
          <div><p>Нийт санал асуулга</p><h2>{surveys.length}</h2></div>
        </div>
        <div className="voting-stat-card">
          <div className="voting-stat-icon green"><CheckCircle size={21} /></div>
          <div><p>Идэвхтэй</p><h2>{activeCount}</h2></div>
        </div>
        <div className="voting-stat-card">
          <div className="voting-stat-icon purple"><BarChart3 size={21} /></div>
          <div><p>Дууссан</p><h2>{completedCount}</h2></div>
        </div>
        <div className="voting-stat-card">
          <div className="voting-stat-icon orange"><FileText size={21} /></div>
          <div><p>Ноорог</p><h2>{draftCount}</h2></div>
        </div>
      </div>

      <section className="voting-table-card">
        <div className="voting-table-heading">
          <div>
            <h3>Санал асуулгын жагсаалт</h3>
            <p>Үүсгэсэн болон нийтэлсэн санал асуулгууд</p>
          </div>
          <span className="voting-count">{filteredSurveys.length} санал асуулга</span>
        </div>

        <div className="voting-filters">
          <div className="voting-search">
            <Search size={18} />
            <input
              placeholder="Санал асуулгын нэрээр хайх..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option>Бүх төлөв</option>
            <option>Ноорог</option>
            <option>Эхлэхийг хүлээж буй</option>
            <option>Идэвхтэй</option>
            <option>Дууссан</option>
          </select>
        </div>

        <div className="voting-table-wrapper">
          <table className="voting-table">
            <thead>
              <tr>
                <th>САНАЛ АСУУЛГЫН МЭДЭЭЛЭЛ</th>
                <th>ХАМРАХ ХҮРЭЭ</th>
                <th>ХУГАЦАА</th>
                <th>ХАРИУЛТ</th>
                <th>ТӨЛӨВ</th>
                <th>ҮЙЛДЭЛ</th>
              </tr>
            </thead>
            <tbody>
              {filteredSurveys.length ? (
                filteredSurveys.map((survey) => (
                  <tr key={survey.id}>
                    <td>
                      <div className="survey-name">
                        <div className="survey-row-icon"><ClipboardList size={17} /></div>
                        <div>
                          <strong>{survey.title}</strong>
                          <span>{survey.questions.length} асуулт</span>
                        </div>
                      </div>
                    </td>
                    <td><span className="survey-audience">{survey.audience}</span></td>
                    <td>
                      <div className="survey-date">
                        <strong>{formatDate(survey.startDate)} – {formatDate(survey.endDate)}</strong>
                        <span><Clock size={12} /> {survey.startTime} – {survey.endTime}</span>
                      </div>
                    </td>
                    <td><span className="survey-responses"><Users size={14} /> {survey.responses || 0}</span></td>
                    <td>
                      <span className={`survey-status ${statusClass(survey.currentStatus)}`}>
                        {survey.currentStatus}
                      </span>
                    </td>
                    <td>
                      <div className="survey-actions">
                        <button type="button" title="Харах" onClick={() => setViewSurvey(survey)}><Eye size={16} /></button>
                        <button type="button" title="Засах" onClick={() => openEditModal(survey)}><Pencil size={16} /></button>
                        {survey.currentStatus === 'Ноорог' ? (
                          <button type="button" title="Нийтлэх" className="publish-action" onClick={() => handlePublish(survey.id)}><Send size={15} /></button>
                        ) : (
                          <button type="button" title="Ноорог болгох" onClick={() => handleUnpublish(survey.id)}><FileText size={15} /></button>
                        )}
                        <button type="button" title="Холбоос хуулах" onClick={() => copySurveyLink(survey)}><Copy size={15} /></button>
                        <button type="button" title="Устгах" className="delete-action" onClick={() => handleDelete(survey.id)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="voting-empty">
                    <ClipboardList size={30} />
                    <strong>Санал асуулга олдсонгүй</strong>
                    <span>Хайлтын нөхцөлөө өөрчлөөд үзнэ үү.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showModal && (
        <div className="voting-modal-overlay" onClick={closeModal}>
          <div className="voting-modal" onClick={(event) => event.stopPropagation()}>
            <div className="voting-modal-heading">
              <div>
                <span>САНАЛ АСУУЛГЫН УДИРДЛАГА</span>
                <h2>{selectedSurvey ? 'Санал асуулга засах' : 'Шинэ санал асуулга үүсгэх'}</h2>
                <p>Асуултуудаа үүсгэж, санал авах хугацааг тохируулна уу.</p>
              </div>
              <button type="button" onClick={closeModal}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="voting-form-field">
                <label>Санал асуулгын нэр *</label>
                <input
                  required
                  maxLength={150}
                  placeholder="Жишээ: Лифт шинэчлэх эсэх санал"
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                />
              </div>

              <div className="voting-form-field">
                <label>Тайлбар</label>
                <textarea
                  rows="2"
                  maxLength={600}
                  placeholder="Санал асуулгын зорилго, нэмэлт мэдээлэл..."
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                />
              </div>

              <div className="voting-form-field">
                <label>Хүлээн авагч *</label>
                <select value={form.audience} onChange={(event) => setForm({ ...form, audience: event.target.value })}>
                  <option>Бүх оршин суугч</option>
                  <option>1-р орц</option>
                  <option>2-р орц</option>
                  <option>3-р орц</option>
                </select>
              </div>

              <div className="voting-section-heading">
                <div><ListChecks size={17} /><strong>Асуултууд</strong></div>
                <button type="button" onClick={addQuestion}><Plus size={15} /> Асуулт нэмэх</button>
              </div>

              {form.questions.map((question, index) => (
                <div className="voting-question-card" key={question.id}>
                  <div className="voting-question-top">
                    <strong>Асуулт {index + 1}</strong>
                    {form.questions.length > 1 && (
                      <button type="button" title="Асуулт устгах" onClick={() => removeQuestion(question.id)}>
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  <div className="voting-form-field">
                    <label>Асуултын текст *</label>
                    <input
                      required
                      placeholder="Асуултаа бичнэ үү..."
                      value={question.title}
                      onChange={(event) => updateQuestion(question.id, { title: event.target.value })}
                    />
                  </div>

                  <div className="voting-form-row">
                    <div className="voting-form-field">
                      <label>Хариултын төрөл</label>
                      <select
                        value={question.type}
                        onChange={(event) => {
                          const type = event.target.value
                          updateQuestion(question.id, {
                            type,
                            options: type === 'Богино хариулт' || type === 'Урт хариулт'
                              ? []
                              : question.options?.length >= 2 ? question.options : ['Тийм', 'Үгүй'],
                          })
                        }}
                      >
                        <option>Нэг сонголт</option>
                        <option>Олон сонголт</option>
                        <option>Богино хариулт</option>
                        <option>Урт хариулт</option>
                      </select>
                    </div>

                    <label className="voting-required-toggle">
                      <input
                        type="checkbox"
                        checked={question.required}
                        onChange={(event) => updateQuestion(question.id, { required: event.target.checked })}
                      />
                      Заавал хариулах
                    </label>
                  </div>

                  {(question.type === 'Нэг сонголт' || question.type === 'Олон сонголт') && (
                    <div className="voting-options">
                      <label>Хариултын сонголтууд</label>
                      {question.options.map((option, optionIndex) => (
                        <div className="voting-option-row" key={optionIndex}>
                          <span className={question.type === 'Нэг сонголт' ? 'option-radio' : 'option-checkbox'} />
                          <input
                            required
                            value={option}
                            placeholder={`Сонголт ${optionIndex + 1}`}
                            onChange={(event) => updateOption(question.id, optionIndex, event.target.value)}
                          />
                          {question.options.length > 2 && (
                            <button type="button" onClick={() => removeOption(question.id, optionIndex)} title="Сонголт устгах">
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button type="button" className="add-option-btn" onClick={() => addOption(question.id)}>
                        <Plus size={14} /> Сонголт нэмэх
                      </button>
                    </div>
                  )}
                </div>
              ))}
                            <div className="voting-section-heading">
                <div><CalendarClock size={17} /><strong>Хугацааны тохиргоо</strong></div>
              </div>

              <div className="voting-date-grid">
                <div className="voting-form-field">
                  <label>Эхлэх огноо *</label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(event) => setForm({ ...form, startDate: event.target.value })}
                  />
                </div>
                <div className="voting-form-field">
                  <label>Эхлэх цаг *</label>
                  <input
                    type="time"
                    required
                    value={form.startTime}
                    onChange={(event) => setForm({ ...form, startTime: event.target.value })}
                  />
                </div>
                <div className="voting-form-field">
                  <label>Дуусах огноо *</label>
                  <input
                    type="date"
                    required
                    min={form.startDate}
                    value={form.endDate}
                    onChange={(event) => setForm({ ...form, endDate: event.target.value })}
                  />
                </div>
                <div className="voting-form-field">
                  <label>Дуусах цаг *</label>
                  <input
                    type="time"
                    required
                    value={form.endTime}
                    onChange={(event) => setForm({ ...form, endTime: event.target.value })}
                  />
                </div>
              </div>

              <div className="voting-settings">
                <label className="voting-setting">
                  <input
                    type="checkbox"
                    checked={form.oneResponse}
                    onChange={(event) => setForm({ ...form, oneResponse: event.target.checked })}
                  />
                  <span>
                    <strong>Нэг оршин суугч нэг удаа хариулах</strong>
                    <small>Давхар хариулт өгөхөөс сэргийлнэ.</small>
                  </span>
                </label>

                <label className="voting-setting">
                  <input
                    type="checkbox"
                    checked={form.allowAnonymous}
                    onChange={(event) => setForm({ ...form, allowAnonymous: event.target.checked })}
                  />
                  <span>
                    <strong>Нэргүй санал авах</strong>
                    <small>Хариултыг оршин суугчийн нэртэй холбохгүй.</small>
                  </span>
                </label>

                <label className="voting-setting">
                  <input
                    type="checkbox"
                    checked={form.notify}
                    onChange={(event) => setForm({ ...form, notify: event.target.checked })}
                  />
                  <span>
                    <strong>Push мэдэгдэл илгээх</strong>
                    <small>Нийтлэх үед сонгосон оршин суугчдад мэдэгдэнэ.</small>
                  </span>
                </label>
              </div>

              <div className="voting-modal-actions">
                <button type="button" className="voting-cancel-btn" onClick={closeModal}>Болих</button>
                <button type="submit" value="draft" className="voting-draft-btn">
                  <FileText size={16} /> Ноорог хадгалах
                </button>
                <button type="submit" value="publish" className="voting-publish-btn">
                  <Send size={16} /> Нийтлэх
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewSurvey && (
        <div className="voting-modal-overlay" onClick={() => setViewSurvey(null)}>
          <div className="voting-modal voting-details-modal" onClick={(event) => event.stopPropagation()}>
            <div className="voting-modal-heading">
              <div>
                <span>САНАЛ АСУУЛГЫН ДЭЛГЭРЭНГҮЙ</span>
                <h2>{viewSurvey.title}</h2>
              </div>
              <button type="button" onClick={() => setViewSurvey(null)}><X size={20} /></button>
            </div>

            <div className="voting-detail-meta">
              <span className={`survey-status ${statusClass(getSurveyStatus(viewSurvey))}`}>
                {getSurveyStatus(viewSurvey)}
              </span>
              <span><Users size={14} /> {viewSurvey.audience}</span>
              <span><ClipboardList size={14} /> {viewSurvey.questions.length} асуулт</span>
            </div>

            <div className="voting-detail-grid">
              <div>
                <CalendarClock size={17} />
                <span>Эхлэх</span>
                <strong>{formatDate(viewSurvey.startDate)} {viewSurvey.startTime}</strong>
              </div>
              <div>
                <Clock size={17} />
                <span>Дуусах</span>
                <strong>{formatDate(viewSurvey.endDate)} {viewSurvey.endTime}</strong>
              </div>
              <div>
                <Users size={17} />
                <span>Нийт хариулт</span>
                <strong>{viewSurvey.responses || 0}</strong>
              </div>
              <div>
                <Bell size={17} />
                <span>Push мэдэгдэл</span>
                <strong>{viewSurvey.notify ? 'Идэвхтэй' : 'Идэвхгүй'}</strong>
              </div>
            </div>

            {viewSurvey.description && (
              <p className="voting-detail-description">{viewSurvey.description}</p>
            )}

            <div className="voting-detail-questions">
              <h3><CircleHelp size={17} /> Асуултууд</h3>
              {viewSurvey.questions.map((question, index) => (
                <div className="voting-preview-question" key={question.id}>
                  <strong>{index + 1}. {question.title}</strong>
                  <span>
                    {question.type}
                    {question.required ? ' · Заавал' : ' · Сонголттой'}
                  </span>

                  {question.options?.map((option, optionIndex) => (
                    <p key={optionIndex}>○ {option}</p>
                  ))}

                  {(question.type === 'Богино хариулт' || question.type === 'Урт хариулт') && (
                    <div className="voting-answer-placeholder">
                      {question.type === 'Урт хариулт'
                        ? 'Дэлгэрэнгүй хариулт...'
                        : 'Хариултаа бичнэ үү...'}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              className="voting-close-details"
              onClick={() => setViewSurvey(null)}
            >
              Хаах
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Voting