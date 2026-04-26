import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, Pencil, Plus, Search, Trash2, UsersRound } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { DataTable } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { Loader } from '@/components/ui/loader'
import { PageHeader } from '@/components/ui/page-header'
import { Pagination } from '@/components/ui/pagination'
import { LeadDetailsDialog } from '@/features/leads/lead-details-dialog'
import { LeadFormDialog } from '@/features/leads/lead-form-dialog'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { createLead, deleteLead, listLeads, updateLead } from '@/services/api/leads-service'
import { getApiErrorInfo } from '@/services/http/errors'
import {
  DEFAULT_PAGE_SIZE,
  LEAD_SOURCE_LABELS,
  LEAD_SOURCE_OPTIONS,
  PERSON_TYPE_LABELS,
  PERSON_TYPE_OPTIONS,
} from '@/utils/constants'
import { formatDate, formatNumber, maskPhone } from '@/utils/format'

import type { LeadFormValues } from '@/features/leads/lead-schema'
import type {
  EntryMethod,
  LeadFilterParams,
  LeadRequestDTO,
  LeadResponseDTO,
  LeadSource,
  PersonType,
} from '@/types/api'

const LEADS_SORT = 'createdAt,desc'

function toLeadPayload(values: LeadFormValues): LeadRequestDTO {
  return {
    name: values.name,
    phone: values.phone,
    email: values.email,
    personType: values.personType || undefined,
    companyName: values.companyName || undefined,
    interestSoluction: values.interestSoluction || undefined,
    leadSource: values.leadSource as LeadSource,
    entryMethod: values.entryMethod as EntryMethod,
    notes: values.notes || undefined,
  }
}

function buildLeadListParams({
  leadSource,
  page,
  personType,
  search,
}: {
  search: string
  personType: PersonType | ''
  leadSource: LeadSource | ''
  page: number
}): LeadFilterParams {
  return {
    search: search || undefined,
    personType: personType || undefined,
    leadSource: leadSource || undefined,
    page,
    size: DEFAULT_PAGE_SIZE,
    sort: LEADS_SORT,
  }
}

function buildLeadCountParams({
  leadSource,
  personType,
  search,
}: {
  search: string
  personType?: PersonType
  leadSource: LeadSource | ''
}): LeadFilterParams {
  return {
    search: search || undefined,
    personType,
    leadSource: leadSource || undefined,
    page: 0,
    size: 1,
    sort: LEADS_SORT,
  }
}

