import { differenceInCalendarDays, parseISO, startOfDay } from 'date-fns'

import { listLeads } from '@/services/api/leads-service'
import { listOpportunities } from '@/services/api/opportunities-service'
import { listPipelines } from '@/services/api/pipelines-service'
import { listTasks } from '@/services/api/tasks-service'
import { listUsers } from '@/services/api/users-service'
import { fetchAllPages } from '@/services/http/pagination'
import { getOpportunityLifecycle } from '@/utils/opportunities'

export async function getDashboardSnapshot() {
  const [leadPage, pipelinePage, opportunities, tasks, users] = await Promise.all([
    listLeads({ page: 0, size: 1 }),
    listPipelines({ page: 0, size: 50, sort: 'title,asc' }),
    fetchAllPages(listOpportunities, { size: 100, sort: 'createdAt,desc' }),
    fetchAllPages(listTasks, { size: 100, sort: 'dueDate,asc' }),
    fetchAllPages(listUsers, { size: 100, sort: 'name,asc' }).catch(() => []),
  ])
  const usersById = new Map(users.map((user) => [user.id, user.name]))
  const tasksWithUserNames = tasks.map((task) => ({
    ...task,
    userName: task.userName || task.user?.name || (task.userId ? usersById.get(task.userId) : undefined),
  }))

  const openOpportunities = opportunities.filter(
    (opportunity) => getOpportunityLifecycle(opportunity) === 'open',
  )
  const wonOpportunities = opportunities.filter(
    (opportunity) => getOpportunityLifecycle(opportunity) === 'won',
  )
  const lostOpportunities = opportunities.filter(
    (opportunity) => getOpportunityLifecycle(opportunity) === 'lost',
  )
  const pendingTasks = tasksWithUserNames.filter((task) => task.taskStatus !== 'COMPLETED')
  const completedTasks = tasksWithUserNames.filter((task) => task.taskStatus === 'COMPLETED')
  const today = startOfDay(new Date())
  const overdueTasks = pendingTasks.filter(
    (task) => differenceInCalendarDays(parseISO(task.dueDate), today) < 0,
  )
  const estimatedPipelineValue = openOpportunities.reduce(
    (total, opportunity) => total + (opportunity.estimatedValue ?? 0),
    0,
  )
  const closedOpportunities = wonOpportunities.length + lostOpportunities.length
  const winRate = closedOpportunities
    ? (wonOpportunities.length / closedOpportunities) * 100
    : 0
  const averageTicket = openOpportunities.length
    ? estimatedPipelineValue / openOpportunities.length
    : 0

  const stageDistribution = Object.entries(
    openOpportunities.reduce<Record<string, number>>((accumulator, opportunity) => {
      const stageName = opportunity.currentStageName || 'Sem stage'
      accumulator[stageName] = (accumulator[stageName] ?? 0) + 1
      return accumulator
    }, {}),
  )
    .map(([stage, total]) => ({ stage, total }))
    .sort((left, right) => right.total - left.total)

  return {
    totals: {
      leads: leadPage.totalElements,
      opportunities: opportunities.length,
      opportunitiesOpen: openOpportunities.length,
      opportunitiesWon: wonOpportunities.length,
      opportunitiesLost: lostOpportunities.length,
      estimatedPipelineValue,
      winRate,
      averageTicket,
      tasksPending: pendingTasks.length,
      tasksCompleted: completedTasks.length,
      tasksOverdue: overdueTasks.length,
      pipelines: pipelinePage.totalElements,
    },
    recentOpportunities: opportunities.slice(0, 6),
    upcomingTasks: pendingTasks.slice(0, 6),
    pipelines: pipelinePage.content,
    stageDistribution,
  }
}
