import { Link, Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_examples')({ component: ExampleLayout })

function ExampleLayout() {
  return (
    <div className="space-y-8">
      <nav aria-label="Examples">
        <ul className="flex flex-wrap gap-6">
          <li>
            <Link to="/async-button" className="underline underline-offset-4">
              1. Async button
            </Link>
          </li>
          <li>
            <Link to="/tasks" className="underline underline-offset-4">
              2. URL state
            </Link>
          </li>
          <li>
            <Link
              to="/conversations/new"
              className="underline underline-offset-4"
            >
              3. Conversations
            </Link>
          </li>
          <li>
            <Link
              to="/"
              activeOptions={{ exact: true }}
              className="underline underline-offset-4"
            >
              Project data
            </Link>
          </li>
          <li>
            <Link to="/profile" className="underline underline-offset-4">
              Profile form
            </Link>
          </li>
        </ul>
      </nav>
      <Outlet />
    </div>
  )
}
