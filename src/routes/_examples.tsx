import { Link, Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_examples')({ component: ExampleLayout })

function ExampleLayout() {
  return (
    <div className="space-y-8">
      <nav aria-label="Examples">
        <ul className="flex flex-wrap gap-6">
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
