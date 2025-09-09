import { AdTargetingForm } from '../components/AdTargetingForm'

export default function Advertise() {
  return (
    <section className="py-8 sm:py-12 lg:py-16">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8">Create Campaign</h1>
        <AdTargetingForm />
      </div>
    </section>
  )
}