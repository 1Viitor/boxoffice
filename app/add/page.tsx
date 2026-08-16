import { IntakeFlow } from "@/components/IntakeFlow";

export default function AddMoviePage() {
  return (
    <div className="py-8">
      <section className="mx-auto mb-8 max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Add a movie
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-zinc-400">
          Search The Numbers, confirm a domestic theatrical release, and add it
          to your tracker (max 20).
        </p>
      </section>
      <div className="mx-auto max-w-2xl">
        <IntakeFlow />
      </div>
    </div>
  );
}
