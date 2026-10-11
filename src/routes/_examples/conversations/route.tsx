import { Link, Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_examples/conversations')({
  component: ConversationsLayout,
})

function ConversationsLayout() {
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Demo data lives in this tab and resets on reload.
      </p>
      <nav aria-label="Conversations">
        <ul className="flex flex-wrap gap-6">
          <li>
            <Link
              to="/conversations/new"
              className="underline underline-offset-4"
            >
              New conversation
            </Link>
          </li>
          <li>
            <Link
              to="/conversations/$conversationId"
              params={{ conversationId: 'conversation-1' }}
              className="underline underline-offset-4"
            >
              Example conversation
            </Link>
          </li>
        </ul>
      </nav>
      <Outlet />
    </div>
  )
}
