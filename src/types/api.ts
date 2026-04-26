export type UserRole = 'ADMIN' | 'USER'
export type PersonType = 'INDIVIDUAL' | 'COMPANY'
export type SolutionType =
  | 'SELF_STORAGE'
  | 'COWORKING'
  | 'FISCAL_ADDRESS'
  | 'COMMERCIAL_ADDRESS'
  | 'AUDITORIUM'
  | 'NOT_SPECIFIED'
export type LeadSource =
  | 'SITE'
  | 'WHATSAPP'
  | 'PHONE_CALL'
  | 'REFERRAL'
  | 'IN_PERSON'
  | 'MARKETING_INTEGRATION'
export type EntryMethod = 'MANUAL' | 'IMPORTED' | 'INTEGRATION'
export type TaskStatus = 'PENDING' | 'COMPLETED'

export interface CredentialsDTO {
  email: string
  password: string
}

export interface FieldMessage {
  fieldName: string
  message: string
}

export interface StandardErrorResponse {
  timestamp: number
  status: number
  error: string
  message: string
  path: string
}

export interface ValidationErrorResponse extends StandardErrorResponse {
  erros: FieldMessage[]
}

export interface SortObject {
  sorted: boolean
  unsorted: boolean
  empty: boolean
}

export interface PageableObject {
  offset: number
  pageNumber: number
  pageSize: number
  paged: boolean
  unpaged: boolean
  sort: SortObject
}

export interface PageResponse<T> {
  totalPages: number
  totalElements: number
  size: number
  content: T[]
  number: number
  sort: SortObject
  numberOfElements: number
  first: boolean
  last: boolean
  pageable: PageableObject
  empty: boolean
}

export interface UserRequestDTO {
  name: string
  email: string
  password: string
}

export interface UserResponseDTO {
  id: number
  name: string
  email: string
  roles: UserRole[]
}

export interface LeadRequestDTO {
  name: string
  phone: string
  email: string
  personType?: PersonType | null
  companyName?: string | null
  interestSoluction?: SolutionType | null
  leadSource: LeadSource
  entryMethod: EntryMethod
  notes?: string | null
}

export interface LeadResponseDTO {
  id: number
  name: string
  phone: string
  email: string
  personType?: PersonType | null
  companyName?: string | null
  interestSoluction?: SolutionType | null
  leadSource: LeadSource
  entryMethod: EntryMethod
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface PipelineRequestDTO {
  title: string
}

export interface StageRequestDTO {
  name: string
  code: string
  position: number
  pipelineId: number
}

export interface StageResponseDTO {
  id: number
  name: string
  code: string
  position: number
  pipelineId: number
}

export interface PipelineResponseDTO {
  id: number
  title: string
  stages: StageResponseDTO[]
}

export interface OpportunityRequestDTO {
  leadId: number
  title: string
  definitiveSolution: SolutionType
  estimatedValue?: number | null
  pipelineId: number
  currentStageId?: number | null
  expectedCloseDate?: string | null
  notes?: string | null
}

export interface OpportunityResponseDTO {
  id: number
  leadId: number
  title: string
  definitiveSolution: SolutionType
  estimatedValue?: number | null
  pipelineId: number
  currentStageId?: number | null
  currentStageName?: string | null
  won?: boolean | null
  expectedCloseDate?: string | null
  closedAt?: string | null
  lossReason?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface OpportunityCloseDTO {
  win: boolean
  lossReason?: string | null
}

export interface TaskRequestDTO {
  title: string
  description?: string | null
  taskStatus?: TaskStatus | null
  dueDate: string
  leadId?: number | null
  opportunityId?: number | null
}

export interface TaskResponseDTO {
  id: number
  userId?: number | null
  userName?: string | null
  user?: UserResponseDTO | null
  title: string
  description?: string | null
  taskStatus?: TaskStatus | null
  dueDate: string
  leadId?: number | null
  opportunityId?: number | null
  createdAt: string
  updatedAt: string
}

export interface PaginationParams {
  page?: number
  size?: number
  sort?: string
}

export type OpportunityStatusFilter = 'OPEN' | 'WON' | 'LOST'

export type TaskDeadlineFilter = 'OVERDUE' | 'DUE_SOON'

export type TaskLinkTypeFilter = 'LEAD' | 'OPPORTUNITY'

export interface LeadFilterParams extends PaginationParams {
  search?: string
  personType?: PersonType | null
  leadSource?: LeadSource | null
}

export interface OpportunityFilterParams extends PaginationParams {
  search?: string
  status?: OpportunityStatusFilter | null
  pipelineId?: number | null
}

export interface PipelineFilterParams extends PaginationParams {
  search?: string
}

export interface TaskFilterParams extends PaginationParams {
  search?: string
  status?: TaskStatus | null
  deadline?: TaskDeadlineFilter | null
  linkType?: TaskLinkTypeFilter | null
}

export interface UserFilterParams extends PaginationParams {
  search?: string
  role?: UserRole | null
}
