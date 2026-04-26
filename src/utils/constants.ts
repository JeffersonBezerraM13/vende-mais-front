import type {
  EntryMethod,
  LeadSource,
  OpportunityStatusFilter,
  PersonType,
  SolutionType,
  TaskDeadlineFilter,
  TaskLinkTypeFilter,
  TaskStatus,
  UserRole,
} from '@/types/api'

export const DEFAULT_PAGE_SIZE = 10
export const LOCAL_VIEW_PAGE_SIZE = 8
export const REFERENCE_PAGE_SIZE = 100

export const PERSON_TYPE_LABELS: Record<PersonType, string> = {
  INDIVIDUAL: 'Pessoa Física',
  COMPANY: 'Pessoa Jurídica',
}

export const SOLUTION_LABELS: Record<SolutionType, string> = {
  SELF_STORAGE: 'Self Storage',
  COWORKING: 'Coworking',
  FISCAL_ADDRESS: 'Endereço Fiscal',
  COMMERCIAL_ADDRESS: 'Endereço Comercial',
  AUDITORIUM: 'Auditório',
  NOT_SPECIFIED: 'Não especificado',
}

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  SITE: 'Site',
  WHATSAPP: 'WhatsApp',
  PHONE_CALL: 'Ligação',
  REFERRAL: 'Indicação',
  IN_PERSON: 'Presencial',
  MARKETING_INTEGRATION: 'Integração de Marketing',
}

export const ENTRY_METHOD_LABELS: Record<EntryMethod, string> = {
  MANUAL: 'Manual',
  IMPORTED: 'Importado',
  INTEGRATION: 'Integração',
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: 'Pendente',
  COMPLETED: 'Concluída',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  USER: 'Usuário',
}

export const OPPORTUNITY_STATUS_FILTER_LABELS: Record<
  OpportunityStatusFilter,
  string
> = {
  OPEN: 'Abertas',
  WON: 'Ganhas',
  LOST: 'Perdidas',
}

export const TASK_DEADLINE_FILTER_LABELS: Record<
  TaskDeadlineFilter,
  string
> = {
  OVERDUE: 'Atrasadas',
  DUE_SOON: 'Vencendo em 3 dias',
}

export const TASK_LINK_TYPE_FILTER_LABELS: Record<
  TaskLinkTypeFilter,
  string
> = {
  LEAD: 'Vínculo: Leads',
  OPPORTUNITY: 'Vínculo: Oportunidades',
}

export const PERSON_TYPE_OPTIONS = Object.entries(PERSON_TYPE_LABELS).map(
  ([value, label]) => ({
    value: value as PersonType,
    label,
  }),
)

export const SOLUTION_OPTIONS = Object.entries(SOLUTION_LABELS).map(
  ([value, label]) => ({
    value: value as SolutionType,
    label,
  }),
)

export const LEAD_SOURCE_OPTIONS = Object.entries(LEAD_SOURCE_LABELS).map(
  ([value, label]) => ({
    value: value as LeadSource,
    label,
  }),
)

export const ENTRY_METHOD_OPTIONS = Object.entries(ENTRY_METHOD_LABELS).map(
  ([value, label]) => ({
    value: value as EntryMethod,
    label,
  }),
)

export const TASK_STATUS_OPTIONS = Object.entries(TASK_STATUS_LABELS).map(
  ([value, label]) => ({
    value: value as TaskStatus,
    label,
  }),
)

export const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({
  value: value as UserRole,
  label,
}))

export const OPPORTUNITY_STATUS_FILTER_OPTIONS = Object.entries(
  OPPORTUNITY_STATUS_FILTER_LABELS,
).map(([value, label]) => ({
  value: value as OpportunityStatusFilter,
  label,
}))

export const TASK_DEADLINE_FILTER_OPTIONS = Object.entries(
  TASK_DEADLINE_FILTER_LABELS,
).map(([value, label]) => ({
  value: value as TaskDeadlineFilter,
  label,
}))

export const TASK_LINK_TYPE_FILTER_OPTIONS = Object.entries(
  TASK_LINK_TYPE_FILTER_LABELS,
).map(([value, label]) => ({
  value: value as TaskLinkTypeFilter,
  label,
}))
