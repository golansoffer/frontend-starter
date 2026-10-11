import { createFileRoute } from '@tanstack/react-router'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ProfileForm } from '@/features/profile/profile-form'

export const Route = createFileRoute('/_examples/profile')({
  component: ProfileRoute,
})

function ProfileRoute() {
  const title = 'Profile form'
  return (
    <article>
      <title>{title}</title>
      <Card>
        <CardHeader>
          <CardTitle>
            <h1>{title}</h1>
          </CardTitle>
          <CardDescription>
            <p>Try the validation. This example does not save data.</p>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm />
        </CardContent>
      </Card>
    </article>
  )
}
