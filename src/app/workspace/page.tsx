import WorkspaceClient from './WorkspaceClient'

interface WorkspacePageProps {
  searchParams: Promise<{ project?: string }>
}

export default async function WorkspacePage({
  searchParams,
}: WorkspacePageProps) {
  const { project = 'default' } = await searchParams
  return <WorkspaceClient projectId={project} />
}
