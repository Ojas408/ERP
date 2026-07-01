import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Check, CreditCard, Building } from "lucide-react"
import { createCheckoutSession } from "../services/api"
import { useAuth } from "../contexts/AuthContext"

export default function BillingPage() {
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  // In a real app we'd fetch the current tenant's subscription status.
  const [currentPlan, setCurrentPlan] = useState("free")

  const handleSubscribe = async (plan: string) => {
    setLoading(true)
    try {
      const data = await createCheckoutSession(plan)
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error("Failed to start checkout", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Billing & Subscriptions</h2>
        <p className="text-muted-foreground">Manage your workspace subscription and payment methods.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Free Plan */}
        <Card className={currentPlan === 'free' ? 'border-primary shadow-md' : ''}>
          <CardHeader>
            <CardTitle>Free</CardTitle>
            <CardDescription>Perfect for testing the platform</CardDescription>
            <div className="mt-4 flex items-baseline text-3xl font-bold">
              $0
              <span className="ml-1 text-xl font-medium text-muted-foreground">/mo</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 1 Workspace</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Up to 5 Users</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Basic Reporting</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant={currentPlan === 'free' ? "outline" : "default"} disabled={currentPlan === 'free'}>
              {currentPlan === 'free' ? "Current Plan" : "Downgrade"}
            </Button>
          </CardFooter>
        </Card>

        {/* Pro Plan */}
        <Card className={currentPlan === 'pro' ? 'border-primary shadow-md' : ''}>
          <CardHeader>
            <CardTitle>Pro</CardTitle>
            <CardDescription>For growing construction companies</CardDescription>
            <div className="mt-4 flex items-baseline text-3xl font-bold">
              $299
              <span className="ml-1 text-xl font-medium text-muted-foreground">/mo</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Unlimited Workspaces</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Up to 50 Users</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Advanced Analytics</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Priority Support</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => handleSubscribe('pro')} disabled={loading || currentPlan === 'pro'}>
              {currentPlan === 'pro' ? "Current Plan" : "Upgrade to Pro"}
            </Button>
          </CardFooter>
        </Card>

        {/* Enterprise Plan */}
        <Card className={currentPlan === 'enterprise' ? 'border-primary shadow-md' : ''}>
          <CardHeader>
            <CardTitle>Enterprise</CardTitle>
            <CardDescription>Full feature access for large teams</CardDescription>
            <div className="mt-4 flex items-baseline text-3xl font-bold">
              $999
              <span className="ml-1 text-xl font-medium text-muted-foreground">/mo</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Unlimited Everything</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Dedicated Account Manager</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Custom Integrations</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> SLA Guarantee</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => handleSubscribe('enterprise')} disabled={loading || currentPlan === 'enterprise'}>
              {currentPlan === 'enterprise' ? "Current Plan" : "Contact Sales"}
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" /> Payment Methods
          </CardTitle>
          <CardDescription>Manage your saved credit cards.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No payment methods saved yet. Upgrade your plan to add one.</p>
        </CardContent>
      </Card>
    </div>
  )
}
