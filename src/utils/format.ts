import { format, formatDistanceToNowStrict, isValid, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatDate(date?: string | null, emptyLabel = 'Sem Data') {
  if (!date) {
    return emptyLabel
  }

  const parsed = parseISO(date)

  return isValid(parsed) ? format(parsed, 'dd/MM/yyyy', { locale: ptBR }) : date
}

export function formatDateTime(date?: string | null, emptyLabel = 'Sem data') {
  if (!date) {
    return emptyLabel
  }

  const parsed = parseISO(date)

  return isValid(parsed)
    ? format(parsed, "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })
    : date
}

export function formatRelativeDate(date?: string | null, emptyLabel = 'Sem Data') {
  if (!date) {
    return emptyLabel
  }

  const parsed = parseISO(date)

  return isValid(parsed)
    ? formatDistanceToNowStrict(parsed, { addSuffix: true, locale: ptBR })
    : date
}

export function formatCurrency(value?: number | null) {
  if (value == null || Number.isNaN(value)) {
    return 'Não Informado'
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatNumber(value?: number | null) {
  if (value == null || Number.isNaN(value)) {
    return '0'
  }

  return new Intl.NumberFormat('pt-BR').format(value)
}

export function formatEnumLabel(value?: string | null) {
  if (!value) {
    return 'Não Informado'
  }

  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function getInitials(value?: string | null) {
  if (!value) {
    return 'VM'
  }

  const parts = value
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)

  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('')
}

export function truncateText(value?: string | null, max = 80) {
  if (!value) {
    return 'Sem observacões'
  }

  if (value.length <= max) {
    return value
  }

  return `${value.slice(0, max - 1)}...`
}

export const maskPhone = (value?: string | null) => {
  if (!value) return "";

  // Remove tudo que não for número
  let unmasked = value.replace(/\D/g, "");

  // Limita a 11 caracteres (DDD + 9 dígitos)
  unmasked = unmasked.slice(0, 11);

  // Aplica a formatação (XX) XXXXX-XXXX
  if (unmasked.length > 2) {
    unmasked = unmasked.replace(/^(\d{2})(\d)/g, "($1) $2");
  }
  if (unmasked.length > 7) {
    unmasked = unmasked.replace(/(\d{5})(\d)/, "$1-$2");
  }

  return unmasked;
};