export default function LeadsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [personTypeFilter, setPersonTypeFilter] = useState<PersonType | ''>('')
  const [sourceFilter, setSourceFilter] = useState<LeadSource | ''>('')
  const [selectedLead, setSelectedLead] = useState<LeadResponseDTO | null>(null)
  const [editingLead, setEditingLead] = useState<LeadResponseDTO | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [leadToDelete, setLeadToDelete] = useState<LeadResponseDTO | null>(null)

  const debouncedSearch = useDebouncedValue(search)
  const leadListParams = buildLeadListParams({
    search: debouncedSearch,
    personType: personTypeFilter,
    leadSource: sourceFilter,
    page,
  })
  const leadStatsParams = {
    search: debouncedSearch,
    leadSource: sourceFilter,
  }

  const leadsQuery = useQuery({
    queryKey: ['leads', 'list', leadListParams],
    queryFn: () => listLeads(leadListParams),
    placeholderData: (previousData) => previousData,
  })

  const companiesCountQuery = useQuery({
    queryKey: [
      'leads',
      'count',
      buildLeadCountParams({ ...leadStatsParams, personType: 'COMPANY' }),
    ],
    queryFn: async () =>
      (
        await listLeads(
          buildLeadCountParams({ ...leadStatsParams, personType: 'COMPANY' }),
        )
      ).totalElements,
  })

  const individualsCountQuery = useQuery({
    queryKey: [
      'leads',
      'count',
      buildLeadCountParams({ ...leadStatsParams, personType: 'INDIVIDUAL' }),
    ],
    queryFn: async () =>
      (
        await listLeads(
          buildLeadCountParams({ ...leadStatsParams, personType: 'INDIVIDUAL' }),
        )
      ).totalElements,
  })

  const createMutation = useMutation({
    mutationFn: createLead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: LeadRequestDTO }) =>
      updateLead(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteLead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['leads'] })
      setLeadToDelete(null)
    },
  })

  if (leadsQuery.isLoading) {
    return <Loader label="Carregando leads..." />
  }

  if (leadsQuery.isError || !leadsQuery.data) {
    return (
      <EmptyState
        title="Não foi possível carregar os leads."
        description="Verifique a disponibilidade do backend e tente novamente."
      />
    )
  }

  const leadsPage = leadsQuery.data
  const leads = leadsPage.content
  const companiesCount =
    companiesCountQuery.data ??
    leads.filter((lead) => lead.personType === 'COMPANY').length
  const individualsCount =
    individualsCountQuery.data ??
    leads.filter((lead) => lead.personType === 'INDIVIDUAL').length

  const handleSaveLead = async (values: LeadFormValues) => {
    const payload = toLeadPayload(values)

    if (editingLead) {
      await updateMutation.mutateAsync({ id: editingLead.id, payload })
      setEditingLead(null)
      return
    }

    await createMutation.mutateAsync(payload)
  }

  const deleteLeadConfirmed = async () => {
    if (!leadToDelete) {
      return
    }

    try {
      await deleteMutation.mutateAsync(leadToDelete.id)
    } catch (error) {
      const apiError = getApiErrorInfo(error)
      throw new Error(apiError.message)
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Gestão de Leads"
        actions={
          <Button
            onClick={() => {
              setEditingLead(null)
              setIsFormOpen(true)
            }}
            title="Criar novo lead"
          >
            <Plus size={16} />
            Novo lead
          </Button>
        }
      />

      <section className="stats-grid stats-grid-compact">
        <Card className="mini-stat-card">
          <span>Total</span>
          <strong>{formatNumber(leadsPage.totalElements)}</strong>
        </Card>
        <Card className="mini-stat-card">
          <span>Pessoas Jurídicas</span>
          <strong>{formatNumber(companiesCount)}</strong>
        </Card>
        <Card className="mini-stat-card">
          <span>Pessoas Físicas</span>
          <strong>{formatNumber(individualsCount)}</strong>
        </Card>
      </section>

      <Card>
        <div className="toolbar">
          <div className="search-field">
            <Search size={16} />
            <input
              className="input"
              placeholder="Busque por nome, e-mail, telefone ou empresa..."
              value={search}
              onChange={(event) => {
                setPage(0)
                setSearch(event.target.value)
              }}
            />
          </div>
          <div className="toolbar-filters">
            <select
              className="input"
              value={personTypeFilter}
              onChange={(event) => {
                setPage(0)
                setPersonTypeFilter(event.target.value as PersonType | '')
              }}
            >
              <option value="">Todos os tipos</option>
              {PERSON_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              className="input"
              value={sourceFilter}
              onChange={(event) => {
                setPage(0)
                setSourceFilter(event.target.value as LeadSource | '')
              }}
            >
              <option value="">Todas as origens</option>
              {LEAD_SOURCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DataTable
          data={leads}
          rowKey={(lead) => lead.id}
          emptyState={
            <EmptyState
              icon={<UsersRound size={18} />}
              title="Nenhum lead encontrado."
              description="Ajuste os filtros ou cadastre um novo registro para continuar."
            />
          }
          columns={[
            {
              key: 'lead',
              header: 'Lead',
              cell: (lead) => (
                <div className="cell-stack">
                  <strong>{lead.name}</strong>
                  {lead.personType !== 'INDIVIDUAL' && lead.companyName ? (
                    <span className="text-gray-500 text-sm">{lead.companyName}</span>
                  ) : null}
                </div>
              ),
            },
            {
              key: 'contact',
              header: 'Contato',
              cell: (lead) => (
                <div className="cell-stack">
                  <span>{maskPhone(lead.phone)}</span>
                  <span>{lead.email}</span>
                </div>
              ),
            },
            {
              key: 'classification',
              header: 'Classificação',
              cell: (lead) => (
                <div className="badge-list">
                  <Badge tone={lead.personType === 'COMPANY' ? 'company' : 'info'}>
                    {lead.personType ? PERSON_TYPE_LABELS[lead.personType] : 'Não informado'}
                  </Badge>
                  <Badge tone="neutral">{LEAD_SOURCE_LABELS[lead.leadSource]}</Badge>
                </div>
              ),
            },
            {
              key: 'createdAt',
              header: 'Cadastro',
              cell: (lead) => <span>{formatDate(lead.createdAt)}</span>,
            },
            {
              key: 'actions',
              header: 'Ações',
              className: 'cell-actions',
              cell: (lead) => (
                <div className="table-actions">
                  <button
                    className="icon-button"
                    onClick={() => setSelectedLead(lead)}
                    title="Ver detalhes do lead"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    className="icon-button"
                    onClick={() => {
                      setEditingLead(lead)
                      setIsFormOpen(true)
                    }}
                    title="Editar lead"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="icon-button danger"
                    onClick={() => setLeadToDelete(lead)}
                    title="Excluir lead"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ),
            },
          ]}
        />

        <Pagination
          page={leadsPage.number}
          totalPages={leadsPage.totalPages}
          totalItems={leadsPage.totalElements}
          onPageChange={setPage}
        />
      </Card>

      <LeadFormDialog
        open={isFormOpen}
        lead={editingLead}
        loading={createMutation.isPending || updateMutation.isPending}
        onOpenChange={(open) => {
          setIsFormOpen(open)
          if (!open) {
            setEditingLead(null)
          }
        }}
        onSubmit={handleSaveLead}
      />

      <LeadDetailsDialog
        lead={selectedLead}
        open={Boolean(selectedLead)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedLead(null)
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(leadToDelete)}
        title="Excluir lead"
        description={
          leadToDelete
            ? `Deseja remover o lead ${leadToDelete.name}?`
            : 'Deseja remover este lead?'
        }
        loading={deleteMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setLeadToDelete(null)
          }
        }}
        onConfirm={deleteLeadConfirmed}
      />
    </div>
  )
}
