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
  return (
    <article>
      <Card>
        <CardHeader>
          <CardTitle>
            <h1>Profile form</h1>
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
